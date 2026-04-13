export interface Env {
  DB: D1Database;
}

// All room IDs known in the SRCC timetable system
const ALL_ROOM_IDS = [
  "CL1","CL2","CLIB",
  "PB2","PB3","PB4",
  "R1","R2","R3","R4","R5","R6","R7","R8","R10",
  "R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23","R24","R25",
  "R26","R27","R28","R29","R30","R31","R32","R33","R34","R35","R37",
  "SCR1","SCR2","SCR3","SCR4",
  "T1","T2","T3","T4","T5","T6","T7","T8","T9",
  "T11","T12","T13","T14","T15","T16","T17","T18",
  "T23","T24","T25","T26","T27","T29",
  "T31","T32","T33","T34","T35","T36","T37","T38","T39","T40",
  "T41","T42","T43","T44","T45","T46","T48","T49","T50","T51","T53","T54"
];

// Rooms to completely skip
const IGNORED_ROOMS = ["PRINCIPAL OFFICE", "PLAYGROUND", "SEMINAR HALL"];

const TIMETABLE_BASE_URL = "https://srcccollegetimetable.in/admin/timetable_printpreview.php?mode=print&roomno=";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Map time slot columns to our slot indices (0-8)
const COL_TO_SLOT: Record<number, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4,
  // col 5 is lunch break - skip
  6: 5, 7: 6, 8: 7, 9: 8
};

function classifyRoomType(id: string): string {
  const upper = id.toUpperCase();
  if (upper.startsWith("CL")) return "Lab";
  if (upper.startsWith("SCR")) return "Seminar Room";
  if (upper.startsWith("T")) return "Tutorial Room";
  return "Lecture Hall";
}

// Refined extraction logic for teacher IDs
function extractTeacherId(segment: string): string | null {
  const parts = segment.split('-').map(p => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (/^[A-Za-z]{1,4}$/.test(p)) {
      return p.toUpperCase();
    }
  }
  return null;
}

// Enhanced HTML parser - extracts both empty slots and occupying teachers
function parseRoomHtml(html: string): { emptySlots: Record<string, number[]>, occupiedBy: Record<string, Record<number, string[]>> } {
  const emptySlots: Record<string, number[]> = {};
  const occupiedBy: Record<string, Record<number, string[]>> = {};

  for (const day of DAY_NAMES) {
    emptySlots[day] = [];
    occupiedBy[day] = {};

    const dayRegex = new RegExp(
      `<td[^>]*>\\s*${day}\\s*</td>([\\s\\S]*?)(?:</tr>)`,
      'i'
    );
    const dayMatch = html.match(dayRegex);
    if (!dayMatch) continue;

    const rowContent = dayMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(tdMatch[0]);
    }

    for (let colIdx = 0; colIdx < cells.length; colIdx++) {
      const slotIdx = COL_TO_SLOT[colIdx];
      if (slotIdx === undefined) continue;

      const cell = cells[colIdx];
      const hasArrayStyle = cell.includes('style="Array');
      
      const textContent = cell
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/__+/g, '|') // use pipe as temporary marker for separators
        .replace(/\d+\.\s*/g, '')
        .trim();

      const isActuallyEmpty = hasArrayStyle && textContent.length === 0;

      if (isActuallyEmpty) {
        emptySlots[day].push(slotIdx);
      } else {
        const segments = textContent.split('|').map(s => s.trim()).filter(s => s.length > 0);
        const teachers: string[] = [];
        for (const segment of segments) {
          const tid = extractTeacherId(segment);
          if (tid && !teachers.includes(tid)) {
            teachers.push(tid);
          }
        }
        if (teachers.length > 0) {
          occupiedBy[day][slotIdx] = teachers;
        }
      }
    }
  }

  return { emptySlots, occupiedBy };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;

  // Use TransformStream to send real-time progress to the client
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const body = await context.request.json() as any;
  const roomIdsToProcess: string[] = body.roomIds || [];
  const isFirstBatch: boolean = body.isFirstBatch || false;
  const totalRooms: number = body.totalRooms || roomIdsToProcess.length;
  const processedCount: number = body.processedCount || 0;

  // Run the sync in the background
  const syncProcess = async () => {
    try {
      // Ensure table exists
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS campus_rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        emptySlots TEXT NOT NULL,
        occupiedBy TEXT NOT NULL DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).run();

      // Clear ALL existing room data ONLY on the first batch
      if (isFirstBatch) {
        await env.DB.prepare("DELETE FROM campus_rooms").run();
        await sendEvent({
          type: 'start',
          total: totalRooms,
          message: `Starting sync for ${totalRooms} rooms in batches...`
        });
      }

      let processed = processedCount;
      let errors = 0;
      const results: any[] = [];

      for (const roomId of roomIdsToProcess) {
        if (IGNORED_ROOMS.some(ignored => roomId.toUpperCase() === ignored.replace(/\s+/g, ''))) {
          await sendEvent({
            type: 'skip',
            room: roomId,
            processed: ++processed,
            message: `Skipped ${roomId} (ignored)`
          });
          continue;
        }

        try {
          const url = `${TIMETABLE_BASE_URL}${encodeURIComponent(roomId)}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'SRCC-Admin-Portal/1.0',
              'Accept': 'text/html'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const html = await response.text();
          const { emptySlots, occupiedBy } = parseRoomHtml(html);
          const roomType = classifyRoomType(roomId);

          // Save to D1
          await env.DB.prepare(`
            INSERT INTO campus_rooms (id, name, type, emptySlots, occupiedBy, last_updated)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              type=excluded.type,
              emptySlots=excluded.emptySlots,
              occupiedBy=excluded.occupiedBy,
              last_updated=CURRENT_TIMESTAMP
          `).bind(
            roomId.toUpperCase(),
            roomId.toUpperCase(),
            roomType,
            JSON.stringify(emptySlots),
            JSON.stringify(occupiedBy)
          ).run();

          results.push({ id: roomId, type: roomType, emptySlots, occupiedBy });

          await sendEvent({
            type: 'progress',
            room: roomId,
            processed: ++processed,
            total: totalRooms,
            emptySlotCount: Object.values(emptySlots).flat().length,
            message: `✅ ${roomId} synced (${Object.values(emptySlots).flat().length} free slots)`
          });

          // Small delay between requests to be polite
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (err: any) {
          errors++;
          processed++;
          await sendEvent({
            type: 'error',
            room: roomId,
            processed,
            message: `❌ ${roomId}: ${err.message}`
          });
        }
      }

      await sendEvent({
        type: 'complete',
        total: totalRooms,
        processed,
        errors,
        roomsSynced: results.length,
        batchComplete: true,
        message: isFirstBatch && totalRooms === results.length ? `Sync complete!` : `Batch complete (${results.length} rooms).`
      });

    } catch (err: any) {
      await sendEvent({
        type: 'fatal',
        message: `Fatal error: ${err.message}`
      });
    } finally {
      await writer.close();
    }
  };

  // Start sync in background
  context.waitUntil(syncProcess());

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
};

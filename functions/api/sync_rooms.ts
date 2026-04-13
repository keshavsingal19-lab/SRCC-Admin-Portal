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

const TIMETABLE_BASE_URL = "https://srcccollegetimetable.in/admin/timetable_printpreview.php?mode=print&room=";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Map time slot columns to our slot indices (0-8)
// The website has 10 columns after the day label:
//   col 0 = 8:30-9:30  -> slot 0
//   col 1 = 9:30-10:30 -> slot 1
//   col 2 = 10:30-11:30 -> slot 2
//   col 3 = 11:30-12:30 -> slot 3
//   col 4 = 12:30-1:30  -> slot 4
//   col 5 = 1:30-2:00   -> LUNCH (skip)
//   col 6 = 2:00-3:00   -> slot 5
//   col 7 = 3:00-4:00   -> slot 6
//   col 8 = 4:00-5:00   -> slot 7
//   col 9 = 5:00-6:00   -> slot 8
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

// Minimal HTML parser - extract <td> contents between <tr> tags for each day row
function parseRoomHtml(html: string): Record<string, number[]> {
  const emptySlots: Record<string, number[]> = {};

  for (const day of DAY_NAMES) {
    emptySlots[day] = [];

    // Find the row that contains this day name
    // Pattern: <td>Monday</td> followed by up to 10 <td>...</td> cells
    const dayRegex = new RegExp(
      `<td[^>]*>\\s*${day}\\s*</td>([\\s\\S]*?)(?:</tr>)`,
      'i'
    );
    const dayMatch = html.match(dayRegex);
    if (!dayMatch) continue;

    const rowContent = dayMatch[1];

    // Extract all <td>...</td> blocks in this row
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(tdMatch[0]); // full td tag including attributes
    }

    // Each cell corresponds to a time column (0-9)
    for (let colIdx = 0; colIdx < cells.length; colIdx++) {
      const slotIdx = COL_TO_SLOT[colIdx];
      if (slotIdx === undefined) continue; // lunch break column

      const cell = cells[colIdx];
      
      // A cell is EMPTY if:
      // 1. Its style contains "Array" (the website outputs "Array" when no bg color)
      //    AND it has no meaningful text content
      // 2. OR its text content is only whitespace/nbsp
      const hasArrayStyle = cell.includes('style="Array');
      
      // Strip all HTML tags and check for meaningful text
      const textContent = cell
        .replace(/<style[\s\S]*?<\/style>/gi, '')  // remove inline <style> blocks
        .replace(/<[^>]+>/g, '')                     // remove all tags
        .replace(/&nbsp;/gi, '')                     // remove nbsp
        .replace(/__+/g, '')                         // remove separator lines
        .replace(/\d+\.\s*/g, '')                    // remove numbering like "1. "
        .trim();

      if (hasArrayStyle && textContent.length === 0) {
        emptySlots[day].push(slotIdx);
      }
    }
  }

  return emptySlots;
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

  // Run the sync in the background while streaming events
  const syncProcess = async () => {
    try {
      // Ensure table exists
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS campus_rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        emptySlots TEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).run();

      // Clear ALL existing room data first (complete overwrite)
      await env.DB.prepare("DELETE FROM campus_rooms").run();

      await sendEvent({
        type: 'start',
        total: ALL_ROOM_IDS.length,
        message: `Starting sync for ${ALL_ROOM_IDS.length} rooms...`
      });

      let processed = 0;
      let errors = 0;
      const results: any[] = [];

      for (const roomId of ALL_ROOM_IDS) {
        // Check if this room should be ignored
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
          const emptySlots = parseRoomHtml(html);
          const roomType = classifyRoomType(roomId);

          // Save to D1
          await env.DB.prepare(`
            INSERT INTO campus_rooms (id, name, type, emptySlots, last_updated)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              type=excluded.type,
              emptySlots=excluded.emptySlots,
              last_updated=CURRENT_TIMESTAMP
          `).bind(
            roomId.toUpperCase(),
            roomId.toUpperCase(),
            roomType,
            JSON.stringify(emptySlots)
          ).run();

          results.push({ id: roomId, type: roomType, emptySlots });

          await sendEvent({
            type: 'progress',
            room: roomId,
            processed: ++processed,
            total: ALL_ROOM_IDS.length,
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
        total: ALL_ROOM_IDS.length,
        processed,
        errors,
        roomsSynced: results.length,
        message: `Sync complete! ${results.length} rooms updated, ${errors} errors.`
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

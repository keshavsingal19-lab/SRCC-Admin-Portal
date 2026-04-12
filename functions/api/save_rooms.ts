export interface Env {
  DB: D1Database;
  ROOM_PYTHON_API_URL: string;
  STUDENT_APP_URL: string;
  TEACHER_APP_URL: string;
  WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Ensure campus_rooms table exists
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS campus_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      emptySlots TEXT NOT NULL,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).run();

    // Forward the PDF to Hugging Face Space
    const PYTHON_API_URL = `${env.ROOM_PYTHON_API_URL}/parse-rooms`;

    const pythonFormData = new FormData();
    pythonFormData.append('file', file);

    const pythonResponse = await fetch(PYTHON_API_URL, {
      method: 'POST',
      body: pythonFormData
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      return new Response(JSON.stringify({ error: `Parser Error: ${errorText}` }), {
        status: pythonResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const parsedData = await pythonResponse.json() as { success: boolean; error?: string; rooms: any[] };

    if (!parsedData.success) {
      return new Response(JSON.stringify({ error: parsedData.error || "Python parser failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Save to D1 using UPSERT
    const insertStmt = env.DB.prepare(`
      INSERT INTO campus_rooms (id, name, type, emptySlots, last_updated)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        type=excluded.type,
        emptySlots=excluded.emptySlots,
        last_updated=CURRENT_TIMESTAMP
    `);

    const batch = parsedData.rooms.map((room: any) =>
      insertStmt.bind(
        room.id.toUpperCase(),
        room.name || room.id.toUpperCase(),
        room.type,
        JSON.stringify(room.emptySlots)
      )
    );

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    // Broadcast to Ecosystem
    const studentUrl = env.STUDENT_APP_URL || 'http://127.0.0.1:3002';
    const teacherUrl = env.TEACHER_APP_URL || 'http://127.0.0.1:3003';
    
    const payload = {
      action: "save_rooms",
      rooms: parsedData.rooms
    };
    
    // Fire and forget webhooks
    Promise.allSettled([
      fetch(`${studentUrl}/webhook/save_rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WEBHOOK_SECRET || 'dev_secret'}` },
        body: JSON.stringify(payload)
      }),
      fetch(`${teacherUrl}/webhook/save_rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WEBHOOK_SECRET || 'dev_secret'}` },
        body: JSON.stringify(payload)
      })
    ]).catch(e => console.error("Webhook broadcast error:", e));

    return new Response(JSON.stringify({
      success: true,
      total: parsedData.rooms.length,
      message: `Successfully processed ${parsedData.rooms.length} rooms!`
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export interface Env {
  DB: D1Database;
  PYTHON_API_URL: string;
  STUDENT_APP_URL: string;
  TEACHER_APP_URL: string;
  WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const teacherId = formData.get('teacherId');

    if (!file || !teacherId) {
      return new Response(JSON.stringify({ error: "Missing file or Teacher ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Ensure timetable_slots table exists
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS timetable_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      subject TEXT,
      room TEXT,
      batch TEXT,
      class_type TEXT
    )`).run();

    // Forward the PDF to Hugging Face Space
    const PYTHON_API_URL = `${env.PYTHON_API_URL}/parse-pdf`;

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

    const parsedData = await pythonResponse.json() as { success: boolean; error?: string; schedule: any[] };

    if (!parsedData.success) {
      return new Response(JSON.stringify({ error: parsedData.error || "Python parser failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Clear old slots for this teacher to prevent duplicates
    await env.DB.prepare("DELETE FROM timetable_slots WHERE teacher_id = ?")
      .bind(teacherId)
      .run();

    // Insert the newly parsed slots
    const insertStmt = env.DB.prepare(`
      INSERT INTO timetable_slots (teacher_id, day_of_week, start_time, end_time, subject, room, batch, class_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = parsedData.schedule.map((slot: any) =>
      insertStmt.bind(
        teacherId,
        slot.day,
        slot.startTime,
        slot.endTime,
        slot.subject,
        slot.room,
        slot.batch,
        slot.classType
      )
    );

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    // Broadcast to Ecosystem
    const studentUrl = env.STUDENT_APP_URL || 'http://127.0.0.1:3002';
    const teacherUrl = env.TEACHER_APP_URL || 'http://127.0.0.1:3003';
    
    const payload = {
      action: "save_timetable",
      teacherId: teacherId,
      schedule: parsedData.schedule
    };
    
    // Fire and forget webhooks
    Promise.allSettled([
      fetch(`${studentUrl}/webhook/save_timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WEBHOOK_SECRET || 'dev_secret'}` },
        body: JSON.stringify(payload)
      }),
      fetch(`${teacherUrl}/webhook/save_timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WEBHOOK_SECRET || 'dev_secret'}` },
        body: JSON.stringify(payload)
      })
    ]).catch(e => console.error("Webhook broadcast error:", e));

    return new Response(JSON.stringify({
      success: true,
      count: parsedData.schedule.length,
      message: `Successfully processed ${parsedData.schedule.length} slots!`
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

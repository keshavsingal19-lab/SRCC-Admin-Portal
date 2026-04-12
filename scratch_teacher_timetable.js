export async function onRequestPost(context) {
  const { request, env } = context;

  // Verify Authorization
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = env.WEBHOOK_SECRET || "dev_secret";
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const payload = await request.json();
    if (payload.action !== "save_timetable" || !payload.schedule || !payload.teacherId) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    // Ensure table exists
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

    // Clear old
    await env.DB.prepare("DELETE FROM timetable_slots WHERE teacher_id = ?")
      .bind(payload.teacherId)
      .run();

    // Insert new
    const insertStmt = env.DB.prepare(`
      INSERT INTO timetable_slots (teacher_id, day_of_week, start_time, end_time, subject, room, batch, class_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const batch = payload.schedule.map(slot =>
      insertStmt.bind(
        payload.teacherId, slot.day, slot.startTime, slot.endTime, slot.subject, slot.room, slot.batch, slot.classType
      )
    );

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook accepted." }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

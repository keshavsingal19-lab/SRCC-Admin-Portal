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
    if (payload.action !== "save_rooms" || !payload.rooms) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    // Ensure table exists
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS campus_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      emptySlots TEXT NOT NULL,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).run();

    // Insert
    const insertStmt = env.DB.prepare(`
      INSERT INTO campus_rooms (id, name, type, emptySlots, last_updated)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, type=excluded.type, emptySlots=excluded.emptySlots, last_updated=CURRENT_TIMESTAMP
    `);

    const batch = payload.rooms.map(room =>
      insertStmt.bind(room.id, room.name, room.type, JSON.stringify(room.emptySlots))
    );

    if (batch.length > 0) {
      await env.DB.batch(batch);
    }

    return new Response(JSON.stringify({ success: true, message: "Webhook accepted." }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

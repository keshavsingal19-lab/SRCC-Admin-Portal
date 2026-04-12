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
    if (payload.action !== "add_teacher" || !payload.data) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const { id, name, department } = payload.data;

    // Ensure table exists
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT
    )`).run();

    // Insert
    await env.DB.prepare(`
      INSERT INTO teachers (id, name, department)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, department=excluded.department
    `).bind(id, name, department || "Commerce").run();

    return new Response(JSON.stringify({ success: true, message: "Webhook accepted." }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export interface Env {
  DB: D1Database;
  STUDENT_APP_URL: string;
  TEACHER_APP_URL: string;
  WEBHOOK_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      id?: string;
      name?: string;
      department?: string;
      access_code?: string;
    };

    const { id, name, department, access_code } = body;

    if (!id || !name || !access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing fields: ID, Name, and Access Code are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ensure tables exist
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT,
        access_code TEXT UNIQUE NOT NULL
      )`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS teacher_credentials (
        teacher_id TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        salt TEXT,
        pending_password TEXT,
        updated_at INTEGER
      )`)
    ]);

    await env.DB.prepare(`
      INSERT INTO teachers (id, name, department, access_code)
      VALUES (?, ?, ?, ?)
    `)
      .bind(
        id.trim().toUpperCase(),
        name.trim(),
        department || "Commerce",
        access_code.trim()
      )
      .run();

    // Broadcast to Ecosystem
    const studentUrl = env.STUDENT_APP_URL || 'http://127.0.0.1:3002';
    const teacherUrl = env.TEACHER_APP_URL || 'http://127.0.0.1:3003';
    
    const payload = {
      action: "add_teacher",
      data: {
        id: id.trim().toUpperCase(),
        name: name.trim(),
        department: department || "Commerce"
      }
    };
    
    // Fire and forget webhooks
    Promise.allSettled([
      fetch(`${studentUrl}/webhook/add_teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WEBHOOK_SECRET || 'dev_secret'}` },
        body: JSON.stringify(payload)
      }),
      fetch(`${teacherUrl}/webhook/add_teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.WEBHOOK_SECRET || 'dev_secret'}` },
        body: JSON.stringify(payload)
      })
    ]).catch(e => console.error("Webhook broadcast error:", e));

    return new Response(
      JSON.stringify({ success: true, message: "Faculty member registered successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    let errorMessage = `Database Error: ${error.message}`;
    let statusCode = 500;

    if (error.message.includes("UNIQUE constraint failed")) {
      statusCode = 409;
      if (error.message.includes("teachers.id")) {
        errorMessage = "Error: This Teacher Code (ID) is already assigned to someone else.";
      } else if (error.message.includes("teachers.access_code")) {
        errorMessage = "Error: This Access Code is already in use by another teacher.";
      }
    }
    else if (error.message.includes("no such table")) {
      errorMessage = "Critical Error: The 'teachers' table does not exist in D1. Please run the SQL setup command.";
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        raw: error.message
      }),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
};

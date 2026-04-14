export interface Env {
  DB: D1Database;
  WEBHOOK_SECRET: string;
  STUDENT_APP_WEBHOOK_URL: string;
  TEACHER_APP_WEBHOOK_URL: string;
}

/**
 * Generates an array of date strings (YYYY-MM-DD) from startDate to endDate inclusive.
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as {
      teacherName?: string;
      startDate?: string;
      endDate?: string;
      adminUser?: string;
    };

    if (!body.teacherName || !body.startDate || !body.endDate) {
      return new Response(JSON.stringify({ error: "Missing teacherName, startDate, or endDate" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const adminUser = body.adminUser || "admin";

    // 1. Insert into D1 Database
    const stmt = env.DB.prepare(
      "INSERT INTO global_absences (teacher_name, start_date, end_date, marked_by) VALUES (?, ?, ?, ?)"
    ).bind(body.teacherName, body.startDate, body.endDate, adminUser);

    await stmt.run();

    // 2. Fetch Teacher ID for the webhook payload
    const teacher = await env.DB.prepare("SELECT id FROM teachers WHERE name = ? LIMIT 1").bind(body.teacherName).first() as { id: string } | null;
    const teacherId = teacher ? teacher.id : "N/A";

    // 3. Fire Webhooks — iterate each date in range and send individual payloads
    const dateRange = getDateRange(body.startDate, body.endDate);
    const webhookHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.WEBHOOK_SECRET}`
    };

    const webhookPromises: Promise<void | string>[] = [];

    for (const date of dateRange) {
      const payload = JSON.stringify({
        teacherId: teacherId,
        teacherName: body.teacherName,
        date: date,
        from: body.startDate,
        to: body.endDate,
        adminUser: adminUser
      });

      if (env.STUDENT_APP_WEBHOOK_URL) {
        webhookPromises.push(
          fetch(env.STUDENT_APP_WEBHOOK_URL, {
            method: "POST",
            headers: webhookHeaders,
            body: payload
          })
            .then(() => { /* success — no action needed */ })
            .catch(err => console.error(`Student Webhook failed for ${date}:`, err))
        );
      }

      if (env.TEACHER_APP_WEBHOOK_URL) {
        webhookPromises.push(
          fetch(env.TEACHER_APP_WEBHOOK_URL, {
            method: "POST",
            headers: webhookHeaders,
            body: payload
          })
            .then(() => { /* success — no action needed */ })
            .catch(err => console.error(`Teacher Webhook failed for ${date}:`, err))
        );
      }
    }

    // Wait for all webhooks to finish (or fail gracefully)
    await Promise.allSettled(webhookPromises);

    return new Response(JSON.stringify({
      success: true,
      message: "Absence recorded and broadcasted.",
      datesNotified: dateRange.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

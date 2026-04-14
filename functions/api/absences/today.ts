export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env } = context;
    
    // Get today's date in IST (UTC+5:30) — Cloudflare workers run in UTC,
    // so we must offset manually to match the IST dates stored from the frontend.
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const today = nowIST.toISOString().split('T')[0];

    // Fetch records where today is between start_date and end_date
    const { results } = await env.DB.prepare(
      "SELECT * FROM global_absences WHERE ? BETWEEN start_date AND end_date ORDER BY created_at DESC"
    ).bind(today).all();

    return new Response(JSON.stringify(results), {
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

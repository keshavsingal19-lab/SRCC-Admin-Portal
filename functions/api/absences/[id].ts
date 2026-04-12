export interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id;
    const body = await context.request.json() as { teacherName?: string; startDate?: string; endDate?: string };
    
    if (!body.teacherName || !body.startDate || !body.endDate) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await context.env.DB.prepare(
      "UPDATE global_absences SET teacher_name = ?, start_date = ?, end_date = ? WHERE id = ?"
    ).bind(body.teacherName, body.startDate, body.endDate, id).run();

    return new Response(JSON.stringify({ success: true, message: "Record updated successfully." }), {
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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id;
    
    await context.env.DB.prepare(
      "DELETE FROM global_absences WHERE id = ?"
    ).bind(id).run();

    return new Response(JSON.stringify({ success: true, message: "Record deleted successfully." }), {
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

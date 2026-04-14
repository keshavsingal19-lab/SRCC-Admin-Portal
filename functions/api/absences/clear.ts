export interface Env {
  DB: D1Database;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Only delete records that are currently active today
    await context.env.DB.prepare(
      "DELETE FROM global_absences WHERE ? BETWEEN start_date AND end_date"
    ).bind(today).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Today's absence registry has been cleared." 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message || "Bulk deletion failed." 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

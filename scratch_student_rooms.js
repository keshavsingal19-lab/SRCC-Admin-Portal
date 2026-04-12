export async function onRequestGet(context) {
  const { env } = context;

  try {
    let dbRooms = [];

    if (env.DB) {
      try {
        const result = await env.DB.prepare("SELECT * FROM campus_rooms").all();
        dbRooms = result.results || [];
      } catch (e) {}
    }

    // Merge static and D1 rooms
    const allRoomsMap = new Map();

    try {
        // Assume static room data is imported or we just return DB if static fails
        // For Student app we can fall back to the static data if local D1 fails, but since this runs on workers, we can't easily read TS files.
        // We will return the raw DB output, and the frontend App.tsx will merge it.
    } catch(e) {}

    const formattedDbRooms = dbRooms.map(r => {
      let parsed = {};
      try { parsed = JSON.parse(r.emptySlots); } catch(e) {}
      return { id: r.id, name: r.name, type: r.type, emptySlots: parsed, source: 'database' };
    });

    return new Response(JSON.stringify(formattedDbRooms), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

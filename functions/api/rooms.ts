import { ROOMS } from '../../src/roomData';

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    let dbRooms: any[] = [];

    if (env.DB) {
      try {
        const result = await env.DB.prepare("SELECT * FROM campus_rooms").all();
        dbRooms = result.results || [];
      } catch (e) {
        // Table may not exist yet
      }
    }

    // Merge static and D1 rooms
    const allRoomsMap = new Map();

    ROOMS.forEach((r: any) => allRoomsMap.set(r.id, { ...r, source: 'static' }));

    dbRooms.forEach((r: any) => {
      let parsedEmptySlots = {};
      let parsedOccupiedBy = {};
      try {
        parsedEmptySlots = JSON.parse(r.emptySlots);
      } catch (e) {}
      try {
        parsedOccupiedBy = JSON.parse(r.occupiedBy || '{}');
      } catch (e) {}

      allRoomsMap.set(r.id, {
        id: r.id,
        name: r.name,
        type: r.type,
        emptySlots: parsedEmptySlots,
        occupiedBy: parsedOccupiedBy,
        source: 'database'
      });
    });

    const mergedResults = Array.from(allRoomsMap.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    return new Response(JSON.stringify(mergedResults), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: `Sync Error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

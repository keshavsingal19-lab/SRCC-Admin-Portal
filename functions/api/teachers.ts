import { TEACHERS } from '../teacherData.js';

export interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    let dbTeachers: any[] = [];
    let dbSlots: any[] = [];

    if (env.DB) {
      // Get teachers from DB
      try {
        const teacherResult = await env.DB.prepare("SELECT id, name, department FROM teachers").all();
        dbTeachers = teacherResult.results || [];
      } catch (e) {
        // Table may not exist yet
      }

      // Get timetable slots
      try {
        const slotsResult = await env.DB.prepare("SELECT * FROM timetable_slots").all();
        dbSlots = slotsResult.results || [];
      } catch (e) {
        // Table may not exist yet
      }
    }

    // Group DB slots by teacher ID and Day
    const dbSchedules: Record<string, any> = {};
    dbSlots.forEach((slot: any) => {
      if (!dbSchedules[slot.teacher_id]) {
        dbSchedules[slot.teacher_id] = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] };
      }
      if (dbSchedules[slot.teacher_id][slot.day_of_week]) {
        dbSchedules[slot.teacher_id][slot.day_of_week].push({
          startTime: slot.start_time,
          endTime: slot.end_time,
          room: slot.room,
          subject: slot.subject,
          batch: slot.batch
        });
      }
    });

    // Format STATIC teachers
    const staticTeachers = Object.values(TEACHERS).map((t: any) => ({
      id: t.id,
      name: t.name,
      department: t.department || "Commerce",
      schedule: t.schedule,
      source: "static"
    }));

    // MERGE AND DEDUPLICATE
    const allTeachersMap = new Map();

    // Add static first
    staticTeachers.forEach(t => allTeachersMap.set(t.id, t));

    // Overwrite with DB teachers
    dbTeachers.forEach((t: any) => {
      allTeachersMap.set(t.id, {
        ...t,
        schedule: dbSchedules[t.id] || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] },
        source: "database"
      });
    });

    // CONVERT BACK TO ARRAY & SORT
    const mergedResults = Array.from(allTeachersMap.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
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

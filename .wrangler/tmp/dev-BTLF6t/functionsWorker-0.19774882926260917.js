var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-7483sx/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-swHcuO/functionsWorker-0.19774882926260917.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
var onRequestGet = /* @__PURE__ */ __name2(async (context) => {
  try {
    const { env } = context;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { results } = await env.DB.prepare(
      "SELECT * FROM global_absences WHERE ? BETWEEN start_date AND end_date ORDER BY created_at DESC"
    ).bind(today).all();
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPut = /* @__PURE__ */ __name2(async (context) => {
  try {
    const id = context.params.id;
    const body = await context.request.json();
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPut");
var onRequestDelete = /* @__PURE__ */ __name2(async (context) => {
  try {
    const id = context.params.id;
    await context.env.DB.prepare(
      "DELETE FROM global_absences WHERE id = ?"
    ).bind(id).run();
    return new Response(JSON.stringify({ success: true, message: "Record deleted successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestDelete");
var onRequestPost = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { id, name, department, access_code } = body;
    if (!id || !name || !access_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing fields: ID, Name, and Access Code are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
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
    `).bind(
      id.trim().toUpperCase(),
      name.trim(),
      department || "Commerce",
      access_code.trim()
    ).run();
    const studentUrl = env.STUDENT_APP_URL || "http://127.0.0.1:3002";
    const teacherUrl = env.TEACHER_APP_URL || "http://127.0.0.1:3003";
    const payload = {
      action: "add_teacher",
      data: {
        id: id.trim().toUpperCase(),
        name: name.trim(),
        department: department || "Commerce"
      }
    };
    Promise.allSettled([
      fetch(`${studentUrl}/webhook/add_teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.WEBHOOK_SECRET || "dev_secret"}` },
        body: JSON.stringify(payload)
      }),
      fetch(`${teacherUrl}/webhook/add_teacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.WEBHOOK_SECRET || "dev_secret"}` },
        body: JSON.stringify(payload)
      })
    ]).catch((e) => console.error("Webhook broadcast error:", e));
    return new Response(
      JSON.stringify({ success: true, message: "Faculty member registered successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    let errorMessage = `Database Error: ${error.message}`;
    let statusCode = 500;
    if (error.message.includes("UNIQUE constraint failed")) {
      statusCode = 409;
      if (error.message.includes("teachers.id")) {
        errorMessage = "Error: This Teacher Code (ID) is already assigned to someone else.";
      } else if (error.message.includes("teachers.access_code")) {
        errorMessage = "Error: This Access Code is already in use by another teacher.";
      }
    } else if (error.message.includes("no such table")) {
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
}, "onRequestPost");
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = /* @__PURE__ */ new Date(startDate + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(endDate + "T00:00:00Z");
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}
__name(getDateRange, "getDateRange");
__name2(getDateRange, "getDateRange");
var onRequestPost2 = /* @__PURE__ */ __name2(async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json();
    if (!body.teacherName || !body.startDate || !body.endDate) {
      return new Response(JSON.stringify({ error: "Missing teacherName, startDate, or endDate" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const adminUser = body.adminUser || "admin";
    const stmt = env.DB.prepare(
      "INSERT INTO global_absences (teacher_name, start_date, end_date, marked_by) VALUES (?, ?, ?, ?)"
    ).bind(body.teacherName, body.startDate, body.endDate, adminUser);
    await stmt.run();
    const dateRange = getDateRange(body.startDate, body.endDate);
    const webhookHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.WEBHOOK_SECRET}`
    };
    const webhookPromises = [];
    for (const date of dateRange) {
      const payload = JSON.stringify({
        teacherName: body.teacherName,
        date,
        adminUser
      });
      if (env.STUDENT_APP_WEBHOOK_URL) {
        webhookPromises.push(
          fetch(env.STUDENT_APP_WEBHOOK_URL, {
            method: "POST",
            headers: webhookHeaders,
            body: payload
          }).then(() => {
          }).catch((err) => console.error(`Student Webhook failed for ${date}:`, err))
        );
      }
      if (env.TEACHER_APP_WEBHOOK_URL) {
        webhookPromises.push(
          fetch(env.TEACHER_APP_WEBHOOK_URL, {
            method: "POST",
            headers: webhookHeaders,
            body: payload
          }).then(() => {
          }).catch((err) => console.error(`Teacher Webhook failed for ${date}:`, err))
        );
      }
    }
    await Promise.allSettled(webhookPromises);
    return new Response(JSON.stringify({
      success: true,
      message: "Absence recorded and broadcasted.",
      datesNotified: dateRange.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var EXISTING_ROOMS = [
  {
    id: "CL1",
    name: "CL1",
    type: "Lab",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "CL2",
    // Sourced from "Cl-1" in your file
    name: "CL2",
    type: "Lab",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "CLIB",
    name: "CLIB",
    type: "Lab",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [6, 7],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "PB2",
    name: "PB2",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [1, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 3],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "PB3",
    name: "PB3",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "PB4",
    name: "PB4",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [8],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R1",
    name: "R1",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R2",
    name: "R2",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R3",
    name: "R3",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [8],
      [
        "Saturday"
        /* Saturday */
      ]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R4",
    name: "R4",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [],
      [
        "Saturday"
        /* Saturday */
      ]: [7, 8]
    }
  },
  {
    id: "R5",
    name: "R5",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [4, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [5, 6, 7, 8]
    }
  },
  {
    id: "R6",
    name: "R6",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 5, 6, 7, 8]
    }
  },
  {
    id: "R7",
    name: "R7",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 5, 6, 7, 8]
    }
  },
  {
    id: "R8",
    name: "R8",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R10",
    name: "R10",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [5, 6, 7, 8]
    }
  },
  {
    id: "R13",
    name: "R13",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R14",
    name: "R14",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R15",
    name: "R15",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R16",
    name: "R16",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R17",
    name: "R17",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R18",
    name: "R18",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [5, 6, 7, 8]
    }
  },
  {
    id: "R19",
    name: "R19",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R20",
    name: "R20",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [8],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R21",
    name: "R21",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [8],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R22",
    name: "R22",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [4],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [5, 6, 7, 8]
    }
  },
  {
    id: "R23",
    name: "R23",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [4],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [8],
      [
        "Friday"
        /* Friday */
      ]: [8],
      [
        "Saturday"
        /* Saturday */
      ]: [5, 6, 7, 8]
    }
  },
  {
    id: "R24",
    name: "R24",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [5, 6, 7, 8]
    }
  },
  {
    id: "R25",
    name: "R25",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 4, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R26",
    name: "R26",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "R27",
    name: "R27",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R28",
    name: "R28",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R29",
    name: "R29",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [4, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R30",
    name: "R30",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R31",
    name: "R31",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [2, 3],
      [
        "Tuesday"
        /* Tuesday */
      ]: [6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [],
      [
        "Friday"
        /* Friday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R32",
    name: "R32",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [4, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R33",
    name: "R33",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R34",
    name: "R34",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R35",
    name: "R35",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "R37",
    name: "R37",
    type: "Lecture Hall",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR1",
    name: "SCR1",
    type: "Seminar Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [3, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR2",
    name: "SCR2",
    type: "Seminar Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [1, 2, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR3",
    name: "SCR3",
    type: "Seminar Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [1],
      [
        "Friday"
        /* Friday */
      ]: [1, 2, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "SCR4",
    name: "SCR4",
    type: "Seminar Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [],
      [
        "Wednesday"
        /* Wednesday */
      ]: [7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [1, 3],
      [
        "Friday"
        /* Friday */
      ]: [0, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  }
];
var TUTORIAL_ROOMS = [
  {
    id: "T1",
    name: "T1",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [4, 5, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T2",
    name: "T2",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T3",
    name: "T3",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T4",
    name: "T4",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 2, 3, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [2, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [7, 8],
      [
        "Friday"
        /* Friday */
      ]: [5, 6],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T5",
    name: "T5",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T6",
    name: "T6",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T7",
    name: "T7",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T8",
    name: "T8",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T9",
    name: "T9",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T11",
    name: "T11",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T12",
    name: "T12",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T13",
    name: "T13",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T14",
    name: "T14",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 5, 6, 7, 8]
    }
  },
  {
    id: "T15",
    name: "T15",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T16",
    name: "T16",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T17",
    name: "T17",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T18",
    name: "T18",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T23",
    name: "T23",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T24",
    name: "T24",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T25",
    name: "T25",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T26",
    name: "T26",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 2, 3, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T27",
    name: "T27",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T29",
    name: "T29",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T31",
    name: "T31",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T32",
    name: "T32",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 3, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T33",
    name: "T33",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 2, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T34",
    name: "T34",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T35",
    name: "T35",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 3, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T36",
    name: "T36",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T37",
    name: "T37",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T38",
    name: "T38",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T39",
    name: "T39",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T40",
    name: "T40",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T41",
    name: "T41",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T42",
    name: "T42",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T43",
    name: "T43",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T44",
    name: "T44",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T45",
    name: "T45",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T46",
    name: "T46",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T48",
    name: "T48",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T49",
    name: "T49",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T50",
    name: "T50",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T51",
    name: "T51",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 2, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T53",
    name: "T53",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 3, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 3, 4, 5, 6, 7, 8]
    }
  },
  {
    id: "T54",
    name: "T54",
    type: "Tutorial Room",
    emptySlots: {
      [
        "Monday"
        /* Monday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Tuesday"
        /* Tuesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Wednesday"
        /* Wednesday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Thursday"
        /* Thursday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Friday"
        /* Friday */
      ]: [0, 1, 4, 5, 6, 7, 8],
      [
        "Saturday"
        /* Saturday */
      ]: [0, 1, 3, 4, 5, 6, 7, 8]
    }
  }
];
var ROOMS = [...EXISTING_ROOMS, ...TUTORIAL_ROOMS];
var onRequestGet2 = /* @__PURE__ */ __name2(async (context) => {
  const { env } = context;
  try {
    let dbRooms = [];
    if (env.DB) {
      try {
        const result = await env.DB.prepare("SELECT * FROM campus_rooms").all();
        dbRooms = result.results || [];
      } catch (e) {
      }
    }
    const allRoomsMap = /* @__PURE__ */ new Map();
    ROOMS.forEach((r) => allRoomsMap.set(r.id, { ...r, source: "static" }));
    dbRooms.forEach((r) => {
      let parsedEmptySlots = {};
      let parsedOccupiedBy = {};
      try {
        parsedEmptySlots = JSON.parse(r.emptySlots);
      } catch (e) {
      }
      try {
        parsedOccupiedBy = JSON.parse(r.occupiedBy || "{}");
      } catch (e) {
      }
      allRoomsMap.set(r.id, {
        id: r.id,
        name: r.name,
        type: r.type,
        emptySlots: parsedEmptySlots,
        occupiedBy: parsedOccupiedBy,
        source: "database"
      });
    });
    const mergedResults = Array.from(allRoomsMap.values()).sort(
      (a, b) => a.id.localeCompare(b.id)
    );
    return new Response(JSON.stringify(mergedResults), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Sync Error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS campus_rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      emptySlots TEXT NOT NULL,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`).run();
    const PYTHON_API_URL = `${env.ROOM_PYTHON_API_URL}/parse-rooms`;
    const pythonFormData = new FormData();
    pythonFormData.append("file", file);
    const pythonResponse = await fetch(PYTHON_API_URL, {
      method: "POST",
      body: pythonFormData
    });
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      return new Response(JSON.stringify({ error: `Parser Error: ${errorText}` }), {
        status: pythonResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    const parsedData = await pythonResponse.json();
    if (!parsedData.success) {
      return new Response(JSON.stringify({ error: parsedData.error || "Python parser failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const insertStmt = env.DB.prepare(`
      INSERT INTO campus_rooms (id, name, type, emptySlots, last_updated)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        type=excluded.type,
        emptySlots=excluded.emptySlots,
        last_updated=CURRENT_TIMESTAMP
    `);
    const batch = parsedData.rooms.map(
      (room) => insertStmt.bind(
        room.id.toUpperCase(),
        room.name || room.id.toUpperCase(),
        room.type,
        JSON.stringify(room.emptySlots)
      )
    );
    if (batch.length > 0) {
      await env.DB.batch(batch);
    }
    const studentUrl = env.STUDENT_APP_URL || "http://127.0.0.1:3002";
    const teacherUrl = env.TEACHER_APP_URL || "http://127.0.0.1:3003";
    const payload = {
      action: "save_rooms",
      rooms: parsedData.rooms
    };
    Promise.allSettled([
      fetch(`${studentUrl}/webhook/save_rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.WEBHOOK_SECRET || "dev_secret"}` },
        body: JSON.stringify(payload)
      }),
      fetch(`${teacherUrl}/webhook/save_rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.WEBHOOK_SECRET || "dev_secret"}` },
        body: JSON.stringify(payload)
      })
    ]).catch((e) => console.error("Webhook broadcast error:", e));
    return new Response(JSON.stringify({
      success: true,
      total: parsedData.rooms.length,
      message: `Successfully processed ${parsedData.rooms.length} rooms!`
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var onRequestPost4 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const teacherId = formData.get("teacherId");
    if (!file || !teacherId) {
      return new Response(JSON.stringify({ error: "Missing file or Teacher ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS timetable_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      subject TEXT,
      room TEXT,
      batch TEXT,
      class_type TEXT
    )`).run();
    const PYTHON_API_URL = `${env.PYTHON_API_URL}/parse-pdf`;
    const pythonFormData = new FormData();
    pythonFormData.append("file", file);
    const pythonResponse = await fetch(PYTHON_API_URL, {
      method: "POST",
      body: pythonFormData
    });
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      return new Response(JSON.stringify({ error: `Parser Error: ${errorText}` }), {
        status: pythonResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }
    const parsedData = await pythonResponse.json();
    if (!parsedData.success) {
      return new Response(JSON.stringify({ error: parsedData.error || "Python parser failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.DB.prepare("DELETE FROM timetable_slots WHERE teacher_id = ?").bind(teacherId).run();
    const insertStmt = env.DB.prepare(`
      INSERT INTO timetable_slots (teacher_id, day_of_week, start_time, end_time, subject, room, batch, class_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const batch = parsedData.schedule.map(
      (slot) => insertStmt.bind(
        teacherId,
        slot.day,
        slot.startTime,
        slot.endTime,
        slot.subject,
        slot.room,
        slot.batch,
        slot.classType
      )
    );
    if (batch.length > 0) {
      await env.DB.batch(batch);
    }
    const studentUrl = env.STUDENT_APP_URL || "http://127.0.0.1:3002";
    const teacherUrl = env.TEACHER_APP_URL || "http://127.0.0.1:3003";
    const payload = {
      action: "save_timetable",
      teacherId,
      schedule: parsedData.schedule
    };
    Promise.allSettled([
      fetch(`${studentUrl}/webhook/save_timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.WEBHOOK_SECRET || "dev_secret"}` },
        body: JSON.stringify(payload)
      }),
      fetch(`${teacherUrl}/webhook/save_timetable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.WEBHOOK_SECRET || "dev_secret"}` },
        body: JSON.stringify(payload)
      })
    ]).catch((e) => console.error("Webhook broadcast error:", e));
    return new Response(JSON.stringify({
      success: true,
      count: parsedData.schedule.length,
      message: `Successfully processed ${parsedData.schedule.length} slots!`
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var IGNORED_ROOMS = ["PRINCIPAL OFFICE", "PLAYGROUND", "SEMINAR HALL"];
var TIMETABLE_BASE_URL = "https://srcccollegetimetable.in/admin/timetable_printpreview.php?mode=print&roomno=";
var DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var COL_TO_SLOT = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  // col 5 is lunch break - skip
  6: 5,
  7: 6,
  8: 7,
  9: 8
};
function classifyRoomType(id) {
  const upper = id.toUpperCase();
  if (upper.startsWith("CL")) return "Lab";
  if (upper.startsWith("SCR")) return "Seminar Room";
  if (upper.startsWith("T")) return "Tutorial Room";
  return "Lecture Hall";
}
__name(classifyRoomType, "classifyRoomType");
__name2(classifyRoomType, "classifyRoomType");
function extractTeacherId(segment) {
  const parts = segment.split("-").map((p) => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (/^[A-Za-z]{1,4}$/.test(p)) {
      return p.toUpperCase();
    }
  }
  return null;
}
__name(extractTeacherId, "extractTeacherId");
__name2(extractTeacherId, "extractTeacherId");
function parseRoomHtml(html) {
  const emptySlots = {};
  const occupiedBy = {};
  for (const day of DAY_NAMES) {
    emptySlots[day] = [];
    occupiedBy[day] = {};
    const dayRegex = new RegExp(
      `<td[^>]*>\\s*${day}\\s*</td>([\\s\\S]*?)(?:</tr>)`,
      "i"
    );
    const dayMatch = html.match(dayRegex);
    if (!dayMatch) continue;
    const rowContent = dayMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
      cells.push(tdMatch[0]);
    }
    for (let colIdx = 0; colIdx < cells.length; colIdx++) {
      const slotIdx = COL_TO_SLOT[colIdx];
      if (slotIdx === void 0) continue;
      const cell = cells[colIdx];
      const hasArrayStyle = cell.includes('style="Array');
      const textContent = cell.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/__+/g, "|").replace(/\d+\.\s*/g, "").trim();
      const isActuallyEmpty = hasArrayStyle && textContent.length === 0;
      if (isActuallyEmpty) {
        emptySlots[day].push(slotIdx);
      } else {
        const segments = textContent.split("|").map((s) => s.trim()).filter((s) => s.length > 0);
        const teachers = [];
        for (const segment of segments) {
          const tid = extractTeacherId(segment);
          if (tid && !teachers.includes(tid)) {
            teachers.push(tid);
          }
        }
        if (teachers.length > 0) {
          occupiedBy[day][slotIdx] = teachers;
        }
      }
    }
  }
  return { emptySlots, occupiedBy };
}
__name(parseRoomHtml, "parseRoomHtml");
__name2(parseRoomHtml, "parseRoomHtml");
var onRequestPost5 = /* @__PURE__ */ __name2(async (context) => {
  const { env } = context;
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const sendEvent = /* @__PURE__ */ __name2(async (data) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}

`));
  }, "sendEvent");
  const body = await context.request.json();
  const roomIdsToProcess = body.roomIds || [];
  const isFirstBatch = body.isFirstBatch || false;
  const totalRooms = body.totalRooms || roomIdsToProcess.length;
  const processedCount = body.processedCount || 0;
  const syncProcess = /* @__PURE__ */ __name2(async () => {
    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS campus_rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        emptySlots TEXT NOT NULL,
        occupiedBy TEXT NOT NULL DEFAULT '{}',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`).run();
      if (isFirstBatch) {
        await env.DB.prepare("DELETE FROM campus_rooms").run();
        await sendEvent({
          type: "start",
          total: totalRooms,
          message: `Starting sync for ${totalRooms} rooms in batches...`
        });
      }
      let processed = processedCount;
      let errors = 0;
      const results = [];
      for (const roomId of roomIdsToProcess) {
        if (IGNORED_ROOMS.some((ignored) => roomId.toUpperCase() === ignored.replace(/\s+/g, ""))) {
          await sendEvent({
            type: "skip",
            room: roomId,
            processed: ++processed,
            message: `Skipped ${roomId} (ignored)`
          });
          continue;
        }
        try {
          const url = `${TIMETABLE_BASE_URL}${encodeURIComponent(roomId)}`;
          const response = await fetch(url, {
            headers: {
              "User-Agent": "SRCC-Admin-Portal/1.0",
              "Accept": "text/html"
            }
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const html = await response.text();
          const { emptySlots, occupiedBy } = parseRoomHtml(html);
          const roomType = classifyRoomType(roomId);
          await env.DB.prepare(`
            INSERT INTO campus_rooms (id, name, type, emptySlots, occupiedBy, last_updated)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name,
              type=excluded.type,
              emptySlots=excluded.emptySlots,
              occupiedBy=excluded.occupiedBy,
              last_updated=CURRENT_TIMESTAMP
          `).bind(
            roomId.toUpperCase(),
            roomId.toUpperCase(),
            roomType,
            JSON.stringify(emptySlots),
            JSON.stringify(occupiedBy)
          ).run();
          results.push({ id: roomId, type: roomType, emptySlots, occupiedBy });
          await sendEvent({
            type: "progress",
            room: roomId,
            processed: ++processed,
            total: totalRooms,
            emptySlotCount: Object.values(emptySlots).flat().length,
            message: `\u2705 ${roomId} synced (${Object.values(emptySlots).flat().length} free slots)`
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err) {
          errors++;
          processed++;
          await sendEvent({
            type: "error",
            room: roomId,
            processed,
            message: `\u274C ${roomId}: ${err.message}`
          });
        }
      }
      await sendEvent({
        type: "complete",
        total: totalRooms,
        processed,
        errors,
        roomsSynced: results.length,
        batchComplete: true,
        message: isFirstBatch && totalRooms === results.length ? `Sync complete!` : `Batch complete (${results.length} rooms).`
      });
    } catch (err) {
      await sendEvent({
        type: "fatal",
        message: `Fatal error: ${err.message}`
      });
    } finally {
      await writer.close();
    }
  }, "syncProcess");
  context.waitUntil(syncProcess());
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}, "onRequestPost");
var parseTimeStringToMinutes = /* @__PURE__ */ __name2((timeString) => {
  const [time, modifier] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (hours === 12 && modifier === "AM") {
    hours = 0;
  }
  if (hours !== 12 && modifier === "PM") {
    hours += 12;
  }
  return hours * 60 + minutes;
}, "parseTimeStringToMinutes");
var createClass = /* @__PURE__ */ __name2((day, start, end, type, batch, room, subject) => {
  return {
    id: `${day}-${start}-${batch}-${room}`.replace(/\s+/g, "-"),
    day,
    startTime: start,
    endTime: end,
    type,
    subject,
    batch,
    room,
    rawTimeStart: parseTimeStringToMinutes(start),
    rawTimeEnd: parseTimeStringToMinutes(end)
  };
}, "createClass");
var EMPTY_SCHEDULE = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: []
};
var scheduleSIS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R1", "CLAW"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "H1-SEM II", "T18", "CLAW")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM II", "R1", "CLAW"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "N1-SEM II", "T18", "CLAW"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM II", "R2", "CLAW"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "MCOM-SEM II", "T9", "CLCA")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM II", "R5", "CLAW"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM II", "T18", "CLAW"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "H2-SEM II", "T18", "CLAW")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM II", "R1", "CLAW"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM II", "T18", "CLAW")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Tutorial", "L2-SEM II", "T9", "CLAW"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R1", "CLAW"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "G1-SEM II", "T18", "CLAW")
  ]
};
var scheduleDPE = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "2:00 PM", "3:00 PM", "Lecture", "VAC19-SEM II", "R3", "ABH"),
    createClass("Monday", "3:00 PM", "4:00 PM", "Lab", "VAC20-SEM II", "R3-VAC20", "ABH"),
    createClass("Monday", "4:00 PM", "5:00 PM", "Lab", "VAC20-SEM II", "R3-VAC20", "ABH")
  ],
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "VAC14-SEM IV", "R3", "ABH"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "VAC15-SEM IV", "R3-VAC15", "ABH"),
    createClass("Tuesday", "4:00 PM", "5:00 PM", "Lab", "VAC15-SEM IV", "R3-VAC15", "ABH")
  ],
  Wednesday: [
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Lecture", "VAC20-SEM II", "R3", "ABH"),
    createClass("Wednesday", "3:00 PM", "4:00 PM", "Lab", "VAC19-SEM II", "R3-VAC19", "ABH"),
    createClass("Wednesday", "4:00 PM", "5:00 PM", "Lab", "VAC19-SEM II", "R3-VAC19", "ABH")
  ],
  Thursday: [
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "C1-SEM IV", "T15", "IB"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "C2-SEM IV", "T15", "IB")
  ],
  Friday: [
    createClass("Friday", "2:00 PM", "3:00 PM", "Lecture", "VAC15-SEM IV", "R3", "ABH"),
    createClass("Friday", "3:00 PM", "4:00 PM", "Lab", "VAC14-SEM IV", "R3-VAC14", "ABH"),
    createClass("Friday", "4:00 PM", "5:00 PM", "Lab", "VAC14-SEM IV", "R3-VAC14", "ABH")
  ]
};
var scheduleRNC = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-J-SEM II", "R1", "CLAW"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "E3-SEM II", "T17", "CLAW"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "EM4-SEM VIII", "T17", "EVM")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM II", "R1", "CLAW"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "F2-SEM II", "T17", "CLAW")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-J-SEM II", "R1", "CLAW"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "D3-SEM II", "T17", "CLAW"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-M-SEM II", "R1", "CLAW")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM II", "R1", "CLAW"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "F1-SEM II", "T17", "CLAW"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM II", "T17", "CLAW")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-J-SEM II", "R1", "CLAW"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "D1-SEM II", "T17", "CLAW"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "G2-SEM II", "T17", "CLAW")
  ]
};
var scheduleSLG = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-E-SEM IV", "R17", "COST")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM IV", "R21", "COST"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM IV", "T8", "COST"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-M-SEM IV", "R5", "COST")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM IV", "R21", "COST"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "B1-SEM IV", "T8", "COST"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM IV", "T8", "COST")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM IV", "R27", "COST"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM IV", "T8", "COST"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM IV", "T8", "COST")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM IV", "R8", "COST"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM IV", "T8", "COST"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "A3-SEM IV", "T8", "COST"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "MCOM-SEM II", "T8", "AMA")
  ]
};
var scheduleRUA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "R2", "CLAW"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM II", "T9", "CLAW")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "R2", "CLAW"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "I1-SEM II", "T9", "CLAW"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "K3-SEM II", "T9", "HRM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-F-SEM II", "R2", "CLAW"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM II", "T9", "CLAW"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "K1-SEM II", "T9", "CLAW")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "R2", "CLAW"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM II", "R1", "CLAW"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "K2-SEM II", "T9", "CLAW")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-F-SEM II", "R2", "CLAW"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "J1-SEM II", "T9", "CLAW"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "F3-SEM II", "T9", "CLAW")
  ]
};
var scheduleAMS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM IV", "R33", "IB")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM IV", "R21", "IB"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "A3-SEM IV", "T1", "IB"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "L3-SEM IV", "T14", "IB")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "D2-SEM IV", "T35", "FIB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-F-SEM IV", "R28", "IB"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "E1-SEM IV", "T1", "IB")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM IV", "R21", "IB"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-F-SEM IV", "R35", "IB"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "E2-SEM IV", "T4", "IB")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM IV", "R21", "IB"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM IV", "T1", "IB"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "E3-SEM IV", "T1", "IB")
  ]
};
var scheduleRAJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VI", "R5", "CG"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "H2-SEM VI", "T7", "CG"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "H3-SEM VI", "T7", "CG")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VI", "R5", "CG"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "G1-SEM VI", "T7", "CG"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "D3-SEM VI", "T7", "CG")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "R5", "CG"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "D1-SEM VI", "T7", "CG"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "A1-SEM II", "T7", "CGBE")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "R8", "CG"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM VI", "T7", "CG")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "R5", "CG"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "D2-SEM VI", "T7", "CG"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-A-SEM VI", "R5", "CG")
  ]
};
var scheduleAAJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VI", "R8", "CG"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "K2-SEM VI", "T29", "CG")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VI", "R8", "CG"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "G2-SEM VI", "T29", "CG"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "J1-SEM VI", "T29", "CG")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM II", "R24", "FMB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM VI", "R8", "CG")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM II", "R24", "FMB"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "C1-SEM II", "T29", "FMB"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "E2-SEM VI", "T29", "CG")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM II", "R24", "FMB"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "C3-SEM II", "T29", "FMB")
  ]
};
var scheduleSSS = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "VAC21-SEM IV", "R34", "EI"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "VAC22-SEM IV", "R34-VAC22", "EI"),
    createClass("Tuesday", "4:00 PM", "5:00 PM", "Lab", "VAC22-SEM IV", "R34-VAC22", "EI")
  ],
  Wednesday: [
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Lecture", "VAC22-SEM IV", "R16", "EI"),
    createClass("Wednesday", "3:00 PM", "4:00 PM", "Lab", "VAC21-SEM IV", "R16-VAC21", "EI"),
    createClass("Wednesday", "4:00 PM", "5:00 PM", "Lab", "VAC21-SEM IV", "R16-VAC21", "EI")
  ],
  Thursday: [
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lecture", "VAC12-SEM II", "R23", "EI"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "VAC13-SEM II", "R23-VAC13", "EI"),
    createClass("Thursday", "4:00 PM", "5:00 PM", "Lab", "VAC13-SEM II", "R23-VAC13", "EI")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "I1-SEM IV", "T31", "COST"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "J1-SEM IV", "T31", "COST"),
    createClass("Friday", "2:00 PM", "3:00 PM", "Lecture", "VAC13-SEM II", "PB3", "EI")
  ],
  Saturday: [
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lab", "VAC12-SEM II", "R6-VAC12", "EI"),
    createClass("Saturday", "12:30 PM", "1:30 PM", "Lab", "VAC12-SEM II", "R6-VAC12", "EI")
  ]
};
var scheduleMAK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:30 AM", "12:30 PM", "Lab", "VAC10-SEM II", "R13-VAC10", "EI"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lab", "VAC10-SEM II", "R13-VAC10", "EI"),
    createClass("Monday", "2:00 PM", "3:00 PM", "Lab", "VAC11-SEM II", "R24-VAC11", "EI"),
    createClass("Monday", "3:00 PM", "4:00 PM", "Lab", "VAC11-SEM II", "R24-VAC11", "EI")
  ],
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "VAC19-SEM IV", "R14", "EI"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "VAC20-SEM IV", "R14-VAC20", "EI"),
    createClass("Tuesday", "4:00 PM", "5:00 PM", "Lab", "VAC20-SEM IV", "R14-VAC20", "EI")
  ],
  Wednesday: [
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "N2-SEM IV", "T13", "IB"),
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Lecture", "VAC20-SEM IV", "R7", "EI"),
    createClass("Wednesday", "3:00 PM", "4:00 PM", "Lab", "VAC19-SEM IV", "R14-VAC19", "EI"),
    createClass("Wednesday", "4:00 PM", "5:00 PM", "Lab", "VAC19-SEM IV", "R14-VAC19", "EI")
  ],
  Thursday: [
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "C3-SEM IV", "T13", "IB"),
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lecture", "VAC11-SEM II", "R22", "EI")
  ],
  Friday: [
    createClass("Friday", "2:00 PM", "3:00 PM", "Lecture", "VAC10-SEM II", "R22", "EI")
  ]
};
var scheduleSNK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VIII", "PB3", "TEB"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM VIII", "T36", "TEB"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "C1-SEM VIII", "T36", "TEB")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VIII", "SCR4", "TEB"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM VIII", "SCR4", "TEB"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "B2-SEM VIII", "T36", "TEB")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VIII", "SCR1", "TEB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "J1-SEM IV", "T36", "IB"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "F2-SEM IV", "T36", "IB")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VIII", "SCR1", "TEB"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "I2-SEM IV", "T36", "IB"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "J2-SEM IV", "T36", "IB")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VIII", "R4", "TEB"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Tutorial", "C2-SEM VIII", "T36", "TEB")
  ]
};
var scheduleAYJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM IV", "R10", "IM"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "IM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM IV", "T11", "IM")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM IV", "R10", "IM"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "B2-SEM IV", "T11", "IM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "D3-SEM IV", "T11", "IM")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM IV", "R10", "IM"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A1-SEM II", "T11", "SFM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM IV", "T11", "IM")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "IM"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "F1-SEM IV", "T11", "IM")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "IM"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "F2-SEM IV", "T11", "IM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM II", "T11", "SFM")
  ]
};
var scheduleSHK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lab", "SEC5-SEM VI", "R25-SEC5", "DM"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "SEC5-SEM VI", "R25-SEC5", "DM"),
    createClass("Tuesday", "4:00 PM", "5:00 PM", "Lab", "SEC5-SEM VI", "R25-SEC5", "DM"),
    createClass("Tuesday", "5:00 PM", "6:00 PM", "Lab", "SEC5-SEM VI", "R25-SEC5", "DM")
  ],
  Wednesday: [
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM VI", "R19", "BRM"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "MCOM-SEM IV", "T25", "IFS")
  ],
  Thursday: [
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lab", "SEC6-SEM IV", "PB3-SEC6", "DM"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "SEC6-SEM IV", "PB3-SEC6", "DM"),
    createClass("Thursday", "4:00 PM", "5:00 PM", "Lab", "SEC6-SEM IV", "PB3-SEC6", "DM"),
    createClass("Thursday", "5:00 PM", "6:00 PM", "Lab", "SEC6-SEM IV", "PB3-SEC6", "DM")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-N-SEM VI", "R4", "BRM"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM VI", "R4", "BRM")
  ],
  Saturday: [
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lab", "BCH-N-SEM VI", "R18-N", "BRM"),
    createClass("Saturday", "12:30 PM", "1:30 PM", "Lab", "BCH-N-SEM VI", "R18-N", "BRM")
  ]
};
var schedulePRD = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-K-SEM IV", "R8", "IB")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM IV", "R22", "IB"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM IV", "R5", "IB"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "K1-SEM IV", "T24", "IB"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "A2-SEM IV", "T24", "IB")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM IV", "R8", "IB"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM II", "T24", "IGE"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM II", "T24", "IGE")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-K-SEM IV", "R32", "IB"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "B3-SEM IV", "T24", "IB"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM IV", "T24", "IB")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM IV", "R34", "IB"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "F1-SEM IV", "T24", "IB"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "M1-SEM IV", "T24", "IB")
  ]
};
var scheduleHNT = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R5", "IM")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R10", "IM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "D1-SEM IV", "T5", "IM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "IBFS3-SEM VI", "T5", "IBFS")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R10", "IM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "B3-SEM IV", "T5", "IM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "E1-SEM IV", "T5", "IM"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "E2-SEM IV", "T5", "IM")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Tutorial", "IBFS6-SEM VI", "T5", "IBFS"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "R5", "IM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM IV", "R5", "IM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "A3-SEM IV", "T5", "IM")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "R5", "IM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "D2-SEM IV", "T5", "IM")
  ]
};
var scheduleTNM = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-I-SEM VI", "R14", "IMFE")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-I-SEM VI", "R4", "IMFE"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A1-SEM VIII", "T12", "TEB"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM VIII", "T38", "TEB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "IMFE1-SEM VI", "T37", "IMFE")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-I-SEM VI", "R16", "IMFE"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "B3-SEM VIII", "T12", "TEB"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM VIII", "T38", "TEB"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "IMFE2-SEM VI", "T37", "IMFE")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM VIII", "R16", "TEB"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "IMFE3-SEM VI", "T12", "IMFE")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM VIII", "R4", "TEB"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM VIII", "R4", "TEB"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "IMFE4-SEM VI", "T12", "IMFE")
  ]
};
var scheduleSAP = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "R10", "ADVT"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "MCOM-SEM IV", "T12", "CB")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "R10", "ADVT"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VI", "R10", "ADVT"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "ADV7-SEM VI", "T12", "ADVT")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VI", "R10", "ADVT"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "MCOM-SEM II", "T12", "CB")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "ADV2-SEM VI", "T12", "ADVT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VI", "R8", "ADVT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "ADV15-SEM VI", "T12", "ADVT")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "ADV10-SEM VI", "T12", "ADVT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM VI", "R10", "ADVT")
  ]
};
var scheduleNNM = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "R34", "GSTCL"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "H3-SEM VI", "T35", "GSTCL"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-G-SEM VI", "R21", "GSTCL"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "F1-SEM VI", "T35", "GSTCL"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "K1-SEM VI", "T35", "GSTCL")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "R13", "GSTCL"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "E2-SEM VI", "T35", "GSTCL"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "M2-SEM VI", "T35", "GSTCL"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "MCOM-SEM IV", "T35", "CTPS")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "R21", "GSTCL"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "J3-SEM VI", "T35", "GSTCL")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM VI", "R5", "GSTCL"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "C3-SEM VI", "T35", "GSTCL")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM VI", "R10", "GSTCL")
  ]
};
var scheduleKIJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM IV", "R22", "COST")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM IV", "R22", "COST"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM II", "R13", "CLAW"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "B3-SEM II", "T26", "CLAW")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "I3-SEM IV", "T25", "COST"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM IV", "R22", "COST"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "D1-SEM IV", "T24", "COST"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "C3-SEM II", "T26", "CLAW")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM II", "R13", "CLAW"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM II", "T3", "CLAW"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "G3-SEM II", "T26", "CLAW")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "F3-SEM IV", "T26", "COST"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM II", "R15", "CLAW"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "M2-SEM IV", "T27", "COST")
  ]
};
var scheduleVAJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM IV", "R21", "IM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "L1-SEM VI", "T26", "CG"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "I2-SEM VI", "T39", "CG")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "E3-SEM IV", "T31", "IM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "A1-SEM IV", "T31", "IM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-F-SEM IV", "R15", "IM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "F3-SEM IV", "T26", "IM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM IV", "PB3", "IM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM IV", "T26", "IM")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM IV", "R3", "IM")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM IV", "T32", "IM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-E-SEM IV", "R15", "IM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "C1-SEM IV", "T27", "IM"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-F-SEM IV", "R27", "IM")
  ]
};
var scheduleKRA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-N-SEM IV", "R26", "BSTAT"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM IV", "R29", "BSTAT"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lab", "MP2-SEM IV", "R29-MP2", "BSTAT")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM IV", "R29", "BSTAT"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "MP1-SEM IV", "R29-MP1", "BSTAT")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "NP1-SEM IV", "R16-NP1", "BSTAT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM IV", "R27", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "NP2-SEM IV", "R19-NP2", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lab", "NP1-SEM IV", "R19-NP1", "BSTAT"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM IV", "R22", "BSTAT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "MP1-SEM IV", "PB3-MP1", "BSTAT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "MP2-SEM IV", "R4-MP2", "BSTAT")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lab", "NP2-SEM IV", "R19-NP2", "BSTAT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM IV", "R22", "BSTAT")
  ]
};
var scheduleMAB = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-J-SEM II", "R17", "HRM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM II", "T25", "HRM")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM II", "R18", "HRM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "B1-SEM II", "T25", "HRM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-J-SEM II", "R18", "HRM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM II", "T25", "HRM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "F2-SEM II", "T25", "HRM")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM II", "R17", "HRM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "I2-SEM II", "T26", "HRM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "L1-SEM II", "T27", "HRM"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "ADV16-SEM VI", "T25", "ADVT")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-J-SEM II", "R10", "HRM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "H1-SEM II", "T27", "HRM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM II", "R33", "HRM")
  ]
};
var scheduleANK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM IV", "R22", "SM")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM IV", "R13", "SM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "I2-SEM IV", "T42", "SM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "G1-SEM IV", "T33", "SM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "J2-SEM IV", "T33", "SM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "J1-SEM IV", "T5", "SM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "I1-SEM IV", "T4", "SM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-H-SEM IV", "R22", "SM")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "J1-SEM II", "T5", "HRM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-G-SEM IV", "R15", "SM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "I3-SEM IV", "T33", "SM")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "M2-SEM II", "T5", "HRM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM IV", "R26", "SM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM IV", "R34", "SM")
  ]
};
var scheduleAOK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM II", "R17", "CA"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "A3-SEM II", "T39", "CA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-E-SEM II", "R34", "CA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "I1-SEM VI", "T40", "CG")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-E-SEM II", "R17", "CA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "K2-SEM II", "T39", "CA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM II", "T40", "CA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "I3-SEM VI", "T40", "CG")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM II", "R17", "CA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "N1-SEM II", "T41", "CA")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-E-SEM II", "R17", "CA"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "L1-SEM II", "T40", "CA")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM II", "R1", "CA"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Tutorial", "I1-SEM II", "T40", "CA")
  ]
};
var scheduleASA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM II", "R13", "HRM"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM II", "T8", "HRM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "MCOM-SEM IV", "T8", "HRA")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM II", "R8", "HRM"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "E1-SEM II", "T8", "HRM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "B2-SEM II", "T4", "HRM")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM II", "R3", "HRM"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM II", "R13", "HRM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM II", "T14", "HRM")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM II", "R2", "HRM"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "D1-SEM II", "T8", "HRM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "N2-SEM II", "T27", "HRM")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM II", "R2", "HRM"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "D3-SEM II", "T8", "HRM")
  ]
};
var scheduleRKS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R2", "CA"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "K1-SEM II", "T5", "CA")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R2", "CA"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "J1-SEM II", "T36", "CA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "N3-SEM II", "T36", "CA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM II", "R21", "CA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "R1", "CA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM II", "T27", "CA")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM II", "R18", "CA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "N2-SEM II", "T42", "CA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "MCOM-SEM IV", "T46", "IRCL")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM II", "R21", "CA"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "L2-SEM II", "T1", "CA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "J3-SEM II", "T1", "CA")
  ]
};
var scheduleSIA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "R28", "COST"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM IV", "R27", "COST")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "R17", "COST"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM IV", "T26", "COST"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM IV", "CLIB", "COST"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "MCOM-SEM IV", "T32", "IFM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "R17", "COST"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "E3-SEM IV", "T26", "COST"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM IV", "R17", "COST"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "N3-SEM IV", "T33", "COST")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM IV", "R28", "COST"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM IV", "R27", "COST"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "H3-SEM IV", "T30", "COST")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM IV", "R17", "COST"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "I2-SEM IV", "T32", "COST"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "J3-SEM IV", "T33", "COST")
  ]
};
var scheduleBLK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:30 AM", "12:30 PM", "Lab", "MP1-SEM VI", "CL2-MP1", "BA"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lab", "MP1-SEM VI", "CL2-MP1", "BA")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "CL1", "BA"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "LP1-SEM VI", "SCR2-LP1", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "LP1-SEM VI", "SCR2-LP1", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "MP1-SEM VI", "CL2-MP1", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM VI", "CL2", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "BP1-SEM VI", "R31-BP1", "BA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "BP1-SEM VI", "R31-BP1", "BA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "MP1-SEM VI", "R31-MP1", "BA")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "R30", "BA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "LP1-SEM VI", "R31-LP1", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "LP1-SEM VI", "R31-LP1", "BA")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM VI", "CLIB", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "BP1-SEM VI", "CL1-BP1", "BA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "BP1-SEM VI", "CL1-BP1", "BA")
  ]
};
var scheduleSUY = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM II", "R15", "CLAW"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "C2-SEM VI", "T7", "CG")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM II", "R18", "CLAW"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM II", "R33", "CLAW"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "N2-SEM II", "T7", "CLAW")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM II", "R18", "CLAW"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM II", "R32", "CLAW"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "E1-SEM II", "T7", "CLAW"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "A1-SEM VI", "T38", "CG")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM II", "R34", "CLAW"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM II", "R18", "CLAW"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "N3-SEM II", "T7", "CLAW"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM II", "T41", "CLAW")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM II", "R8", "CLAW"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "L3-SEM II", "T7", "CLAW"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM II", "R22", "CLAW")
  ]
};
var scheduleHHK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Tutorial", "D1-SEM VIII", "PB2", "FTA"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lab", "KP2-SEM VI", "CL1-KP2", "BA"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lab", "KP2-SEM VI", "CL1-KP2", "BA"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM VIII", "PB2", "FTA"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lecture", "BCH-D-SEM VIII", "PB2", "FTA")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "HP1-SEM VI", "SCR3-HP1", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "HP1-SEM VI", "SCR3-HP1", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "KP2-SEM VI", "R19-KP2", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "KP2-SEM VI", "R19-KP2", "BA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "HP1-SEM VI", "CLIB-HP1", "BA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "HP1-SEM VI", "CLIB-HP1", "BA")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "EP1-SEM VI", "CLIB-EP1", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "EP1-SEM VI", "CLIB-EP1", "BA")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM VIII", "PB2", "FTA"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "EP1-SEM VI", "CL2-EP1", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "EP1-SEM VI", "CL2-EP1", "BA")
  ]
};
var scheduleMTS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R15", "BSTAT"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM IV", "R15", "BSTAT")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R32", "BSTAT"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "DP1-SEM IV", "R20-DP1", "BSTAT"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "DP2-SEM IV", "R20-DP2", "BSTAT")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R28", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "DP1-SEM IV", "R20-DP1", "BSTAT"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "DP2-SEM IV", "R20-DP2", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R15", "BSTAT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM II", "T33", "HRM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "AP1-SEM IV", "R20-AP1", "BSTAT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lab", "AP2-SEM IV", "R20-AP2", "BSTAT")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R15", "BSTAT"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "G3-SEM II", "T46", "HRM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "AP1-SEM IV", "R20-AP1", "BSTAT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lab", "AP2-SEM IV", "R20-AP2", "BSTAT")
  ]
};
var schedulePNM = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM IV", "R32", "COST"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "R32", "COST"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "A2-SEM II", "T26", "OBL")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "F2-SEM IV", "T32", "COST"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM IV", "R15", "COST"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-L-SEM IV", "R27", "COST"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "K1-SEM IV", "T50", "COST")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM IV", "R15", "COST"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "N1-SEM IV", "T49", "COST"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM IV", "R2", "COST"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "K2-SEM IV", "T37", "COST")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "L1-SEM IV", "T50", "COST"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "LIBRARY FF", "COST"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM IV", "R21", "COST"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "E2-SEM IV", "T24", "COST")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM IV", "R21", "COST")
  ]
};
var schedulePAA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "E2-SEM II", "T38", "HRM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM II", "R1", "HRM")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "F1-SEM II", "T38", "HRM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-M-SEM II", "R2", "HRM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "K2-SEM II", "T38", "HRM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM II", "R1", "HRM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A1-SEM II", "T38", "CA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM II", "R2", "HRM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM II", "R18", "HRM")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "J3-SEM II", "T38", "HRM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-M-SEM II", "R34", "HRM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM II", "R32", "HRM"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "G2-SEM II", "T38", "HRM")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "H2-SEM II", "T38", "HRM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM II", "R10", "HRM"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-M-SEM II", "R3", "HRM")
  ]
};
var scheduleMDH = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "L2-SEM IV", "T24", "IB"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "G2-SEM IV", "T27", "IB"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM IV", "R23", "IB"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-E-SEM IV", "R13", "IB")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "H1-SEM IV", "T23", "IB"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "B2-SEM IV", "T1", "IB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM IV", "R35", "IB"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM IV", "R18", "IB")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "I2-SEM II", "T50", "CLAW"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "M3-SEM IV", "T5", "IB"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM IV", "R7", "IB"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM IV", "R18", "IB")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "M2-SEM IV", "T35", "IB"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM IV", "R13", "IB"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM IV", "R28", "IB")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-G-SEM IV", "R2", "IB")
  ]
};
var scheduleVAK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "IB"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-J-SEM IV", "R13", "IB")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "IB"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "N1-SEM IV", "T31", "IB"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "K2-SEM IV", "T33", "IB")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM IV", "R5", "IB"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "H2-SEM IV", "T31", "IB"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "G1-SEM IV", "T31", "IB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM VI", "PB3", "IMFE")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-J-SEM IV", "R13", "IB"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "I1-SEM IV", "T31", "IB"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM VI", "R4", "IMFE")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-J-SEM IV", "R13", "IB"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "J3-SEM IV", "T31", "IB"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM VI", "R4", "IMFE"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "I3-SEM IV", "T32", "IB")
  ]
};
var scheduleJDP = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "L1-SEM VI", "T39", "GSTCL"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM II", "T40", "OBL"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM VI", "R15", "GSTCL"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM VI", "R33", "GSTCL")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-E-SEM VI", "R33", "GSTCL"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM VI", "R35", "GSTCL"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "G2-SEM VI", "T39", "GSTCL"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "G3-SEM VI", "T39", "GSTCL")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM VI", "R35", "GSTCL"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-E-SEM VI", "R32", "GSTCL"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "A3-SEM VI", "T39", "GSTCL")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-E-SEM VI", "R27", "GSTCL"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "F3-SEM VI", "T39", "GSTCL")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM VI", "R27", "GSTCL"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "I2-SEM VI", "T39", "GSTCL"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-B-SEM VI", "R35", "GSTCL")
  ]
};
var scheduleAAR = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-E-SEM IV", "R22", "BSTAT"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM VI", "T33", "GSTCL"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "BSTAT")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "EP1-SEM IV", "R14-EP1", "BSTAT"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "EP2-SEM IV", "R14-EP2", "BSTAT"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-B-SEM IV", "R27", "BSTAT")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R3", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "EP1-SEM IV", "R14-EP1", "BSTAT"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "EP2-SEM IV", "R14-EP2", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-E-SEM IV", "R17", "BSTAT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "BP1-SEM IV", "R6-BP1", "BSTAT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lab", "BP2-SEM IV", "R14-BP2", "BSTAT")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM IV", "R3", "BSTAT"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM VI", "T33", "GSTCL"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "BP2-SEM IV", "R14-BP2", "BSTAT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lab", "BP1-SEM IV", "R14-BP1", "BSTAT")
  ]
};
var scheduleJTW = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "F3-SEM IV", "T50", "IB"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "R3", "IB"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM IV", "R21", "IB")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "H3-SEM IV", "T50", "IB"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "R34", "IB"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "L1-SEM IV", "T45", "IB"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-H-SEM IV", "R17", "IB")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R13", "IB"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "D3-SEM IV", "T50", "IB"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "C1-SEM VI", "T50", "CG"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-H-SEM IV", "R32", "IB")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Tutorial", "H1-SEM VI", "T50", "CG"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM IV", "R32", "IB"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "G3-SEM IV", "T50", "IB"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-H-SEM IV", "R3", "IB")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM IV", "R1", "IB")
  ]
};
var scheduleYAM = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM IV", "CLIB", "BSTAT"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "HP2-SEM IV", "R6-HP2", "BSTAT"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "HP2-SEM IV", "R6-HP2", "BSTAT")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM IV", "R34", "BSTAT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "FP1-SEM IV", "R4-FP1", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "HP1-SEM IV", "R16-HP1", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM IV", "R35", "BSTAT"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "B2-SEM VI", "T25", "GSTCL"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM IV", "R10", "BSTAT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "HP1-SEM IV", "PB3-HP1", "BSTAT")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM IV", "R15", "BSTAT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "C2-SEM VI", "T14", "GSTCL"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "FP1-SEM IV", "R16-FP1", "BSTAT"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "FP2-SEM IV", "R16-FP2", "BSTAT")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-F-SEM IV", "R22", "BSTAT"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lab", "FP2-SEM IV", "R6-FP2", "BSTAT")
  ]
};
var scheduleAUV = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "DP2-SEM VI", "CLIB-DP2", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "DP2-SEM VI", "CLIB-DP2", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "FP2-SEM VI", "R19-FP2", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "FP2-SEM VI", "CL1-FP2", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM VI", "CL2", "BA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM VI", "R15", "BA"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lab", "FP2-SEM VI", "CL1-FP2", "BA")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "DP2-SEM VI", "CL2-DP2", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "DP2-SEM VI", "CL2-DP2", "BA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM VI", "R28", "BA")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "GP1-SEM VI", "SCR4-GP1", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "GP1-SEM VI", "SCR4-GP1", "BA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "FP2-SEM VI", "CL2-FP2", "BA")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lab", "GP1-SEM VI", "CL2-GP1", "BA"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lab", "GP1-SEM VI", "CL2-GP1", "BA"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM VI", "R10", "BA")
  ]
};
var scheduleSVP = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM II", "R33", "HRM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "F3-SEM II", "T14", "HRM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-D-SEM IV", "R18", "IB")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM IV", "R27", "IB"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "N3-SEM IV", "T14", "IB"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM II", "R3", "HRM")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM IV", "R28", "IB"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "I1-SEM II", "T14", "HRM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "D2-SEM IV", "T14", "IB"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM IV", "R13", "IB"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "C2-SEM II", "T14", "HRM")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "D1-SEM IV", "T14", "IB"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-M-SEM IV", "R8", "IB"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-D-SEM IV", "R13", "IB")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM II", "R35", "HRM"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "M1-SEM II", "T14", "HRM")
  ]
};
var scheduleDAB = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM II", "R27", "CA"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "F3-SEM II", "T41", "CA")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "M3-SEM IV", "T1", "COST"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM II", "R18", "CA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "G2-SEM IV", "T41", "COST"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM IV", "R8", "COST")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "M3-SEM II", "T41", "CA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "D3-SEM IV", "T41", "COST"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM II", "R15", "CA"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM IV", "R8", "COST")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "D2-SEM II", "T43", "CA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM II", "R3", "CA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM II", "T1", "CA"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM IV", "R8", "COST")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM II", "R33", "CA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM II", "R17", "CA")
  ]
};
var schedulePRA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM IV", "R17", "BSTAT"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "H2-SEM VI", "T31", "GSTCL"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lab", "CP1-SEM IV", "R6-CP1", "BSTAT")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-I-SEM IV", "R28", "BSTAT"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM IV", "R28", "BSTAT")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM IV", "R22", "BSTAT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "IP1-SEM IV", "R6-IP1", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "IP2-SEM IV", "R6-IP2", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM IV", "R10", "BSTAT"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "IP2-SEM IV", "R20-IP2", "BSTAT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "IP1-SEM IV", "R20-IP1", "BSTAT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "CP2-SEM IV", "R31-CP2", "BSTAT")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-I-SEM IV", "R27", "BSTAT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "C1-SEM VI", "T33", "GSTCL"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "CP1-SEM IV", "R20-CP1", "BSTAT"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "CP2-SEM IV", "R31-CP2", "BSTAT")
  ]
};
var scheduleSHG = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "F2-SEM VI", "T27", "GSTCL"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM VI", "R15", "GSTCL")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM VI", "R22", "GSTCL"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "G1-SEM VI", "T32", "GSTCL"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-L-SEM VI", "R15", "GSTCL"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "J2-SEM VI", "T27", "GSTCL")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM VI", "LIBRARY FF", "GSTCL"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "L3-SEM VI", "T32", "GSTCL"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-L-SEM VI", "R21", "GSTCL")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM VI", "R35", "GSTCL"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "B1-SEM VI", "T32", "GSTCL"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-H-SEM VI", "R15", "GSTCL"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "M2-SEM II", "T31", "CLAW")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM VI", "R13", "GSTCL"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM VI", "R3", "GSTCL"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "I1-SEM VI", "T26", "GSTCL")
  ]
};
var scheduleSAA = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "LP2-SEM VI", "R4-LP2", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "LP2-SEM VI", "R4-LP2", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "MP2-SEM VI", "CL1-MP2", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM VI", "R32", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "BP2-SEM VI", "CL1-BP2", "BA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "BP2-SEM VI", "CL1-BP2", "BA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "MP2-SEM VI", "CL1-MP2", "BA")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "LP2-SEM VI", "R19-LP2", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "LP2-SEM VI", "R19-LP2", "BA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM VI", "R34", "BA")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM VI", "CL1", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "BP2-SEM VI", "CLIB-BP2", "BA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "BP2-SEM VI", "CLIB-BP2", "BA"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-J-SEM VI", "R32", "BA")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lab", "NP2-SEM VI", "CL1-NP2", "BA"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lab", "NP2-SEM VI", "CL1-NP2", "BA")
  ]
};
var scheduleATS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM IV", "R21", "COST"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "MCOM-SEM II", "T49", "ODCM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "M1-SEM IV", "T49", "COST")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM IV", "R21", "COST"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "N2-SEM IV", "T49", "COST"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R1", "COST"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-F-SEM IV", "R26", "COST"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "H1-SEM IV", "T49", "COST")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM IV", "PB3", "COST"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "G1-SEM IV", "T49", "COST"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R28", "COST")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM IV", "R33", "COST"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "K3-SEM IV", "T27", "COST"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R1", "COST")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM IV", "R3", "COST"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Tutorial", "G3-SEM IV", "T14", "COST")
  ]
};
var scheduleSTS = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-J-SEM VI", "R30", "GSTCL"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "J1-SEM VI", "T50", "GSTCL"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM VI", "R35", "GSTCL")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM VI", "PB3", "GSTCL"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "L2-SEM VI", "T50", "GSTCL"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "D2-SEM VI", "T54", "GSTCL"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-J-SEM VI", "R22", "GSTCL")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "N3-SEM VI", "T53", "GSTCL"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM VI", "R5", "GSTCL"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "B1-SEM II", "T50", "CA")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM VI", "R27", "GSTCL"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "M1-SEM VI", "T41", "GSTCL"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM VI", "PB3", "GSTCL"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "N2-SEM VI", "T50", "GSTCL")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-N-SEM VI", "R5", "GSTCL"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM VI", "R3", "GSTCL")
  ]
};
var scheduleSJJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM II", "R35", "CA")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM II", "R8", "CA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "H1-SEM II", "T38", "CA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-H-SEM II", "R18", "CA"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "MCOM-SEM IV", "T35", "ITL")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM II", "R13", "CA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "M2-SEM II", "T36", "CA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "E2-SEM II", "T36", "CA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-L-SEM II", "R13", "CA")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "I3-SEM II", "T36", "CA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "E1-SEM II", "T36", "CA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM II", "R33", "CA"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-H-SEM II", "R1", "CA")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM II", "T36", "CA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-L-SEM II", "R26", "CA"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM II", "CL1", "CA")
  ]
};
var scheduleAJJ = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM VI", "R34", "CG"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "E3-SEM VI", "T40", "CG"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "G3-SEM VI", "T40", "CG"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM VI", "R17", "CG")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM VI", "R33", "CG"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "C3-SEM VI", "T40", "CG"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM VI", "LIBRARY FF", "CG"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "MCOM-SEM IV", "T49", "EXIM")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM VI", "R31", "CG"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "F2-SEM VI", "T40", "CG"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM VI", "R22", "CG")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM VI", "R32", "CG"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM VI", "LIBRARY FF", "CG"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM VI", "T40", "CG")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM VI", "R22", "CG"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Tutorial", "N1-SEM VI", "T38", "CG")
  ]
};
var scheduleDTY = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM IV", "R35", "BSTAT"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "E1-SEM IV", "T27", "COST"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM IV", "R28", "COST")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM IV", "R8", "BSTAT"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "L2-SEM IV", "T27", "COST"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "D2-SEM IV", "T27", "COST")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM IV", "R8", "BSTAT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "LP1-SEM IV", "R6-LP1", "BSTAT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "LP2-SEM IV", "R14-LP2", "BSTAT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "A1-SEM IV", "T27", "COST")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "J2-SEM IV", "T29", "COST"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "LP1-SEM IV", "R6-LP1", "BSTAT"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "LP2-SEM IV", "R6-LP2", "BSTAT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM IV", "R21", "COST")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "F1-SEM IV", "T27", "COST"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM IV", "R22", "COST")
  ]
};
var scheduleAAT = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-K-SEM VI", "R28", "GSTCL"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "H1-SEM VI", "T32", "GSTCL"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-M-SEM VI", "CL2", "GSTCL"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "I3-SEM VI", "T33", "GSTCL"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "K3-SEM VI", "T33", "GSTCL")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM VI", "R15", "GSTCL"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM VI", "CL1", "GSTCL"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "H2-SEM II", "T49", "CA")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM VI", "R18", "GSTCL"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "D3-SEM VI", "T33", "GSTCL")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "M3-SEM VI", "T33", "GSTCL"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM VI", "R32", "GSTCL"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-M-SEM VI", "R27", "GSTCL")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM VI", "R28", "GSTCL"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM VI", "R28", "GSTCL"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "K2-SEM VI", "T33", "GSTCL")
  ]
};
var scheduleVIC = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "2:00 PM", "3:00 PM", "Lab", "SEC6-SEM VI", "R23-SEC6", "DM"),
    createClass("Monday", "3:00 PM", "4:00 PM", "Lab", "SEC6-SEM VI", "R23-SEC6", "DM"),
    createClass("Monday", "4:00 PM", "5:00 PM", "Lab", "SEC6-SEM VI", "R23-SEC6", "DM"),
    createClass("Monday", "5:00 PM", "6:00 PM", "Lab", "SEC6-SEM VI", "R23-SEC6", "DM")
  ],
  Tuesday: [
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "D1-SEM IV", "T4", "FIB"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-D-SEM IV", "R29", "FIB")
  ],
  Wednesday: [
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM IV", "R6", "FIB"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-D-SEM IV", "R29", "FIB")
  ],
  Thursday: [
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lab", "SEC5-SEM IV", "R19-SEC5", "DM"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "SEC5-SEM IV", "R19-SEC5", "DM"),
    createClass("Thursday", "4:00 PM", "5:00 PM", "Lab", "SEC5-SEM IV", "R19-SEC5", "DM"),
    createClass("Thursday", "5:00 PM", "6:00 PM", "Lab", "SEC5-SEM IV", "R19-SEC5", "DM")
  ],
  Friday: [
    createClass("Friday", "2:00 PM", "3:00 PM", "Lab", "SEC19-SEM II", "R13-SEC19", "DM"),
    createClass("Friday", "3:00 PM", "4:00 PM", "Lab", "SEC19-SEM II", "R13-SEC19", "DM"),
    createClass("Friday", "4:00 PM", "5:00 PM", "Lab", "SEC19-SEM II", "R13-SEC19", "DM"),
    createClass("Friday", "5:00 PM", "6:00 PM", "Lab", "SEC19-SEM II", "R13-SEC19", "DM")
  ]
};
var scheduleATK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM IV", "CL2", "BSTAT"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-J-SEM IV", "R3", "BSTAT")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-J-SEM IV", "CLIB", "BSTAT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "JP2-SEM IV", "R16-JP2", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "GP2-SEM IV", "R4-GP2", "BSTAT"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "JP2-SEM IV", "R4-JP2", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM IV", "R33", "BSTAT"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "JP1-SEM IV", "SCR1-JP1", "BSTAT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "JP1-SEM IV", "SCR1-JP1", "BSTAT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM VI", "T49", "GSTCL"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "E1-SEM VI", "T49", "GSTCL")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lab", "GP1-SEM IV", "R6-GP1", "BSTAT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "GP2-SEM IV", "R6-GP2", "BSTAT"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM IV", "R18", "BSTAT")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-G-SEM IV", "R2", "BSTAT"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lab", "GP1-SEM IV", "R2-GP1", "BSTAT")
  ]
};
var scheduleSNS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM VI", "R10", "ADVT"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM VI", "R34", "ADVT"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "ADV18-SEM VI", "T37", "ADVT"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "ADV17-SEM VI", "T37", "ADVT")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "ADV20-SEM VI", "T37", "ADVT"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM IV", "T54", "SM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-H-SEM VI", "R22", "ADVT"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-E-SEM VI", "R34", "ADVT")
  ],
  Wednesday: [
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM VI", "SCR4", "ADVT"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-E-SEM VI", "R27", "ADVT")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM VI", "R6", "ADVT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "ADV3-SEM VI", "T39", "ADVT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM VI", "PB2", "ADVT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "ADV19-SEM VI", "T37", "ADVT")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "ADV12-SEM VI", "T38", "ADVT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM VI", "PB2", "ADVT")
  ]
};
var scheduleGVR = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-F-SEM II", "R33", "HRM"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "MCOM-SEM IV", "T13", "IPP")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM II", "R34", "HRM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "I3-SEM II", "T13", "HRM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "K1-SEM II", "T13", "HRM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-A-SEM II", "R17", "HRM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM II", "R22", "HRM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM II", "R17", "HRM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "E3-SEM II", "T13", "HRM"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "L3-SEM II", "T14", "HRM")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "G1-SEM II", "T13", "HRM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-F-SEM II", "R2", "HRM"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-A-SEM II", "R17", "HRM")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "M3-SEM II", "T13", "HRM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM II", "R18", "HRM"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-A-SEM II", "R17", "HRM")
  ]
};
var schedulePKK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-F-SEM VI", "PB3", "ADVT"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM VI", "R28", "ADVT"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "ADV25-SEM VI", "T37", "ADVT")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM IV", "T48", "SM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-F-SEM VI", "R3", "ADVT"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-B-SEM VI", "R28", "ADVT")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "ADV1-SEM VI", "T37", "ADVT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM VI", "R21", "ADVT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-B-SEM VI", "R28", "ADVT")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM VI", "PB3", "ADVT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "ADV6-SEM VI", "T37", "ADVT"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM VI", "PB3", "ADVT"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "ADV9-SEM VI", "T37", "ADVT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "ADV22-SEM VI", "T37", "ADVT")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM VI", "R22", "ADVT"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Tutorial", "ADV21-SEM VI", "T37", "ADVT")
  ]
};
var scheduleAAA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lab", "KP1-SEM VI", "R19-KP1", "BA"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lab", "KP1-SEM VI", "R19-KP1", "BA"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lab", "JP1-SEM VI", "CLIB-JP1", "BA"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lab", "JP1-SEM VI", "CLIB-JP1", "BA")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "NP1-SEM VI", "R19-NP1", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "NP1-SEM VI", "R19-NP1", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM VI", "R32", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "KP1-SEM VI", "R31-KP1", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "NP1-SEM VI", "R14-NP1", "BA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "NP1-SEM VI", "SCR4-NP1", "BA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "KP1-SEM VI", "R30-KP1", "BA")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-N-SEM VI", "CL1", "BA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-N-SEM VI", "CL1", "BA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM VI", "CL1", "BA")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "JP1-SEM VI", "PB2-JP1", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "JP1-SEM VI", "PB2-JP1", "BA")
  ]
};
var scheduleRAC = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "2:00 PM", "3:00 PM", "Lecture", "SEC5-SEM II", "R16", "PFP"),
    createClass("Monday", "3:00 PM", "4:00 PM", "Lab", "SEC5-SEM II", "R16-SEC5", "PFP"),
    createClass("Monday", "4:00 PM", "5:00 PM", "Lab", "SEC5-SEM II", "R16-SEC5", "PFP")
  ],
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "SEC1-SEM VI", "R19", "PFP"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "SEC1-SEM VI", "R19-SEC1", "PFP"),
    createClass("Tuesday", "4:00 PM", "5:00 PM", "Lab", "SEC1-SEM VI", "R19-SEC1", "PFP")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "KP2-SEM IV", "SCR3-KP2", "BSTAT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "KP2-SEM IV", "SCR3-KP2", "BSTAT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM IV", "R21", "BSTAT")
  ],
  Thursday: [
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM IV", "CL2", "BSTAT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lab", "KP1-SEM IV", "R31-KP1", "BSTAT"),
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lecture", "SEC2-SEM IV", "R20", "PFP"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "SEC2-SEM IV", "R20-SEC2", "PFP"),
    createClass("Thursday", "4:00 PM", "5:00 PM", "Lab", "SEC2-SEM IV", "R20-SEC2", "PFP")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM IV", "R32", "BSTAT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lab", "KP1-SEM IV", "SCR4-KP1", "BSTAT")
  ]
};
var scheduleRAS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM VI", "R18", "CG"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "L3-SEM VI", "T43", "CG")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-F-SEM VI", "PB3", "CG"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "J2-SEM VI", "T43", "CG"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM VI", "R33", "CG")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "K1-SEM VI", "T43", "CG"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-G-SEM VI", "R33", "CG"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM VI", "R33", "CG"),
    createClass("Wednesday", "12:30 PM", "1:30 AM", "Lecture", "A2-SEM II", "T40", "CGBE")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM VI", "R21", "CG"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "B3-SEM VI", "T43", "CG"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-F-SEM VI", "R18", "CG")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-F-SEM VI", "R28", "CG"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM VI", "T43", "CG"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "M1-SEM VI", "T43", "CG"),
    createClass("Friday", "12:30 PM", "1:30 AM", "Lecture", "BCH-E-SEM VI", "R33", "CG")
  ]
};
var scheduleKKS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "IBFS8-SEM VI", "T44", "LDO"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM VI", "R35", "IBFS"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VI", "PB3", "IBFS"),
    createClass("Monday", "12:30 PM", "1:30 AM", "Lecture", "Joint-SEM VI", "PB3", "IBFS")
  ],
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM VI", "R28", "IBFS"),
    createClass("Tuesday", "12:30 PM", "1:30 AM", "Tutorial", "IBFS4-SEM VI", "T44", "IBFS")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "IBFS1-SEM VI", "T44", "IBFS"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM VI", "R35", "IBFS"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "IBFS7-SEM VI", "T44", "IBFS")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "IBFS2-SEM VI", "T44", "IBFS"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM VI", "R35", "IBFS"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "LDO1-SEM VI", "T44", "LDO"),
    createClass("Thursday", "12:30 PM", "1:30 AM", "Lecture", "BCH-J-SEM VI", "R13", "IBFS")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM VI", "R33", "IBFS"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VI", "SCR4", "IBFS"),
    createClass("Friday", "12:30 PM", "1:30 AM", "Tutorial", "LDO2-SEM VI", "T44", "LDO")
  ]
};
var schedulePAC = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "E3-SEM II", "T42", "CA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM II", "R27", "CA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM II", "LIBRARY FF", "CA"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "H2-SEM IV", "T41", "COST")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "K3-SEM II", "T49", "CA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM II", "R28", "CA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "H3-SEM II", "T42", "CA"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-A-SEM II", "R33", "CA")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R33", "CA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "L3-SEM IV", "T44", "COST"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM II", "R22", "CA"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "MCOM-SEM II", "T41", "SAPM")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM II", "R2", "CA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "J2-SEM II", "T40", "CA"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM II", "R1", "CA")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM II", "R3", "CA")
  ]
};
var scheduleAVB = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM VI", "R34", "CG"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "L2-SEM VI", "T29", "CG"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "BCH-K-SEM VI", "R33", "CG")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM VI", "R15", "CG"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "J3-SEM VI", "T29", "CG"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM VI", "R34", "CG")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM VI", "R34", "CG"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "K3-SEM VI", "T29", "CG"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM VI", "R34", "CG"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "F1-SEM VI", "T29", "CG")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM VI", "PB3", "CG"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-J-SEM VI", "R33", "CG"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "C2-SEM II", "T24", "FMB")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM VI", "R34", "CG"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "M3-SEM VI", "T29", "CG"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "M2-SEM VI", "T30", "CG")
  ]
};
var scheduleCUS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-H-SEM II", "R8", "HRM")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-H-SEM II", "R27", "HRM"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "COMM1-SEM VI", "T46", "LD"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VI", "R7", "LD"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "COMM3-SEM VI", "T44", "LD"),
    createClass("Tuesday", "12:30 PM", "1:30 AM", "Lecture", "Joint-SEM VI", "R23", "LD")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM VI", "T44", "LD"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "BCH-A-SEM VI", "PB4", "LD"),
    createClass("Wednesday", "12:30 PM", "1:30 AM", "Tutorial", "Joint-SEM VI", "R23", "LD")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM II", "R2", "HRM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "H3-SEM II", "T45", "HRM"),
    createClass("Thursday", "12:30 PM", "1:30 AM", "Lecture", "Joint-SEM VI", "R23", "LD")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "COMM2-SEM VI", "T25", "LD"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM VI", "T44", "LD"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VI", "R24", "LD"),
    createClass("Friday", "12:30 PM", "1:30 AM", "Tutorial", "A3-SEM VI", "T25", "LD")
  ]
};
var scheduleNJA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-K-SEM II", "R5", "CLAW"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "K3-SEM II", "T4", "CLAW"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM II", "R28", "CLAW")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-K-SEM II", "R5", "CLAW"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "E2-SEM II", "T5", "CLAW"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "ILL1-SEM VI", "T1", "IRLL")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-K-SEM II", "R2", "CLAW"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "D2-SEM II", "T1", "CLAW"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM II", "R27", "CLAW")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM VI", "R8", "IRLL"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "ILL2-SEM VI", "T1", "IRLL"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-M-SEM VI", "CL1", "IRLL")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-M-SEM VI", "R10", "IRLL"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "M3-SEM II", "T2", "CLAW"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-N-SEM II", "R10", "CLAW"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "ILL3-SEM VI", "T4", "IRLL")
  ]
};
var scheduleAKY = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:30 AM", "12:30 PM", "Lab", "VAC9-SEM II", "R27-VAC9", "DE"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lab", "VAC9-SEM II", "R27-VAC9", "DE")
  ],
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lab", "VAC9-SEM II", "R17-VAC9", "DE"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "VAC9-SEM II", "R17-VAC9", "DE")
  ],
  Thursday: [
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lab", "VAC8-SEM II", "R24-VAC8", "DE"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "VAC8-SEM II", "R24-VAC8", "DE")
  ],
  Friday: [
    createClass("Friday", "2:00 PM", "3:00 PM", "Lab", "VAC8-SEM II", "R17-VAC8", "DE"),
    createClass("Friday", "3:00 PM", "4:00 PM", "Lab", "VAC8-SEM II", "R17-VAC8", "DE")
  ]
};
var scheduleALK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lab", "FP1-SEM VI", "R14-FP1", "BA"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lab", "FP1-SEM VI", "R14-FP1", "BA"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM VI", "R1", "BA"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM VI", "R1", "BA")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM VI", "R30", "BA"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "DP1-SEM VI", "CL2-DP1", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "DP1-SEM VI", "CL2-DP1", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "FP1-SEM VI", "R4-FP1", "BA")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-F-SEM VI", "CLIB", "BA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "DP1-SEM VI", "R14-DP1", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "DP1-SEM VI", "R14-DP1", "BA")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "GP2-SEM VI", "R14-GP2", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "GP2-SEM VI", "R14-GP2", "BA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "FP1-SEM VI", "R30-FP1", "BA")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lab", "GP2-SEM VI", "R31-GP2", "BA"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lab", "GP2-SEM VI", "R31-GP2", "BA")
  ]
};
var scheduleSIM = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:00 AM", "12:30 PM", "Lab", "VAC21-SEM II", "R37-VAC21", "ABH"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lab", "VAC21-SEM II", "R37-VAC21", "ABH"),
    createClass("Monday", "2:00 PM", "3:00 PM", "Lecture", "BCH-A-SEM VIII", "SCR4", "RKM"),
    createClass("Monday", "3:00 PM", "4:00 PM", "Lecture", "BCH-A-SEM VIII", "SCR4", "RKM")
  ],
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "BCH-A-SEM VIII", "R7", "RKM"),
    createClass("Tuesday", "3:00 PM", "4:00 PM", "Lab", "VAC16-SEM IV", "R33-VAC16", "ABH"),
    createClass("Tuesday", "4:00 PM", "5:00 PM", "Lab", "VAC16-SEM IV", "R33-VAC16", "ABH")
  ],
  Wednesday: [
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Lecture", "VAC23-SEM II", "R13", "ABH"),
    createClass("Wednesday", "3:00 PM", "4:00 PM", "Lab", "VAC22-SEM II", "R13-VAC22", "ABH"),
    createClass("Wednesday", "4:00 PM", "5:00 PM", "Lab", "VAC22-SEM II", "R13-VAC22", "ABH")
  ],
  Thursday: [
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lecture", "VAC22-SEM II", "R21", "ABH"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "VAC23-SEM II", "R21-VAC23", "ABH"),
    createClass("Thursday", "4:00 PM", "5:00 PM", "Lab", "VAC23-SEM II", "R21-VAC23", "ABH")
  ],
  Friday: [
    createClass("Friday", "2:00 PM", "3:00 PM", "Lecture", "VAC21-SEM II", "R24", "ABH"),
    createClass("Friday", "3:00 PM", "4:00 PM", "Tutorial", "COMM1-SEM VIII", "T1", "RKM"),
    createClass("Friday", "4:00 PM", "5:00 PM", "Tutorial", "COMM2-SEM VIII", "T1", "RKM")
  ]
};
var scheduleSAG = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lab", "IP2-SEM VI", "CL2-IP2", "BA"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lab", "IP2-SEM VI", "CL2-IP2", "BA")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lab", "CP1-SEM VI", "SCR1-CP1", "BA"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "IP2-SEM VI", "SCR1-IP2", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "IP2-SEM VI", "CL1-IP2", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "CP1-SEM VI", "R6-CP1", "BA"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-A-SEM VI", "CL1", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "AP1-SEM VI", "SCR1-AP1", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "AP1-SEM VI", "SCR1-AP1", "BA")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lab", "CP1-SEM VI", "SCR1-CP1", "BA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VI", "R34", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM VI", "LIBRARY FF", "BA")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lab", "AP1-SEM VI", "SCR1-AP1", "BA"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "AP1-SEM VI", "SCR1-AP1", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-H-SEM VI", "R34", "BA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lab", "CP1-SEM VI", "SCR2-CP1", "BA")
  ]
};
var scheduleAAG = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "HP2-SEM VI", "R16-HP2", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "HP2-SEM VI", "R16-HP2", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Tutorial", "ADV14-SEM VI", "T37", "ADVT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "ADV8-SEM VI", "T45", "ADVT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "HP2-SEM VI", "CL2-HP2", "BA"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lab", "HP2-SEM VI", "CL2-HP2", "BA"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "ADV24-SEM VI", "T50", "ADVT")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "ADV4-SEM VI", "T37", "ADVT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "ADV5-SEM VI", "T41", "ADVT"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM VI", "R1", "ADVT"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "ADV11-SEM VI", "T39", "ADVT")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "JP2-SEM VI", "R31-JP2", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "JP2-SEM VI", "R31-JP2", "BA"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM VI", "R22", "ADVT"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "ADV23-SEM VI", "T46", "ADVT")
  ],
  Saturday: [
    createClass("Saturday", "12:30 PM", "1:30 PM", "Lecture", "BCH-G-SEM VI", "R22", "ADVT")
  ]
};
var scheduleLKB = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lab", "IP1-SEM VI", "R30-IP1", "BA"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lab", "IP1-SEM VI", "R30-IP1", "BA"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-I-SEM VI", "R2", "BA"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM VI", "R5", "BA")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "IP1-SEM VI", "R31-IP1", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "IP1-SEM VI", "R31-IP1", "BA"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lab", "CP2-SEM VI", "R30-CP2", "BA"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lab", "CP2-SEM VI", "R30-CP2", "BA")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lab", "AP2-SEM VI", "R30-AP2", "BA"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "AP2-SEM VI", "R30-AP2", "BA")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lab", "CP2-SEM VI", "CL2-CP2", "BA"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM VI", "R30", "BA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lab", "CP2-SEM VI", "CLIB-CP2", "BA"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM VI", "CL1", "BA")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lab", "AP2-SEM VI", "R30-AP2", "BA"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "AP2-SEM VI", "R30-AP2", "BA")
  ]
};
var scheduleSAR = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM VI", "R32", "CG"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM IV", "PB3", "HRD"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "K2-SEM IV", "T44", "HRD")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-N-SEM VI", "PB3", "CG"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "E1-SEM VI", "T43", "CG"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "K3-SEM IV", "T44", "HRD")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-N-SEM VI", "R28", "CG"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "F3-SEM VI", "T42", "CG"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "N3-SEM VI", "T42", "CG")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM VI", "R22", "CG"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-K-SEM IV", "R4", "HRD"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "N2-SEM VI", "T49", "CG")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM VI", "R22", "CG"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "K1-SEM IV", "T43", "HRD"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-K-SEM IV", "R23", "HRD"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-N-SEM VI", "R2", "CG")
  ]
};
var scheduleVIS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "EM2-SEM VIII", "T12", "EVM"),
    createClass("Monday", "2:00 PM", "3:00 PM", "Lecture", "Joint-SEM VIII", "R6", "EVM")
  ],
  Tuesday: [
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VIII", "PB2", "EVM"),
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "VAC5-SEM IV", "R1", "TGNLC")
  ],
  Wednesday: [
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VIII", "R14", "EVM"),
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Lecture", "VAC2-SEM II", "SCR3", "TGNLC"),
    createClass("Wednesday", "3:00 PM", "4:00 PM", "Lab", "VAC5-SEM IV", "R35-VAC5", "TGNLC"),
    createClass("Wednesday", "4:00 PM", "5:00 PM", "Lab", "VAC5-SEM IV", "R35-VAC5", "TGNLC")
  ],
  Thursday: [
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "MCOM-SEM IV", "T12", "SCML"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VIII", "R19", "EVM"),
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lab", "VAC2-SEM II", "SCR2-VAC2", "TGNLC"),
    createClass("Thursday", "3:00 PM", "4:00 PM", "Lab", "VAC2-SEM II", "SCR2-VAC2", "TGNLC")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "EM1-SEM VIII", "T25", "EVM"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "EM3-SEM VIII", "T12", "EVM"),
    createClass("Friday", "2:00 PM", "3:00 PM", "Lecture", "Joint-SEM VIII", "SCR4", "EVM"),
    createClass("Friday", "3:00 PM", "4:00 PM", "Lecture", "Joint-SEM VIII", "SCR4", "EVM")
  ]
};
var scheduleNAD = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM II", "R27", "HRM"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "THR1-SEM VIII", "T42", "THR"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-E-SEM II", "R18", "HRM")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "Joint-SEM VIII", "R20", "THR"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "B3-SEM II", "T14", "HRM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "L2-SEM II", "T43", "HRM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-E-SEM II", "R33", "HRM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "Joint-SEM VIII", "PB2", "THR"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "J2-SEM II", "T43", "HRM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM II", "R1", "HRM")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "Joint-SEM VIII", "PB2", "THR"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "N1-SEM II", "T42", "HRM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM II", "R3", "HRM")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM II", "R18", "HRM"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "D2-SEM II", "T42", "HRM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "THR2-SEM VIII", "T42", "THR")
  ]
};
var scheduleKNK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-E-SEM II", "R33", "CLAW"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM II", "CLIB", "CLAW")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "J2-SEM II", "T44", "CLAW"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM II", "R17", "CLAW"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "RM1-SEM VIII", "T45", "RLM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "H3-SEM II", "T39", "CLAW")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-E-SEM II", "R33", "CLAW"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "J3-SEM II", "T39", "CLAW"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VIII", "LIBRARY FF", "RLM"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "L1-SEM II", "T44", "CLAW")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM II", "R32", "CLAW"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "I3-SEM II", "T40", "CLAW"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VIII", "R17", "RLM")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "Joint-SEM VIII", "R35", "RLM"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "M1-SEM II", "T49", "CLAW"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-E-SEM II", "R17", "CLAW")
  ]
};
var scheduleSPB = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "Joint-SEM VIII", "R37", "BEHV"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "H1-SEM IV", "T45", "SM"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "G3-SEM IV", "T45", "SM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM IV", "R16", "SM")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "Joint-SEM VIII", "R37", "BEHV"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "BEHV1-SEM VIII", "T45", "BEHV"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "H3-SEM IV", "T45", "SM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-I-SEM IV", "R27", "SM")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "Joint-SEM VIII", "R6", "BEHV"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "G2-SEM IV", "T45", "SM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "BEHV2-SEM VIII", "T45", "BEHV"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM IV", "R19", "SM")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM IV", "R19", "SM"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "H2-SEM IV", "T5", "SM")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-I-SEM IV", "R18", "SM"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-I-SEM IV", "R18", "SM")
  ]
};
var scheduleSVK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lab", "JP2-SEM VI", "CLIB-JP2", "BA"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lab", "JP2-SEM VI", "CLIB-JP2", "BA"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "Joint-SEM VIII", "R13", "BLF"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lab", "MP2-SEM VI", "R30-MP2", "BA"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lab", "MP2-SEM VI", "R30-MP2", "BA")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lab", "NP2-SEM VI", "R14-NP2", "BA"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "Joint-SEM VIII", "R13", "BLF")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lab", "NP2-SEM VI", "CLIB-NP2", "BA"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "Joint-SEM VIII", "R13", "BLF"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "Joint-SEM VIII", "T41", "BLF"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "BF3-SEM VIII", "T42", "BLF")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lab", "EP2-SEM VI", "R16-EP2", "BA"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "EP2-SEM VI", "R16-EP2", "BA"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "BF2-SEM VIII", "T42", "BLF")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lab", "EP2-SEM VI", "R19-EP2", "BA"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "EP2-SEM VI", "R19-EP2", "BA")
  ]
};
var scheduleRJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R23", "MICRO"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R23", "MICRO"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM IV", "T6", "MICRO")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R23", "MICRO"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM IV", "T6", "MICRO"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "A2-SEM IV", "T6", "MICRO")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R23", "MICRO"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "B3-SEM IV", "T6", "MICRO")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R23", "MICRO"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM IV", "T6", "MICRO")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R23", "MICRO"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "B1-SEM IV", "T6", "MICRO")
  ]
};
var scheduleRUR = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "D3-SEM VI", "T2", "DTE"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM VI", "R25", "DTE")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM VI", "R7", "DTE"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "D1-SEM VI", "T2", "DTE"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "A2-SEM VI", "T2", "MFM")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "D2-SEM VI", "T2", "DTE"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM VI", "R23", "DTE"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "A1-SEM VI", "T2", "MFM")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM VI", "T2", "DTE"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "C3-SEM VI", "T2", "DTE"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-D-SEM VI", "R23", "DTE")
  ],
  Saturday: [
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM VI", "T2", "DTE"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM VI", "R23", "DTE"),
    createClass("Saturday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM VI", "R23", "DTE")
  ]
};
var schedulePB = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R25", "TRIX"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "R24", "TRIX")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R24", "TRIX"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lab", "A3-SEM IV", "R29-A3", "TRIX"),
    createClass("Tuesday", "11:30 AM", "12:30 AM", "Lab", "A3-SEM IV", "R29-A3", "TRIX")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R24", "TRIX"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lab", "Joint-SEM IV", "R29-Joint", "TRIX")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "R24", "TRIX"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lab", "Joint-SEM IV", "R29-Joint", "TRIX"),
    createClass("Thursday", "11:30 AM", "12:30 AM", "Lab", "Joint-SEM IV", "R29-Joint", "TRIX")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM IV", "R24", "TRIX"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lab", "B3-SEM IV", "R29-B3", "TRIX")
  ]
};
var scheduleENN = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VI", "R25", "DTE"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VI", "R24", "DTE"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "D2-SEM VI", "T17", "RM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM VI", "R25", "DTE"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM VI", "T23", "DTE"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM VI", "T23", "DTE")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VI", "R25", "DTE"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "D1-SEM VI", "T23", "RM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM VI", "T23", "DTE")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM VI", "R25", "DTE"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM VI", "T23", "DTE")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VI", "R25", "DTE"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM VI", "T23", "DTE"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM VI", "T23", "DTE")
  ]
};
var scheduleAKJ = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM IV", "R7", "MICRO"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "R24", "MICRO"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM IV", "T3", "MICRO")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM IV", "R7", "MICRO"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "B3-SEM VI", "T3", "IT"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "D3-SEM IV", "T3", "MICRO")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM IV", "R24", "MICRO"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "C1-SEM IV", "T3", "MICRO"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "D1-SEM IV", "T3", "MICRO")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM IV", "R7", "MICRO"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "B2-SEM VI", "T3", "IT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "D2-SEM IV", "T3", "MICRO")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM IV", "R24", "MICRO"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "C2-SEM IV", "T3", "MACRO")
  ]
};
var scheduleRB = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "I2-SEM II", "T41", "PME I"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM II", "R8", "PME I"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "B2-SEM II", "T3", "PME I")
  ],
  Wednesday: [
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "E3-SEM II", "T33", "PME I"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM II", "R7", "PME I"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM II", "R32", "PME I")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "G3-SEM II", "T4", "PME I"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "K1-SEM II", "T18", "PME I"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM II", "R15", "PME I")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "J1-SEM II", "T24", "PME I"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-I-SEM II", "R22", "PME I")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM II", "R10", "PME I")
  ]
};
var scheduleRAK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VIII", "R26", "CED"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "A1-SEM VIII", "T51", "EDPI")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VIII", "R24", "EDPI"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM VI", "R27", "CED"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "CED2-SEM VIII", "T51", "CED")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM VI", "R25", "CED"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VIII", "R26", "EDPI"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "CED1-SEM VIII", "T51", "CED")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VIII", "R25", "CED"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VIII", "R26", "EDPI"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM VI", "T51", "CED")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM VI", "R25", "CED"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VIII", "R21", "CED"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM VI", "T51", "CED")
  ]
};
var scheduleNG = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "PB4", "INTERMME"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "B1-SEM II", "T16", "INTERMME"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "D2-SEM II", "T16", "INTERMME")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM II", "R7", "INTERMME"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM II", "T16", "INTERMME"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "C3-SEM II", "T16", "INTERMME")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "R7", "INTERMME"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "B2-SEM II", "T16", "INTERMME"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "A2-SEM II", "T16", "INTERMME"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "C2-SEM II", "T16", "INTERMME")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM II", "R18", "INTERMME"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM II", "T3", "INTERMME"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "C1-SEM II", "T16", "INTERMME")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Tutorial", "B3-SEM II", "T16", "INTERMME"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM II", "R26", "INTERMME"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM II", "R26", "INTERMME")
  ]
};
var scheduleRK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "SCR4", "PMEI")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-G-SEM VI", "R20", "IECO"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "IECO1-SEM VI", "T53", "IECO"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "IECO2-SEM VI", "T50", "IECO"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "PB3", "IECO"),
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Tutorial", "IECO4-SEM VI", "T51", "IECO")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-G-SEM VI", "SCR4", "IECO"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "IECO3-SEM VI", "T51", "IECO"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "R6", "IECO")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "L2-SEM IV", "T51", "IECO"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "L3-SEM IV", "T48", "IECO"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "L1-SEM IV", "T51", "IECO"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-L-SEM IV", "PB3", "IECO")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-L-SEM IV", "R21", "IECO"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-L-SEM IV", "R21", "IECO"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-G-SEM VI", "R2", "IECO")
  ]
};
var scheduleRHT = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM II", "R23", "ISE"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM II", "R26", "ISE"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "B2-SEM II", "T54", "ISE")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R23", "ISE"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R7", "ISE"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM II", "T53", "ISE"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM II", "T16", "ISE")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R26", "ISE"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM II", "R37", "ISE")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM II", "R23", "ISE"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM II", "R37", "ISE"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "B3-SEM II", "T54", "ISE")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R23", "ISE"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "C1-SEM II", "T54", "ISE"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "D1-SEM II", "T54", "ISE"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "C2-SEM II", "T54", "ISE")
  ]
};
var scheduleKD = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "R26", "IGD"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "D1-SEM VI", "T16", "IGD")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "R7", "IGD"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A1-SEM VI", "T2", "IGD"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM VI", "T2", "IGD"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM VI", "T3", "IGD")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "R26", "IGD"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "B3-SEM VI", "T2", "IGD"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM VI", "T15", "IGD"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM VI", "T2", "IGD")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "R26", "IGD"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "C1-SEM VI", "T16", "IGD"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "C3-SEM VI", "T16", "IGD")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "R26", "IGD"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM VI", "R5", "IGD"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM VI", "T16", "IGD")
  ]
};
var scheduleYAA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM II", "PB4", "PME I"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "A1-SEM II", "T54", "PME I"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM II", "PB2", "PME I")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM II", "R25", "PME I"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM II", "T54", "PME I"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM II", "PB2", "PME I"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-B-SEM II", "R1", "PME I")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM II", "PB4", "PME I"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A3-SEM II", "T54", "PME I"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-L-SEM II", "PB2", "PME I")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R5", "PME I"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "F3-SEM II", "T54", "PME I"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "L2-SEM II", "PB2", "PME I")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM II", "R28", "PME I"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "I1-SEM II", "T45", "PME I"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "H3-SEM II", "T45", "PME I")
  ]
};
var scheduleCG = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "C2-SEM IV", "T16", "MFM"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VI", "R24", "MFM"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "MFM1-SEM VIII", "T16", "MFM")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "C1-SEM VI", "T16", "MFM"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM IV", "R26", "MFM"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VI", "R25", "MFM"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "C3-SEM IV", "T16", "MFM")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "D3-SEM VI", "T16", "MFM"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "Joint-SEM VI", "R7", "MFM"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VI", "R24", "MFM"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "A3-SEM VI", "T17", "MFM")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM IV", "T4", "MFM"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VI", "R23", "MFM"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM IV", "R26", "MFM")
  ],
  Saturday: [
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VI", "R25", "MFM"),
    createClass("Saturday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM IV", "R24", "MFM")
  ]
};
var scheduleJK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM IV", "PB4", "MACRO"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM IV", "T23", "MACRO"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "A1-SEM IV", "T30", "MACRO"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "H1-SEM II", "T2", "PME I")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "C2-SEM IV", "T6", "MACRO"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "R23", "MACRO"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "E1-SEM II", "T53", "PME I")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "C3-SEM IV", "T6", "MACRO"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM IV", "R26", "MACRO"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "A3-SEM IV", "T53", "MACRO"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "C3-SEM II", "T23", "PME I")
  ],
  Friday: [
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM IV", "R23", "MACRO"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "A2-SEM IV", "T6", "MACRO")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM IV", "PB4", "MACRO"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM IV", "R25", "MACRO"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Tutorial", "B1-SEM IV", "T6", "MACRO")
  ]
};
var scheduleAK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R37", "INTROMACRO"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "D3-SEM II", "T30", "INTROMACRO")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM II", "R37", "INTROMACRO"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Tutorial", "C1-SEM II", "T30", "INTROMACRO"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "F1-SEM II", "T26", "PME I"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "G1-SEM II", "T30", "PME I")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R8", "INTROMACRO"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "D1-SEM II", "T30", "INTROMACRO"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "C2-SEM II", "T30", "INTROMACRO"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "C1-SEM II", "T30", "PME I")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM II", "R37", "INTROMACRO"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "D2-SEM II", "T31", "INTROMACRO"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Tutorial", "B1-SEM II", "T30", "PME I")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM II", "R26", "INTROMACRO"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM II", "PB4", "INTROMACRO"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Tutorial", "C3-SEM II", "T30", "INTROMACRO")
  ]
};
var scheduleAG = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VI", "PB4", "IT"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "B1-SEM VI", "T2", "IT")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "R23", "IT"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM VI", "T51", "IT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "R37", "IT"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "C3-SEM VI", "T51", "IT")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-C-SEM VI", "R24", "IT"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "C1-SEM VI", "T51", "IT"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-A-SEM VI", "R37", "IT")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "PB4", "IT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM VI", "PB4", "IT"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A3-SEM VI", "T25", "IT"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "C2-SEM VI", "T53", "IT")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-B-SEM VI", "R23", "IT"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-C-SEM VI", "R37", "IT"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM VI", "T51", "IT")
  ]
};
var scheduleAGD = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM II", "R26", "INTROMACRO"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM II", "R26", "INTROMACRO"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "A3-SEM II", "T3", "INTROMACRO"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Tutorial", "H2-SEM II", "T1", "PME I")
  ],
  Wednesday: [
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "PB4", "INTROMACRO"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Tutorial", "A1-SEM II", "T17", "INTROMACRO"),
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM II", "T17", "INTROMACRO"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Tutorial", "C2-SEM II", "T24", "PME I")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM II", "PB4", "INTROMACRO"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "B1-SEM II", "T30", "INTROMACRO"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "D2-SEM II", "T17", "PME I"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "B3-SEM II", "T3", "PME I")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-B-SEM II", "R26", "INTROMACRO"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "A2-SEM II", "T30", "INTROMACRO"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM II", "T17", "INTROMACRO")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-A-SEM II", "R23", "INTROMACRO")
  ]
};
var scheduleABK = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM VI", "R32", "IT"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "B2-SEM VI", "T30", "BE")
  ],
  Wednesday: [
    createClass("Wednesday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VIII", "R20", "BE"),
    createClass("Wednesday", "9:30 AM", "10:30 AM", "Tutorial", "D1-SEM VI", "T53", "IT"),
    createClass("Wednesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VI", "PB4", "BE")
  ],
  Thursday: [
    createClass("Thursday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM VI", "PB4", "IT"),
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "B1-SEM VI", "T53", "BE"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VI", "PB4", "BE"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM VI", "T54", "BE")
  ],
  Friday: [
    createClass("Friday", "8:30 AM", "9:30 AM", "Lecture", "BCH-D-SEM VI", "R37", "IT"),
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "D2-SEM VI", "T53", "IT"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Tutorial", "BEHV1-SEM VIII", "T53", "BE"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "BCH-A-SEM VIII", "PB2", "BE")
  ],
  Saturday: [
    createClass("Saturday", "8:30 AM", "9:30 AM", "Lecture", "BCH-A-SEM VIII", "R24", "BE"),
    createClass("Saturday", "9:30 AM", "10:30 AM", "Tutorial", "D3-SEM VI", "T53", "IT"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM VI", "R29", "BE")
  ]
};
var scheduleHA = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "8:30 AM", "9:30 AM", "Tutorial", "BEE1-SEM VI", "T16", "BEE"),
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "Joint-SEM VIII", "R6", "BEE"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "BEE2-SEM VIII", "T14", "BEE"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Tutorial", "BEE2-SEM VI", "T23", "BEE"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Tutorial", "BEE3-SEM VIII", "T14", "BEE")
  ],
  Tuesday: [
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM II", "R3", "PMEI"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "R16", "BEE"),
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "Joint-SEM VIII", "R2", "BEE")
  ],
  Wednesday: [
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Lecture", "BCH-J-SEM II", "R32", "PMEI"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "R16", "BEE")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "BEE1-SEM VIII", "T48", "BEE"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "K3-SEM II", "T36", "PMEI"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "PB3", "BEE")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VIII", "R4", "BEE"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-J-SEM II", "R34", "PMEII"),
    createClass("Friday", "2:00 PM", "3:00 PM", "Tutorial", "BEE3-SEM VI", "T16", "BEE")
  ]
};
var scheduleSHS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Tutorial", "A3-SEM VIII", "T2", "EDPI"),
    createClass("Monday", "10:30 AM", "11:30 AM", "Tutorial", "J2-SEM II", "T1", "PMEI"),
    createClass("Monday", "11:30 AM", "12:30 PM", "Lecture", "Joint-SEM VIII", "R6", "SIIE"),
    createClass("Monday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VIII", "R6", "SIIE")
  ],
  Tuesday: [
    createClass("Tuesday", "8:30 AM", "9:30 AM", "Tutorial", "SIIE1-SEM VI", "T4", "SIIE"),
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "A2-SEM VIII", "T4", "EDPI"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "F2-SEM II", "T2", "PMEI"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "R3", "SIIE")
  ],
  Wednesday: [
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "K2-SEM II", "T1", "PMEI"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "R3", "SIIE")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "SIIE2-SEM VI", "T1", "SIIE"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Tutorial", "D3-SEM II", "T14", "PMEI"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "R3", "SIIE")
  ],
  Friday: [
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "I3-SEM II", "T14", "PMEI"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VIII", "R4", "SIIE"),
    createClass("Friday", "2:00 PM", "3:00 PM", "Tutorial", "SIIE3-SEM VI", "T4", "SIIE")
  ]
};
var scheduleKK = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R7", "MACRO")
  ],
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "D1-SEM IV", "T14", "MACRO"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R23", "MACRO"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "B3-SEM IV", "T37", "MACRO"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "SCR2", "PMEII")
  ],
  Thursday: [
    createClass("Thursday", "9:30 AM", "10:30 AM", "Tutorial", "D3-SEM IV", "T23", "MACRO"),
    createClass("Thursday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R23", "MACRO"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "SCR2", "PMEII"),
    createClass("Thursday", "2:00 PM", "3:00 PM", "Tutorial", "PME1-SEM VI", "T23", "PMEII")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R7", "MACRO"),
    createClass("Friday", "11:30 AM", "12:30 PM", "Tutorial", "D2-SEM IV", "T3", "MACRO"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "Joint-SEM VI", "SCR2", "PMEII"),
    createClass("Friday", "2:00 PM", "3:00 PM", "Tutorial", "PME2-SEM VI", "T23", "PMEII")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-D-SEM IV", "R7", "MACRO"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-B-SEM IV", "R24", "MACRO"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Tutorial", "B2-SEM IV", "T16", "MACRO")
  ]
};
var scheduleAKS = {
  ...EMPTY_SCHEDULE,
  Monday: [
    createClass("Monday", "11:30 AM", "1:30 PM", "Lab", "VAC16-SEM II", "R35", "VM I"),
    createClass("Monday", "2:00 PM", "4:00 PM", "Lab", "SEC14-SEM VI", "R29", "LTB"),
    createClass("Monday", "4:00 PM", "6:00 PM", "Lab", "VAC15-SEM II", "R19", "VM I")
  ],
  Tuesday: [
    createClass("Tuesday", "2:00 PM", "3:00 PM", "Lecture", "VAC15-SEM II", "R31", "VM I"),
    createClass("Wednesday", "4:00 PM", "6:00 PM", "Lab", "SEC13-SEM VI", "R29", "LTB")
  ],
  Wednesday: [
    createClass("Wednesday", "2:00 PM", "3:00 PM", "Lecture", "Joint-SEM VIII", "R14", "EPDE"),
    createClass("Wednesday", "3:00 PM", "4:00 PM", "Tutorial", "Joint-SEM VIII", "T18", "EPDE")
  ],
  Thursday: [
    createClass("Thursday", "2:00 PM", "3:00 PM", "Lecture", "VAC16-SEM II", "R7", "VM I"),
    createClass("Thursday", "3:00 PM", "5:00 PM", "Lab", "VAC18-SEM II", "R7", "VM I")
  ],
  Friday: [
    createClass("Friday", "2:00 PM", "4:00 PM", "Lecture", "Joint-SEM VIII", "R14", "EPDE")
  ],
  Saturday: []
};
var scheduleMG = {
  ...EMPTY_SCHEDULE,
  Tuesday: [
    createClass("Tuesday", "9:30 AM", "10:30 AM", "Tutorial", "M2-SEM II", "T23", "IECO"),
    createClass("Tuesday", "10:30 AM", "11:30 AM", "Lecture", "BCH-C-SEM VI", "PB4", "IGD"),
    createClass("Tuesday", "11:30 AM", "12:30 PM", "Tutorial", "D3-SEM VI", "T54", "IGD"),
    createClass("Tuesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-M-SEM II", "R21", "IECO")
  ],
  Wednesday: [
    createClass("Wednesday", "11:30 AM", "12:30 PM", "Tutorial", "SIIE1-SEM VIII", "T35", "SIIE"),
    createClass("Wednesday", "12:30 PM", "1:30 PM", "Lecture", "BCH-M-SEM II", "R21", "IECO")
  ],
  Thursday: [
    createClass("Thursday", "10:30 AM", "11:30 AM", "Tutorial", "SIIE2-SEM VIII", "T29", "BEE"),
    createClass("Thursday", "11:30 AM", "12:30 PM", "Lecture", "BCH-D-SEM VI", "R26", "IGD"),
    createClass("Thursday", "12:30 PM", "1:30 PM", "Tutorial", "M3-SEM II", "T54", "IECO")
  ],
  Friday: [
    createClass("Friday", "9:30 AM", "10:30 AM", "Tutorial", "M1-SEM II", "T49", "IECO"),
    createClass("Friday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM VI", "PB4", "IGD"),
    createClass("Friday", "12:30 PM", "1:30 PM", "Lecture", "BCH-C-SEM VI", "R24", "IGD")
  ],
  Saturday: [
    createClass("Saturday", "9:30 AM", "10:30 AM", "Lecture", "BCH-M-SEM II", "R24", "IECO"),
    createClass("Saturday", "10:30 AM", "11:30 AM", "Lecture", "BCH-D-SEM VI", "R23", "IGD"),
    createClass("Saturday", "11:30 AM", "12:30 PM", "Lecture", "BCH-C-SEM VI", "R24", "IGD"),
    createClass("Saturday", "12:30 PM", "1:30 PM", "Tutorial", "D2-SEM VI", "T54", "IGD")
  ]
};
var TEACHERS = {
  "SIS": { id: "SIS", name: "Ms. Smita Sharma", department: "Corporate Laws", schedule: scheduleSIS },
  "DPE": { id: "DPE", name: "Prof. Deepashree", department: "International Business & VAC", schedule: scheduleDPE },
  "RNC": { id: "RNC", name: "Dr. Reena Chadha", department: "Event Mgmt & Company Law", schedule: scheduleRNC },
  "SLG": { id: "SLG", name: "Dr. Sneh Lata Gupta", department: "Cost Accounting & Mgmt", schedule: scheduleSLG },
  "RUA": { id: "RUA", name: "Ms. Renu Agarwal", department: "HRM & Company Law", schedule: scheduleRUA },
  "AMS": { id: "AMS", name: "Dr. Amit Sachdeva", department: "Commerce Department", schedule: scheduleAMS },
  "RAJ": { id: "RAJ", name: "Prof. Rachna Jawa", department: "Commerce Department", schedule: scheduleRAJ },
  "AAJ": { id: "AAJ", name: "Prof. Aruna Jha", department: "Corporate Governance & Fin Mgmt", schedule: scheduleAAJ },
  "SSS": { id: "SSS", name: "Ms. Santosh Sabharwal", department: "Commerce Department", schedule: scheduleSSS },
  "MAK": { id: "MAK", name: "Prof. Mallika Kumar", department: "Commerce Department", schedule: scheduleMAK },
  "SNK": { id: "SNK", name: "Dr. Santosh Kumar", department: "Commerce Department", schedule: scheduleSNK },
  "AYJ": { id: "AYJ", name: "Prof. Abhay Jain", department: "Commerce Department", schedule: scheduleAYJ },
  "SHK": { id: "SHK", name: "Prof. Santosh Kumari", department: "Commerce Department", schedule: scheduleSHK },
  "PRD": { id: "PRD", name: "Prof. Padmeshwar Doley", department: "Commerce Department", schedule: schedulePRD },
  "HNT": { id: "HNT", name: "Prof. Harendra Nath Tiwari", department: "Commerce Department", schedule: scheduleHNT },
  "TNM": { id: "TNM", name: "Prof. Tarun Manjhi", department: "Commerce Department", schedule: scheduleTNM },
  "SAP": { id: "SAP", name: "Prof. Surya Prakash", department: "Consumer Behaviour & Advertising", schedule: scheduleSAP },
  "NNM": { id: "NNM", name: "Prof. Naveen Mittal", department: "GST & Corporate Tax", schedule: scheduleNNM },
  "KIJ": { id: "KIJ", name: "Prof. Kinneri Jain", department: "Commerce Department", schedule: scheduleKIJ },
  "VAJ": { id: "VAJ", name: "Prof. Vandana Jain", department: "Commerce Department", schedule: scheduleVAJ },
  "KRA": { id: "KRA", name: "Ms. Karuna", department: "Commerce Department", schedule: scheduleKRA },
  "MAB": { id: "MAB", name: "Dr. Monika Bansal", department: "Commerce Department", schedule: scheduleMAB },
  "ANK": { id: "ANK", name: "Dr. Amanpreet Kaur", department: "Sustainability Marketing & HRM", schedule: scheduleANK },
  "AOK": { id: "AOK", name: "Dr. Alok Kumar", department: "Commerce Department", schedule: scheduleAOK },
  "ASA": { id: "ASA", name: "Dr. Anisha", department: "Commerce Department", schedule: scheduleASA },
  "RKS": { id: "RKS", name: "Dr. Raj Kumar Sah", department: "Commerce Department", schedule: scheduleRKS },
  "SIA": { id: "SIA", name: "Dr. Shalini Aggarwal", department: "Commerce Department", schedule: scheduleSIA },
  "BLK": { id: "BLK", name: "Mr. Bal Kishan", department: "Commerce Department", schedule: scheduleBLK },
  "SUY": { id: "SUY", name: "Mr. Sudhanshu Yadav", department: "Commerce Department", schedule: scheduleSUY },
  "HHK": { id: "HHK", name: "Mr. Harish Kumar", department: "Commerce Department", schedule: scheduleHHK },
  "MTS": { id: "MTS", name: "Ms. Manpreet Sharma", department: "Business Statistics & HRM", schedule: scheduleMTS },
  "PNM": { id: "PNM", name: "Ms. Poonam", department: "Commerce Department", schedule: schedulePNM },
  "PAA": { id: "PAA", name: "Dr. Priyanka Aggarwal", department: "Commerce Department", schedule: schedulePAA },
  "MDH": { id: "MDH", name: "Mr. Mohd. Hassan", department: "International Business & Company Law", schedule: scheduleMDH },
  "VAK": { id: "VAK", name: "Ms. Vartika Khandelwal", department: "Commerce Department", schedule: scheduleVAK },
  "JDP": { id: "JDP", name: "Dr. Jaideep", department: "Commerce Department", schedule: scheduleJDP },
  "AAR": { id: "AAR", name: "Dr. Asha Rani", department: "GST & Business Stats", schedule: scheduleAAR },
  "JTW": { id: "JTW", name: "Dr. Jigmet Wangdus", department: "Corp. Governance & Intl. Business", schedule: scheduleJTW },
  "YAM": { id: "YAM", name: "Dr. Yusra Naseem", department: "Commerce Department", schedule: scheduleYAM },
  "AUV": { id: "AUV", name: "Ms. Anju Verma", department: "Commerce Department", schedule: scheduleAUV },
  "SVP": { id: "SVP", name: "Dr. Shashank Vikram Pratap Singh", department: "Intl. Business & HRM", schedule: scheduleSVP },
  "DAB": { id: "DAB", name: "Dr. Dipika Bansal", department: "Commerce Department", schedule: scheduleDAB },
  "PRA": { id: "PRA", name: "Dr. Prerana", department: "Commerce Department", schedule: schedulePRA },
  "SHG": { id: "SHG", name: "Dr. Saurabh Gupta", department: "Commerce Department", schedule: scheduleSHG },
  "SAA": { id: "SAA", name: "Dr. Saumya Aggarwal", department: "Business Analytics", schedule: scheduleSAA },
  "ATS": { id: "ATS", name: "Dr. Amarjeet Singh", department: "Commerce Department", schedule: scheduleATS },
  "STS": { id: "STS", name: "Mr. Satnam Singh", department: "Commerce Department", schedule: scheduleSTS },
  "SJJ": { id: "SJJ", name: "Dr. Saroj Joshi", department: "Commerce Department", schedule: scheduleSJJ },
  "AJJ": { id: "AJJ", name: "Dr. Anuj Jatav", department: "EXIM & Corp. Governance", schedule: scheduleAJJ },
  "DTY": { id: "DTY", name: "Dr. Dixit Yadav", department: "Commerce Department", schedule: scheduleDTY },
  "AAT": { id: "AAT", name: "Ms. Ankita Tomar", department: "Commerce Department", schedule: scheduleAAT },
  "VIC": { id: "VIC", name: "Ms. Vaishali Chhokar", department: "Commerce Department", schedule: scheduleVIC },
  "ATK": { id: "ATK", name: "Dr. Amit Kumar", department: "Business Stats & GST", schedule: scheduleATK },
  "SNS": { id: "SNS", name: "Dr. Suman Si", department: "Commerce Department", schedule: scheduleSNS },
  "GVR": { id: "GVR", name: "Mr. Gaurav Rana", department: "Commerce Department", schedule: scheduleGVR },
  "PKK": { id: "PKK", name: "Dr. Palak Kanojia", department: "Commerce Department", schedule: schedulePKK },
  "AAA": { id: "AAA", name: "Dr. Anuradha Aggarwal", department: "Commerce Department", schedule: scheduleAAA },
  "RAC": { id: "RAC", name: "Dr. Ruchika Choudhary", department: "Commerce Department", schedule: scheduleRAC },
  "RAS": { id: "RAS", name: "Dr. Rutika Saini", department: "Corp. Governance & Business Ethics", schedule: scheduleRAS },
  "KKS": { id: "KKS", name: "Dr. Kamaldeep Kaur Sarna", department: "Commerce Department", schedule: scheduleKKS },
  "PAC": { id: "PAC", name: "Dr. Priya Chaurasia", department: "Commerce Department", schedule: schedulePAC },
  "AVB": { id: "AVB", name: "Mr. Anuj Vijay Bhatia", department: "Corp. Governance & Finance", schedule: scheduleAVB },
  "CUS": { id: "CUS", name: "Dr. Charu Shri", department: "Commerce Department", schedule: scheduleCUS },
  "NJA": { id: "NJA", name: "Dr. Nikunj Aggarwal", department: "Commerce Department", schedule: scheduleNJA },
  "AKY": { id: "AKY", name: "Mr. Abhishek Kumar Yadav", department: "Commerce Department", schedule: scheduleAKY },
  "ALK": { id: "ALK", name: "Mr. Anil Kumar", department: "Commerce Department", schedule: scheduleALK },
  "SIM": { id: "SIM", name: "Dr. Shruti Mallik", department: "Commerce Department", schedule: scheduleSIM },
  "SAG": { id: "SAG", name: "Dr. Shikha Gupta", department: "Commerce Department", schedule: scheduleSAG },
  "AAG": { id: "AAG", name: "Ms. Anubha Godara", department: "Advertising & Business Analytics", schedule: scheduleAAG },
  "LKB": { id: "LKB", name: "Ms. Latika Bajetha", department: "Commerce Department", schedule: scheduleLKB },
  "SAR": { id: "SAR", name: "Dr. Shikha Rajput", department: "Commerce Department", schedule: scheduleSAR },
  "VIS": { id: "VIS", name: "Mr. Vikki Sharma", department: "Commerce Department", schedule: scheduleVIS },
  "NAD": { id: "NAD", name: "Dr. Nisha Devi", department: "Commerce Department", schedule: scheduleNAD },
  "KNK": { id: "KNK", name: "Mr. Krishan Kant", department: "Commerce Department", schedule: scheduleKNK },
  "SPB": { id: "SPB", name: "Dr. Sapna Bansal", department: "Commerce Department", schedule: scheduleSPB },
  "SVK": { id: "SVK", name: "Dr. Shivangi Kaushik", department: "Commerce Department", schedule: scheduleSVK },
  "RJ": { id: "RJ", name: "Dr. Rajiv Jha", department: "Commerce Department", schedule: scheduleRJ },
  "RUR": { id: "RUR", name: "Prof. Ritu Ranjan", department: "Commerce Department", schedule: scheduleRUR },
  "PB": { id: "PB", name: "Ms. Priyanka Bhatia", department: "Intro Econometrics", schedule: schedulePB },
  "ENN": { id: "ENN", name: "Dr. Esther Ngaihte", department: "Commerce Department", schedule: scheduleENN },
  "AKJ": { id: "AKJ", name: "Dr. Avinash Kumar Jha", department: "Commerce Department", schedule: scheduleAKJ },
  "RB": { id: "RB", name: "Dr. Renu Bansal", department: "Commerce Department", schedule: scheduleRB },
  "RAK": { id: "RAK", name: "Dr. Rakesh Ranjan", department: "Commerce Department", schedule: scheduleRAK },
  "NG": { id: "NG", name: "Ms. Nidhi Gupta", department: "Commerce Department", schedule: scheduleNG },
  "RK": { id: "RK", name: "Dr. Ravi Kant", department: "Commerce Department", schedule: scheduleRK },
  "RHT": { id: "RHT", name: "Mr. Rohit", department: "Commerce Department", schedule: scheduleRHT },
  "KD": { id: "KD", name: "Dr. Kapil Dev Yadav", department: "Commerce Department", schedule: scheduleKD },
  "YAA": { id: "YAA", name: "Ms. Yuthika Agarwal", department: "Commerce Department", schedule: scheduleYAA },
  "CG": { id: "CG", name: "Ms. Chhavi Gautam", department: "Commerce Department", schedule: scheduleCG },
  "JK": { id: "JK", name: "Mr. Jagadish Konthoujam", department: "Commerce Department", schedule: scheduleJK },
  "AK": { id: "AK", name: "Mr. Ashwani Kumar", department: "Intro Macroeconomics", schedule: scheduleAK },
  "AG": { id: "AG", name: "Dr. Amit Girdharwal", department: "Commerce Department", schedule: scheduleAG },
  "AGD": { id: "AGD", name: "Ms. Anuradha Gulati Dasgupta", department: "Commerce Department", schedule: scheduleAGD },
  "ABK": { id: "ABK", name: "Mr. Abhishek Khadgawat", department: "Commerce Department", schedule: scheduleABK },
  "HA": { id: "HA", name: "Ms. Himanshi Aggarwal", department: "Commerce Department", schedule: scheduleHA },
  "SHS": { id: "SHS", name: "Ms. Shreya Shreedhar", department: "Indian Economy & Macro", schedule: scheduleSHS },
  "KK": { id: "KK", name: "Dr. Kaushal Kishore", department: "Commerce Department", schedule: scheduleKK },
  "MG": { id: "MG", name: "Dr. Monika Gaur", department: "Commerce Department", schedule: scheduleMG },
  "AKS": { id: "AKS", name: "Dr. Avnish Kumar Sharma", department: "Mathematics Department", schedule: scheduleAKS }
};
var onRequestGet3 = /* @__PURE__ */ __name2(async (context) => {
  const { env } = context;
  try {
    let dbTeachers = [];
    let dbSlots = [];
    if (env.DB) {
      try {
        const teacherResult = await env.DB.prepare("SELECT id, name, department FROM teachers").all();
        dbTeachers = teacherResult.results || [];
      } catch (e) {
      }
      try {
        const slotsResult = await env.DB.prepare("SELECT * FROM timetable_slots").all();
        dbSlots = slotsResult.results || [];
      } catch (e) {
      }
    }
    const dbSchedules = {};
    dbSlots.forEach((slot) => {
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
    const staticTeachers = Object.values(TEACHERS).map((t) => ({
      id: t.id,
      name: t.name,
      department: t.department || "Commerce",
      schedule: t.schedule,
      source: "static"
    }));
    const allTeachersMap = /* @__PURE__ */ new Map();
    staticTeachers.forEach((t) => allTeachersMap.set(t.id, t));
    dbTeachers.forEach((t) => {
      allTeachersMap.set(t.id, {
        ...t,
        schedule: dbSchedules[t.id] || { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] },
        source: "database"
      });
    });
    const mergedResults = Array.from(allTeachersMap.values()).sort(
      (a, b) => (a.name || "").localeCompare(b.name || "")
    );
    return new Response(JSON.stringify(mergedResults), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Sync Error: ${error.message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var routes = [
  {
    routePath: "/api/absences/today",
    mountPath: "/api/absences",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/absences/:id",
    mountPath: "/api/absences",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/absences/:id",
    mountPath: "/api/absences",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/add_teacher",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/mark_absent",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/rooms",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/save_rooms",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/save_timetable",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/sync_rooms",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/teachers",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-7483sx/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-7483sx/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.19774882926260917.js.map

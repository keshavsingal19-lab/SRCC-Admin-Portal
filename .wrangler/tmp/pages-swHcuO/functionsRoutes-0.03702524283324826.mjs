import { onRequestGet as __api_absences_today_ts_onRequestGet } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\absences\\today.ts"
import { onRequestDelete as __api_absences__id__ts_onRequestDelete } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\absences\\[id].ts"
import { onRequestPut as __api_absences__id__ts_onRequestPut } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\absences\\[id].ts"
import { onRequestPost as __api_add_teacher_ts_onRequestPost } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\add_teacher.ts"
import { onRequestPost as __api_mark_absent_ts_onRequestPost } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\mark_absent.ts"
import { onRequestGet as __api_rooms_ts_onRequestGet } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\rooms.ts"
import { onRequestPost as __api_save_rooms_ts_onRequestPost } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\save_rooms.ts"
import { onRequestPost as __api_save_timetable_ts_onRequestPost } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\save_timetable.ts"
import { onRequestPost as __api_sync_rooms_ts_onRequestPost } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\sync_rooms.ts"
import { onRequestGet as __api_teachers_ts_onRequestGet } from "C:\\Users\\kesha\\OneDrive\\Desktop\\srcc-parser-api\\TeacherAssist\\Admin\\functions\\api\\teachers.ts"

export const routes = [
    {
      routePath: "/api/absences/today",
      mountPath: "/api/absences",
      method: "GET",
      middlewares: [],
      modules: [__api_absences_today_ts_onRequestGet],
    },
  {
      routePath: "/api/absences/:id",
      mountPath: "/api/absences",
      method: "DELETE",
      middlewares: [],
      modules: [__api_absences__id__ts_onRequestDelete],
    },
  {
      routePath: "/api/absences/:id",
      mountPath: "/api/absences",
      method: "PUT",
      middlewares: [],
      modules: [__api_absences__id__ts_onRequestPut],
    },
  {
      routePath: "/api/add_teacher",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_add_teacher_ts_onRequestPost],
    },
  {
      routePath: "/api/mark_absent",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_mark_absent_ts_onRequestPost],
    },
  {
      routePath: "/api/rooms",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_rooms_ts_onRequestGet],
    },
  {
      routePath: "/api/save_rooms",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_save_rooms_ts_onRequestPost],
    },
  {
      routePath: "/api/save_timetable",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_save_timetable_ts_onRequestPost],
    },
  {
      routePath: "/api/sync_rooms",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_sync_rooms_ts_onRequestPost],
    },
  {
      routePath: "/api/teachers",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_teachers_ts_onRequestGet],
    },
  ]
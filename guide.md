# Educational ERP Ecosystem System Guide

This guide explains the architecture of the SRCC ERP Ecosystem, containing the **Admin**, **Teacher**, and **Student (Timetable)** applications. It details how the distinct repos connect, the webhook broadcast architecture, and the necessary configurations across each repository.

## 1. Architectural Overview

The system consists of three completely decoupled Cloudflare Pages applications. The key principle of this ecosystem is that **apps do not share databases**. They maintain local copies of their required data, and the state is kept in sync via Webhooks.

1. **Admin Application (Source of Truth for Admin Operations)**
   - Hosted separately with its own D1 database (`admin-db`).
   - Handles global operations: faculty registration, global timetable upload, defining campus rooms, and marking teacher absences.
   - **Broadcasting:** When a teacher is marked absent, the Admin app automatically sends secured `POST` HTTP requests (webhooks) to the Student and Teacher apps.

2. **Teacher Application (TeacherAssist)**
   - Hosted separately with its own D1 database (`teacher-db`).
   - Dedicated exclusively to teacher workflows: login via teacher code/password, view schedules, upload resources, manage personal leaves.
   - **Receiving:** Needs to handle `/webhook/absence` to record absences fired by Admin.

3. **Student Application (SRCC Finder/Timetable)**
   - Hosted separately with its own D1 database (`timetable-db`).
   - Dedicated exclusively to student workflows: finding teachers, looking up rooms, searching schedules.
   - **Receiving:** Needs to handle `/webhook/absence` to mark teachers as absent/on-leave dynamically without manual administrative updates directly in the student app.

---

## 2. The Webhook Communication Flow

The key integration point is the **Absence Broadcast Pipeline**.

1. In the **Admin Dashboard**, the administrator marks a teacher absent (e.g., `Dr. Sanjay Jain`, `2026-04-12` to `2026-04-13`).
2. The `POST /api/mark_absent` endpoint on the Admin app saves the record to its local `global_absences` table.
3. The Admin app iterates through each date in the range, and for every individual date, it issues a `POST` request to:
   - `STUDENT_APP_WEBHOOK_URL/webhook/absence`
   - `TEACHER_APP_WEBHOOK_URL/webhook/absence`
4. The payload sent looks like:
   ```json
   {
     "teacherName": "Dr. Sanjay Jain",
     "date": "2026-04-12",
     "adminUser": "admin",
     "timestamp": "2026-04-12T10:44:00.000Z"
   }
   ```
5. The request includes an `Authorization: Bearer <WEBHOOK_SECRET>` header.

---

## 3. Required Changes & Setup for Repositories

For the integration to work seamlessly in production, all three repositories must be properly configured.

### A. Admin Repo (Completed)
- **Status:** Done.
- The broadcaster (`/api/mark_absent.ts`) sends the requests correctly.
- D1 Database schema has the `global_absences` table with `marked_by`.
- **Wrangler Variables (`wrangler.toml`):**
  - `WEBHOOK_SECRET` = (Must share exact value with Teacher and Student)
  - `STUDENT_APP_WEBHOOK_URL` = e.g., `https://student-app.pages.dev`
  - `TEACHER_APP_WEBHOOK_URL` = e.g., `https://teacher-app.pages.dev`

### B. Teacher Repo (Remaining Tasks)
While the webhook receiver (`functions/webhook/absence.js`) has been implemented, please ensure the following:
1. **Webhook Path:** The receiver must be physically located at `functions/webhook/absence.js` (or `.ts`) to match the Admin's configured targets.
2. **Authentication:** The `WEBHOOK_SECRET` must evaluate incoming `Bearer <secret>` accurately against the one stored in `TEACHER_APP_WEBHOOK_URL` env variable. Add `WEBHOOK_SECRET` to `wrangler.toml` in `Teacher/`.
3. **Database Saving Strategy:** Upon intercepting the webhook, insert the data into the teacher's local `teacher_leaves` table using the `teacher_id` instead of plain text names (because teacher app maps leaves to the `teacher_id` code). You must fetch `teacher_id` doing a `SELECT id FROM teachers WHERE name = ?` query.

### C. Student/Timetable Repo (Remaining Tasks)
1. **Webhook Path:** Function located at `functions/webhook/absence.js` (or `.ts`).
2. **Matching Names to IDs:** The student app schema uses IDs (e.g. `sanjay_jain`) instead of display names (`Dr. Sanjay Jain`). Since the Admin app payload sends `teacherName: "Dr. Sanjay Jain"`, your webhook receiver in the Student app must strip standard tags ("Dr.", "Mr.", "Ms.", "Prof.") and format the string to snake_case, lower case logic, so it correctly links the global absence to its local representation.
3. **Secret Checking:** Update `wrangler.toml` in `Timetable/` repository to contain `WEBHOOK_SECRET`.

---

## 4. Production Release Checklist

Before deploying the whole stack to the public:
- [ ] **Generate Secrets:** Produce a strong, randomized cryptographic string. Do NOT use "your-webhook-secret-here" in production.
- [ ] **Sync Secrets:** Feed this precise secret string into the Cloudflare Pages environment variables (`WEBHOOK_SECRET`) inside the Cloudflare Dashboard for *all three* projects.
- [ ] **Sync URLs:** Apply the final production URLs of the Teacher and Student apps to the `TEACHER_APP_WEBHOOK_URL` and `STUDENT_APP_WEBHOOK_URL` variables in the Admin app.
- [ ] **Test Pipeline:** Run a live test! Open the Admin portal on production, mark a teacher arbitrarily absent, and immediately load the Student Finder app for that specific teacher to observe if an "On Leave" notice shows up.

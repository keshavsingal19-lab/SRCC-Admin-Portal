import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3001', 10);

  app.use(express.json());

  // In-memory stores for preview purposes
  const mockAbsences: any[] = [];
  const mockTeachers: any[] = [];

  // Load static teacher data for merging
  let staticTeachers: any[] = [];
  try {
    const teacherDataPath = path.join(process.cwd(), 'functions', 'teacherData.js');
    if (fs.existsSync(teacherDataPath)) {
      // Dynamic import of the teacher data module
      const mod = await import(`file://${teacherDataPath.replace(/\\/g, '/')}`);
      if (mod.TEACHERS) {
        staticTeachers = Object.values(mod.TEACHERS).map((t: any) => ({
          id: t.id,
          name: t.name,
          department: t.department || 'Commerce',
          schedule: t.schedule,
          source: 'static'
        }));
      }
    }
  } catch (err) {
    console.log('[Dev Server] Could not load static teacherData.js — using mock data only');
  }

  // Load static room data for merging
  let staticRooms: any[] = [];
  try {
    const roomDataPath = path.join(process.cwd(), 'src', 'roomData.ts');
    if (fs.existsSync(roomDataPath)) {
      const mod = await import(`file://${roomDataPath.replace(/\\/g, '/')}`);
      if (mod.ROOMS) staticRooms = mod.ROOMS;
    }
  } catch(e) {}
  const mockRooms: any[] = [...staticRooms];

  // ====== ABSENCE APIs ======

  app.post('/api/mark_absent', async (req, res) => {
    const { teacherName, startDate, endDate, adminUser } = req.body;
    
    if (!teacherName || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing teacherName, startDate, or endDate' });
    }

    const markedBy = adminUser || 'admin';
    console.log(`[Preview Mock] Marking ${teacherName} absent from ${startDate} to ${endDate} (by: ${markedBy})`);
    
    mockAbsences.push({
      id: Date.now(),
      teacher_name: teacherName,
      start_date: startDate,
      end_date: endDate,
      marked_by: markedBy,
      created_at: new Date().toISOString()
    });

    // Mock webhook iteration
    const current = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    let dateCount = 0;
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      console.log(`  [Webhook Mock] → Student App: { teacherName: "${teacherName}", date: "${dateStr}", adminUser: "${markedBy}" }`);
      console.log(`  [Webhook Mock] → Teacher App: { teacherName: "${teacherName}", date: "${dateStr}", adminUser: "${markedBy}" }`);
      current.setUTCDate(current.getUTCDate() + 1);
      dateCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    res.json({ success: true, message: 'Absence recorded and broadcasted successfully.', datesNotified: dateCount });
  });

  app.get('/api/absences/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAbsences = mockAbsences.filter(a => today >= a.start_date && today <= a.end_date);
    res.json(todayAbsences);
  });

  app.put('/api/absences/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { teacherName, startDate, endDate } = req.body;
    const index = mockAbsences.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAbsences[index] = { ...mockAbsences[index], teacher_name: teacherName, start_date: startDate, end_date: endDate };
      res.json({ success: true, message: 'Record updated successfully.' });
    } else {
      res.status(404).json({ error: 'Record not found' });
    }
  });

  app.delete('/api/absences/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockAbsences.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAbsences.splice(index, 1);
      res.json({ success: true, message: 'Record deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Record not found' });
    }
  });

  // ====== TEACHER APIs ======

  app.get('/api/teachers', (req, res) => {
    // Merge static + DB teachers
    const allTeachersMap = new Map();
    staticTeachers.forEach(t => allTeachersMap.set(t.id, t));
    mockTeachers.forEach(t => allTeachersMap.set(t.id, { ...t, source: 'database' }));
    const mergedResults = Array.from(allTeachersMap.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    res.json(mergedResults);
  });

  app.post('/api/add_teacher', (req, res) => {
    const { id, name, department, access_code } = req.body;
    if (!id || !name || !access_code) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const normalizedId = id.trim().toUpperCase();
    if (mockTeachers.find(t => t.id === normalizedId)) {
      return res.status(409).json({ success: false, error: 'Teacher Code already exists.' });
    }

    mockTeachers.push({
      id: normalizedId,
      name: name.trim(),
      department: department || 'Commerce',
      access_code: access_code.trim(),
      schedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] }
    });

    console.log(`[Preview Mock] Registered teacher: ${name} (${normalizedId})`);
    res.json({ success: true, message: 'Faculty member registered successfully.' });
  });

  app.get('/api/rooms', (req, res) => {
    // In dev mode, we assume the frontend will fetch this via Vite, but if we need it here, return mockRooms
    res.json(mockRooms);
  });

  // ====== TIMETABLE & ROOM UPLOAD APIs (mock — always return success) ======

  app.post('/api/save_timetable', (req, res) => {
    console.log('[Preview Mock] Timetable upload received — would forward to Hugging Face parser');
    // In dev, we just acknowledge since we don't have the actual Python parser running
    res.json({
      success: true,
      count: 0,
      message: 'Dev mode: Upload acknowledged. In production, this will be forwarded to the AI parser.'
    });
  });

  app.post('/api/save_rooms', (req, res) => {
    console.log('[Preview Mock] Room upload received — would forward to Hugging Face parser');
    res.json({
      success: true,
      total: 0,
      message: 'Dev mode: Upload acknowledged. In production, this will be forwarded to the AI parser.'
    });
  });

  // ====== VITE MIDDLEWARE ======

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Static teachers loaded: ${staticTeachers.length}`);
  });
}

startServer();

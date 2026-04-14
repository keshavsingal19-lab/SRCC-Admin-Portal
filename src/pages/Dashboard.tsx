import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, UserCheck, AlertCircle, CheckCircle2, Printer,
  Clock, Edit2, Trash2, X, Users, UserPlus, Upload, Building2, Search, Filter,
  RefreshCw, Wifi, CheckCheck, ShieldCheck, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { format, nextDay, Day } from 'date-fns';
import Select from 'react-select';
import { DayOfWeek, TIME_SLOTS, RoomData } from '../types';
import { PrintLetterhead } from '../components/PrintLetterhead';

interface AbsenceRecord {
  id: number;
  teacher_name: string;
  start_date: string;
  end_date: string;
  marked_by: string;
  created_at: string;
}

interface TeacherProfile {
  id: string;
  name: string;
  department?: string;
  schedule?: any;
  source?: string;
}

// --- Toast Notification ---
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-[200] px-6 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-3 ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// --- FACULTY REGISTRATION COMPONENT ---
function QuickAddTeacher({ onTeacherAdded, showToast }: { onTeacherAdded: () => void; showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('Commerce');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/add_teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, department: dept, access_code: accessCode })
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        showToast("Faculty registered successfully!", 'success');
        setId(''); setName(''); setAccessCode('');
        onTeacherAdded();
      } else {
        showToast(data.error || "Failed to add teacher", 'error');
      }
    } catch (err) {
      showToast("Network error. Please check your connection.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-srcc-portalNavy" />
        <h2 className="text-lg font-medium text-gray-900">Register New Faculty</h2>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Teacher Code (ID)</label>
            <input
              value={id}
              onChange={e => setId(e.target.value.toUpperCase())}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm"
              placeholder="e.g., SK"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm"
              placeholder="e.g., Dr. Sameer"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Access Code (Login)</label>
            <input
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm"
              placeholder="Unique Secret"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-srcc-portalNavy text-white font-bold py-2.5 rounded-lg hover:bg-srcc-deepNavy transition-all disabled:opacity-50 active:scale-95 text-sm"
            >
              {loading ? "Registering..." : "Add Faculty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- TIMETABLE UPLOADER ---
function TimetableUploader({ teachersList, onSuccess, showToast }: {
  teachersList: TeacherProfile[];
  onSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedTeacherId) {
      showToast("Please select a teacher first!", 'error');
      event.target.value = '';
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacherId', selectedTeacherId);

    try {
      const response = await fetch('/api/save_timetable', {
        method: 'POST',
        body: formData
      });
      const data = await response.json() as { error?: string; count?: number };
      if (!response.ok || data.error) throw new Error(data.error || "Parsing and saving failed.");

      showToast(`Success! Saved ${data.count || 'all'} classes for ${selectedTeacherId}.`, 'success');
      setSelectedTeacherId('');
      if (event.target) event.target.value = '';
      onSuccess();
    } catch (error: any) {
      showToast("System Error: " + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <Upload className="h-5 w-5 text-srcc-portalNavy" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">Timetable Upload</h2>
          <p className="text-xs text-gray-500">One-Click PDF Processing</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Step 1: Select Faculty</label>
          <select
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-srcc-portalNavy text-sm"
            value={selectedTeacherId}
            onChange={e => setSelectedTeacherId(e.target.value)}
          >
            <option value="">-- Choose Registered Faculty --</option>
            {teachersList.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Step 2: Upload Grid PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={loading || !selectedTeacherId}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-srcc-skyBg file:text-srcc-deepNavy cursor-pointer disabled:opacity-50"
          />
        </div>
        {loading && (
          <div className="flex items-center gap-3 text-srcc-portalNavy font-bold animate-pulse py-2 text-sm">
            <div className="w-4 h-4 border-2 border-srcc-portalNavy border-t-transparent rounded-full animate-spin"></div>
            🤖 AI is parsing & storing in D1...
          </div>
        )}
      </div>
    </div>
  );
}

// --- ROOM TIMETABLE UPLOADER ---
function RoomTimetableUploader({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/save_rooms', {
        method: 'POST',
        body: formData
      });
      const data = await response.json() as { error?: string; total?: number };
      if (!response.ok || data.error) throw new Error(data.error || "Parsing failed.");

      showToast(`Success! Processed ${data.total} rooms and updated the database.`, 'success');
      if (event.target) event.target.value = '';
    } catch (error: any) {
      showToast("System Error: " + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-emerald-600" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">Campus Rooms</h2>
          <p className="text-xs text-gray-500">Sync Global Room Availability</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Upload Room Grid PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 cursor-pointer disabled:opacity-50"
          />
        </div>
        {loading && (
          <div className="flex items-center gap-3 text-emerald-600 font-bold animate-pulse py-2 text-sm">
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            🤖 AI is mapping campus rooms...
          </div>
        )}
      </div>
    </div>
  );
}

// --- LIVE ROOM SYNC FROM WEBSITE ---
function RoomSyncFromWebsite({ showToast, onComplete }: { showToast: (msg: string, type: 'success' | 'error') => void; onComplete: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentRoom, setCurrentRoom] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const logRef = React.useRef<HTMLDivElement>(null);

  const startSync = async () => {
    // Rooms to process (copied from backend list for coordination)
    const ALL_ROOM_IDS = [
      "CL1","CL2","CLIB","PB2","PB3","PB4",
      "R1","R2","R3","R4","R5","R6","R7","R8","R10",
      "R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23","R24","R25",
      "R26","R27","R28","R29","R30","R31","R32","R33","R34","R35","R37",
      "SCR1","SCR2","SCR3","SCR4",
      "T1","T2","T3","T4","T5","T6","T7","T8","T9",
      "T11","T12","T13","T14","T15","T16","T17","T18",
      "T23","T24","T25","T26","T27","T29",
      "T31","T32","T33","T34","T35","T36","T37","T38","T39","T40",
      "T41","T42","T43","T44","T45","T46","T48","T49","T50","T51","T53","T54"
    ];

    setSyncing(true);
    setProgress(0);
    setTotal(ALL_ROOM_IDS.length);
    setLogs([]);
    setCompleted(false);
    setCurrentRoom('');

    // Split rooms into batches of 15 to stay under Cloudflare's 50 subrequest limit
    const BATCH_SIZE = 15;
    const batches = [];
    for (let i = 0; i < ALL_ROOM_IDS.length; i += BATCH_SIZE) {
      batches.push(ALL_ROOM_IDS.slice(i, i + BATCH_SIZE));
    }

    let globalProcessed = 0;

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const isFirstBatch = i === 0;
        
        const response = await fetch('/api/sync_rooms', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomIds: batch,
            totalRooms: ALL_ROOM_IDS.length,
            isFirstBatch,
            processedCount: globalProcessed
          })
        });

        if (!response.ok || !response.body) {
          throw new Error(`Batch ${i+1} failed to start.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === 'start') {
                if (isFirstBatch) setLogs(prev => [...prev, `🚀 ${event.message}`]);
              } else if (event.type === 'progress') {
                setProgress(event.processed);
                globalProcessed = event.processed;
                setCurrentRoom(event.room);
                setLogs(prev => [...prev, event.message]);
              } else if (event.type === 'skip') {
                setProgress(event.processed);
                globalProcessed = event.processed;
                setLogs(prev => [...prev, `⏭️ ${event.message}`]);
              } else if (event.type === 'error') {
                setProgress(event.processed);
                globalProcessed = event.processed;
                setLogs(prev => [...prev, event.message]);
              } else if (event.type === 'complete') {
                if (i === batches.length - 1) {
                  setCompleted(true);
                  setLogs(prev => [...prev, `🎉 ${event.message}`]);
                  showToast(event.message, 'success');
                  onComplete();
                } else {
                  setLogs(prev => [...prev, `📦 Batch ${i+1} complete. Starting next...`]);
                }
              } else if (event.type === 'fatal') {
                throw new Error(event.message);
              }
            } catch (e) { /* ignore */ }
          }

          if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
          }
        }
      }
    } catch (err: any) {
      showToast('Sync failed: ' + err.message, 'error');
      setLogs(prev => [...prev, `💀 ${err.message}`]);
    } finally {
      setSyncing(false);
    }
  };

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden col-span-1 lg:col-span-2">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">Live Room Sync</h2>
            <p className="text-xs text-gray-500">Fetch all room timetables from srcccollegetimetable.in</p>
          </div>
        </div>
        {completed && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <CheckCheck className="w-3.5 h-3.5" />
            Sync Complete
          </div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={startSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All Rooms from Website'}
          </button>
          {syncing && (
            <span className="text-sm text-gray-500">
              {currentRoom && <span className="font-bold text-blue-600">{currentRoom}</span>}
              {' '}— {progress}/{total} ({pct}%)
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {(syncing || completed) && total > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Live Log */}
        {logs.length > 0 && (
          <div
            ref={logRef}
            className="bg-gray-900 text-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-0.5"
          >
            {logs.map((line, i) => (
              <div key={i} className="leading-relaxed">{line}</div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-gray-400">
          ⚠️ This will <strong>completely overwrite</strong> all existing room data in the database.
          Rooms skipped: Principal Office, Playground, Seminar Hall.
          Each room is fetched with a 300ms delay to be polite to the server.
        </p>
      </div>
    </div>
  );
}

// --- ADMIN SECURITY SETTINGS ---
function AdminSecurityPanel({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirm) {
      showToast("New passcodes do not match!", 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPasscode: current, newPasscode: newPass, confirmPasscode: confirm })
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        showToast("Passcode updated successfully! You will be logged out.", 'success');
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 1500);
      } else {
        showToast(data.error || "Update failed", 'error');
      }
    } catch (err) {
      showToast("Network error. Could not reach server.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-srcc-skyBg rounded-xl">
              <ShieldCheck className="h-6 w-6 text-srcc-portalNavy" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Security Vault</h2>
              <p className="text-xs text-gray-500 font-medium">Update Admin Portal Passcode</p>
            </div>
          </div>
          <KeyRound className="h-5 w-5 text-gray-300" />
        </div>
        
        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-[1px]">Current Passcode</label>
              <div className="relative group">
                <input
                  type={showCurr ? "text" : "password"}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  className="w-full h-[50px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy focus:bg-white outline-none transition-all text-sm font-medium pr-12 group-hover:border-gray-300"
                  placeholder="Verify your identity"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurr(!showCurr)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-srcc-portalNavy transition-colors"
                >
                  {showCurr ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-[1px]">New Passcode</label>
                <div className="relative group">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full h-[50px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy focus:bg-white outline-none transition-all text-sm font-medium pr-12 group-hover:border-gray-300"
                    placeholder="New secret..."
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNew(!showNew)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-srcc-portalNavy transition-colors"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-[1px]">Double Check</label>
                <input
                  type={showNew ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full h-[50px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy focus:bg-white outline-none transition-all text-sm font-medium group-hover:border-gray-300"
                  placeholder="Repeat passcode"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[55px] bg-srcc-portalNavy text-white font-bold rounded-xl hover:bg-srcc-deepNavy transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-srcc-portalNavy/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <KeyRound size={20} />
                  <span>SECURELY UPDATE CREDENTIALS</span>
                </>
              )}
            </button>
            <p className="mt-6 text-[11px] text-gray-400 text-center leading-relaxed">
              Updating your passcode will terminate all active sessions.<br />
              Default initialization: <span className="text-gray-500 font-bold">SRCC1926</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// === MAIN DASHBOARD ===
export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'absence' | 'faculty' | 'rooms' | 'upload' | 'security'>('absence');

  // --- Temporal Context ---
  const currentDayName = format(new Date(), 'EEEE') as DayOfWeek;
  const currentHour = new Date().getHours();
  const currentMin = new Date().getMinutes();
  const timeInMins = currentHour * 60 + currentMin;

  // Map current time to TIME_SLOTS index
  // Slots: 0:8:30, 1:9:30, 2:10:30, 3:11:30, 4:12:30, 5:14:00, 6:15:00, 7:16:00, 8:17:00
  let currentTimeIndex = 0;
  if (timeInMins >= 1020) currentTimeIndex = 8;      // 5:00 PM onwards
  else if (timeInMins >= 960) currentTimeIndex = 7;   // 4:00 PM
  else if (timeInMins >= 900) currentTimeIndex = 6;   // 3:00 PM
  else if (timeInMins >= 840) currentTimeIndex = 5;   // 2:00 PM
  else if (timeInMins >= 750) currentTimeIndex = 4;   // 12:30 PM
  else if (timeInMins >= 690) currentTimeIndex = 3;   // 11:30 AM
  else if (timeInMins >= 630) currentTimeIndex = 2;   // 10:30 AM
  else if (timeInMins >= 570) currentTimeIndex = 1;   // 09:30 AM
  else currentTimeIndex = 0;                         // 08:30 AM or earlier

  // --- Absence Management States ---
  const [teacherName, setTeacherName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [todayAbsences, setTodayAbsences] = useState<AbsenceRecord[]>([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<AbsenceRecord | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);

  // --- Faculty Management States ---
  const [allTeachers, setAllTeachers] = useState<TeacherProfile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  // --- Room Management States ---
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomFilterType, setRoomFilterType] = useState('All');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDayName);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(currentTimeIndex);

  // Toast state
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => setToast({ message: msg, type });

  // Print Mode State
  const [printMode, setPrintMode] = useState<'absence' | 'rooms' | 'daily' | null>(null);

  useEffect(() => {
    if (printMode) {
      const timer = setTimeout(() => {
        window.print();
        setPrintMode(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printMode]);

  // --- Data Fetching ---
  const fetchTodayAbsences = async () => {
    try {
      const response = await fetch('/api/absences/today');
      if (response.ok) {
        const data = await response.json() as AbsenceRecord[];
        setTodayAbsences(data);
      }
    } catch (error) {
      console.error('Failed to fetch today absences:', error);
    } finally {
      setLoadingAbsences(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) setAllTeachers(data);
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const processedRooms = data
            .filter(r => r.name !== 'CL3')
            .map(r => {
              if (r.type === 'SCR' || r.type === 'Seminar Room' || r.name.includes('SCR')) {
                return { ...r, type: 'Sports Complex' };
              }
              return r;
            });
          setAllRooms(processedRooms);
        }
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleClearAllAbsences = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/absences/clear', { method: 'DELETE' });
      if (response.ok) {
        showToast('All records cleared successfully.', 'success');
        fetchTodayAbsences();
      } else {
        showToast('Failed to clear records.', 'error');
      }
    } catch (error) {
      showToast('Network error during clearance.', 'error');
    } finally {
      setStatus('idle');
      setClearAllModalOpen(false);
    }
  };

  useEffect(() => {
    fetchTodayAbsences();
    fetchTeachers();
    fetchRooms();
    const interval = setInterval(fetchTodayAbsences, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !startDate || !endDate) return;

    if (startDate > endDate) {
      setStatus('error');
      setMessage('End date cannot be before start date.');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    const isAlreadyAbsent = todayAbsences.some(a => a.teacher_name === teacherName);
    if (isAlreadyAbsent) {
      setStatus('error');
      setMessage('This teacher is already marked absent today.');
      setTimeout(() => setStatus('idle'), 5000);
      return;
    }

    setStatus('loading');

    // Find the teacher ID from the front-end state list
    const selectedTeacher = allTeachers.find(t => t.name === teacherName);
    const teacherId = selectedTeacher ? selectedTeacher.id : "N/A";

    try {
      const response = await fetch('/api/mark_absent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teacherId, teacherName, startDate, endDate, adminUser: 'admin' }),
      });

      const data = await response.json() as { message?: string; error?: string };

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Absence recorded successfully.');
        setTeacherName('');
        setEndDate(startDate);
        fetchTodayAbsences();
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to record absence.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error occurred. Please try again.');
    }

    setTimeout(() => setStatus('idle'), 5000);
  };

  const handlePrint = () => { setPrintMode('absence'); };

  // Delete Handlers
  const openDeleteModal = (id: number) => {
    setRecordToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const response = await fetch(`/api/absences/${recordToDelete}`, { method: 'DELETE' });
      if (response.ok) fetchTodayAbsences();
    } catch (error) {
      console.error('Network error during delete:', error);
    } finally {
      setDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  // Edit Handlers
  const openEditModal = (record: AbsenceRecord) => {
    setEditRecord(record);
    setEditTeacherName(record.teacher_name);
    setEditStartDate(record.start_date);
    setEditEndDate(record.end_date);
    setEditModalOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord || !editTeacherName || !editStartDate || !editEndDate) return;
    if (editStartDate > editEndDate) { alert('End date cannot be before start date.'); return; }

    try {
      const response = await fetch(`/api/absences/${editRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherName: editTeacherName,
          startDate: editStartDate,
          endDate: editEndDate
        }),
      });
      if (response.ok) {
        fetchTodayAbsences();
        setEditModalOpen(false);
        setEditRecord(null);
      }
    } catch (error) {
      console.error('Network error during update:', error);
    }
  };

  const todayStr = format(new Date(), 'MMMM d, yyyy');

  const filteredTeachers = allTeachers
    .filter(t =>
      (t.name?.toLowerCase().includes(teacherSearchTerm.toLowerCase())) ||
      (t.id?.toLowerCase().includes(teacherSearchTerm.toLowerCase()))
    )
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const sections = [
    { id: 'absence' as const, label: 'Mark Absences', icon: CalendarIcon },
    { id: 'faculty' as const, label: 'Faculty Directory', icon: Users },
    { id: 'rooms' as const, label: 'Room Finder', icon: Building2 },
    { id: 'upload' as const, label: 'Data Upload', icon: Upload },
    { id: 'security' as const, label: 'Admin Security', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-srcc-pageBg overflow-hidden font-sans print:h-auto print:overflow-visible print:block">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-srcc-portalNavy flex-shrink-0 flex flex-col shadow-2xl z-40 print:hidden">
        {/* Sidebar Header / Logo */}
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <img src="/SRCC.svg" alt="SRCC Logo" className="w-16 h-16 mb-4 filter drop-shadow-lg" />
          <h1 className="text-xl font-serif font-black text-srcc-yellow tracking-[3px]">SRCC</h1>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-[2px] mt-1">Admin Assist</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {sections.map(s => {
            const IsActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all group ${
                  IsActive 
                    ? 'bg-srcc-yellow text-srcc-portalNavy shadow-lg scale-[1.02]' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <s.icon className={`h-5 w-5 ${IsActive ? 'text-srcc-portalNavy' : 'text-srcc-yellow/70 group-hover:text-srcc-yellow'}`} />
                <span className="tracking-tight">{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / Centenary Logo */}
        <div className="p-6 border-t border-white/10 bg-black/10 flex flex-col items-center">
            <img src="/SRCC100.svg" alt="SRCC 100 Logo" className="w-24 opacity-80 hover:opacity-100 transition-opacity mb-2" />
            <button 
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              className="mt-4 text-[11px] font-black text-white/30 hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              Terminate Session
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-srcc-pageBg overflow-hidden relative print:hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-srcc-portalNavy/5 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-srcc-portalNavy" />
            </div>
            <div>
              <h2 className="text-lg font-black text-srcc-portalNavy tracking-tight uppercase">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">SRCC Admin Assist Console • {format(new Date(), 'EEEE, MMMM do')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black text-srcc-portalNavy/40 uppercase tracking-widest">Administrator</span>
                <span className="text-xs font-bold text-gray-700">{localStorage.getItem('adminUser') || 'Session Active'}</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-srcc-yellow flex items-center justify-center border-2 border-white shadow-md">
                <Users className="w-5 h-5 text-srcc-portalNavy" />
             </div>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth print:overflow-visible print:p-0">
          {/* Toast */}
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* === ABSENCE MANAGEMENT SECTION === */}
            {activeSection === 'absence' && (
              <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Form Section */}
                <div className="bg-white shadow-xl shadow-srcc-portalNavy/5 rounded-2xl border border-gray-100 overflow-hidden print:hidden">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                       <CalendarIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Mark Absence</h2>
                      <p className="text-xs text-gray-500 font-medium tracking-tight">Record and broadcast faculty unavailability.</p>
                    </div>
                  </div>

                  <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Faculty Name</label>
                          <Select
                            className="w-full text-sm"
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: '52px',
                                borderRadius: '12px',
                                borderColor: '#E5E7EB',
                                backgroundColor: '#F9FAFB',
                                boxShadow: 'none',
                                '&:hover': { borderColor: '#000066' }
                              })
                            }}
                            placeholder="Search teacher..."
                            options={allTeachers.map(t => ({ value: t.name, label: `${t.name} (${t.id})` }))}
                            value={teacherName ? { value: teacherName, label: teacherName } : null}
                            onChange={(selected) => setTeacherName(selected ? (selected as any).value : '')}
                            isClearable
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Start Date</label>
                          <input
                            type="date"
                            className="w-full h-[52px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm font-medium"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              if (e.target.value > endDate) setEndDate(e.target.value);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-widest">End Date</label>
                          <input
                            type="date"
                            className="w-full h-[52px] px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm font-medium"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={status === 'loading'}
                          className="h-[52px] px-10 bg-srcc-portalNavy text-white font-black text-xs uppercase tracking-[2px] rounded-xl hover:bg-srcc-deepNavy transition-all disabled:opacity-50 shadow-lg"
                        >
                          {status === 'loading' ? 'Processing...' : 'Broadcast Absence'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Registry Table */}
                <div className="bg-white shadow-xl shadow-srcc-portalNavy/5 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-srcc-portalNavy/5 rounded-xl">
                        <Clock className="h-5 w-5 text-srcc-portalNavy" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">Today's Registry <span className="text-gray-400 text-sm font-medium ml-2">({todayAbsences.length})</span></h2>
                    </div>
                    <div className="flex gap-2">
                        {todayAbsences.length > 0 && (
                          <button onClick={() => setClearAllModalOpen(true)} className="h-10 px-4 flex items-center gap-2 border border-red-200 text-xs font-bold rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors mr-2">
                             <Trash2 className="h-3.5 w-3.5" /> Clear All
                          </button>
                        )}
                        <button onClick={handlePrint} className="h-10 px-4 flex items-center gap-2 border border-gray-200 text-xs font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                           <Printer className="h-3.5 w-3.5" /> List
                        </button>
                        <button onClick={() => setPrintMode('daily')} className="h-10 px-6 flex items-center gap-2 bg-srcc-portalNavy text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-srcc-deepNavy shadow-lg transition-all">
                           <Printer className="h-3.5 w-3.5" /> Full Report
                        </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-right w-16">S.No.</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Faculty Name</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {todayAbsences.length === 0 ? (
                          <tr><td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-medium">No active records found.</td></tr>
                        ) : (
                          todayAbsences.map((record, index) => (
                            <tr key={record.id} className="hover:bg-srcc-skyBg/10 transition-colors group">
                              <td className="px-8 py-5 text-sm font-bold text-gray-300 text-right">{index + 1}.</td>
                              <td className="px-8 py-5 text-sm font-black text-srcc-portalNavy">{record.teacher_name}</td>
                              <td className="px-8 py-5 text-xs font-bold text-gray-600">
                                 {format(new Date(record.start_date), 'MMM d')} — {format(new Date(record.end_date), 'MMM d, yyyy')}
                              </td>
                              <td className="px-8 py-5 text-right space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(record)} className="text-gray-300 hover:text-srcc-portalNavy transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => openDeleteModal(record.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* === FACULTY DIRECTORY SECTION === */}
            {activeSection === 'faculty' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <QuickAddTeacher onTeacherAdded={fetchTeachers} showToast={showToast} />

                <div className="bg-white shadow-xl shadow-srcc-portalNavy/5 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-srcc-yellow/10 rounded-xl">
                         <Users className="h-5 w-5 text-srcc-portalNavy" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Faculty Registry</h2>
                        <p className="text-xs text-gray-500 font-medium">{allTeachers.length} members identified.</p>
                      </div>
                    </div>
                    <div className="relative md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by credentials..."
                        value={teacherSearchTerm}
                        onChange={e => setTeacherSearchTerm(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-6">
              {loadingTeachers ? (
                <div className="text-center py-20 text-gray-400 font-medium">Loading faculty database...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTeachers.map(teacher => (
                    <div
                      key={teacher.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-srcc-skyBg hover:shadow-md transition-all cursor-default group"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs bg-srcc-skyBg text-srcc-portalNavy shrink-0">
                        {teacher.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-800 truncate">{teacher.name}</h3>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mt-0.5">
                          {teacher.department || 'General'} • {teacher.source === 'database' ? 'DB' : 'Static'}
                        </p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-srcc-portalNavy transition-colors rounded-md hover:bg-gray-50" title="Edit Faculty">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          className={`p-1.5 transition-colors rounded-md ${teacher.source === 'database' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`} 
                          title={teacher.source === 'database' ? "Delete Faculty" : "Static faculty cannot be deleted"}
                          onClick={() => {
                            if (teacher.source === 'database') {
                              if (confirm(`Are you sure you want to delete ${teacher.name}?`)) {
                                fetch(`/api/teachers/${teacher.id}`, { method: 'DELETE' }).then(() => fetchTeachers());
                              }
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

            {/* === ROOM FINDER SECTION === */}
            {activeSection === 'rooms' && (() => {

               const finalAvailableRooms = allRooms.filter(room => {
                  const typeMatch = roomFilterType === 'All' || room.type === roomFilterType || (room.type + 's' === roomFilterType);
                  const nameMatch = room.name.toLowerCase().includes(roomSearchQuery.toLowerCase());
                  const isAvailable = room.emptySlots?.[selectedDay]?.includes(selectedTimeIndex);
                  
                  // Release logic
                  let isFreed = false;
                  const freeingAbsences = todayAbsences.filter(a => selectedDay === currentDayName);
                  const occupants = room.occupiedBy?.[selectedDay]?.[selectedTimeIndex] || [];
                  if (occupants.length > 0) {
                      const validOccupants = occupants.filter(tid => allTeachers.some(t => t.id === tid));
                      if (validOccupants.length > 0) {
                         const absentOccupants = validOccupants.filter(tid => {
                            const t = allTeachers.find(it => it.id === tid);
                            return t && freeingAbsences.some(a => a.teacher_name === t.name);
                         });
                         if (absentOccupants.length === validOccupants.length) isFreed = true;
                      }
                  }
                  return typeMatch && nameMatch && (isAvailable || isFreed);
               }).map(r => {
                  let isFreed = false;
                  let absentNames: string[] = [];
                  const freeingAbsences = todayAbsences.filter(a => selectedDay === currentDayName);
                  const occupants = r.occupiedBy?.[selectedDay]?.[selectedTimeIndex] || [];
                  if (occupants.length > 0) {
                      const validOccupants = occupants.filter(tid => allTeachers.some(t => t.id === tid));
                      if (validOccupants.length > 0) {
                        const absents = validOccupants.filter(tid => {
                            const t = allTeachers.find(it => it.id === tid);
                            const isAb = t && freeingAbsences.some(a => a.teacher_name === t.name);
                            if (isAb) absentNames.push(t.name);
                            return isAb;
                        });
                        if (absents.length === validOccupants.length) isFreed = true;
                      }
                  }
                  return isFreed ? { ...r, tags: [`Released: ${absentNames.join(', ')}`] } : r;
               });

               return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white shadow-xl shadow-srcc-portalNavy/5 rounded-2xl border border-gray-100 p-8 flex flex-col md:flex-row items-end gap-6 print:hidden">
                    <div className="flex-1 space-y-4">
                       <label className="block text-[11px] font-black text-srcc-portalNavy/40 uppercase tracking-widest">Time Select</label>
                       <div className="grid grid-cols-2 gap-4">
                          <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)} className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm focus:ring-2 focus:ring-srcc-portalNavy outline-none appearance-none cursor-pointer hover:bg-white transition-all">
                            {Object.values(DayOfWeek).map(d => <option key={d}>{d}</option>)}
                          </select>
                          <select value={selectedTimeIndex} onChange={(e) => setSelectedTimeIndex(parseInt(e.target.value))} className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm focus:ring-2 focus:ring-srcc-portalNavy outline-none appearance-none cursor-pointer hover:bg-white transition-all">
                            {TIME_SLOTS.map((slot, i) => <option key={i} value={i}>{slot}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="flex-1 space-y-4">
                       <label className="block text-[11px] font-black text-srcc-portalNavy/40 uppercase tracking-widest">Filters</label>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input type="text" placeholder="Search code..." value={roomSearchQuery} onChange={(e) => setRoomSearchQuery(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-srcc-portalNavy outline-none transition-all text-sm font-medium" />
                          </div>
                          <select value={roomFilterType} onChange={(e) => setRoomFilterType(e.target.value)} className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm focus:ring-2 focus:ring-srcc-portalNavy outline-none appearance-none cursor-pointer hover:bg-white transition-all">
                             <option value="All">All Types</option>
                             <option value="Lecture Hall">Lecture Halls</option>
                             <option value="Tutorial Room">Tutorial Rooms</option>
                             <option value="Computer Lab">Computer Labs</option>
                             <option value="Seminar Room">Seminar Rooms</option>
                          </select>
                       </div>
                    </div>
                    <div>
                        <button onClick={() => setPrintMode('rooms')} className="h-12 px-6 flex items-center gap-2 border border-gray-200 text-xs font-black uppercase tracking-widest rounded-xl text-srcc-portalNavy bg-white hover:bg-srcc-portalNavy hover:text-white transition-all shadow-sm">
                           <Printer className="h-4 w-4" /> Print Matrix
                        </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {finalAvailableRooms.map((room) => {
                      const IsSpecial = room.tags !== undefined;
                      return (
                        <div key={room.id} className={`group relative bg-white rounded-3xl border-2 p-6 flex flex-col items-center justify-center text-center transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-[0.97] ${IsSpecial ? 'border-srcc-yellow/50 ring-4 ring-srcc-yellow/5' : 'border-gray-50'}`}>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-xl font-black transition-all ${IsSpecial ? 'bg-srcc-yellow text-srcc-portalNavy' : 'bg-srcc-portalNavy/5 text-srcc-portalNavy group-hover:bg-srcc-portalNavy group-hover:text-srcc-yellow'}`}>
                            {room.name.replace(/[^0-9]/g, '') || room.name.charAt(0)}
                          </div>
                          <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{room.name}</h3>
                          {IsSpecial ? (
                             <div className="text-[10px] font-black text-srcc-portalNavy bg-srcc-yellow px-2 py-1 rounded-full uppercase tracking-tighter mt-3 shadow-sm">{room.tags[0]}</div>
                          ) : (
                            <div className="text-[10px] font-black text-srcc-portalNavy/40 bg-srcc-portalNavy/5 px-2 py-1 rounded-full mt-3 tracking-widest uppercase">Available</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
               );
            })()}

            {/* === DATA UPLOAD SECTION === */}
            {activeSection === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TimetableUploader teachersList={allTeachers} onSuccess={fetchTeachers} showToast={showToast} />
                <RoomTimetableUploader showToast={showToast} />
                <div className="lg:col-span-2">
                   <RoomSyncFromWebsite showToast={showToast} onComplete={fetchRooms} />
                </div>
              </div>
            )}

            {/* === SECURITY SECTION === */}
            {activeSection === 'security' && (
              <AdminSecurityPanel showToast={showToast} />
            )}

            {/* Global Branding Footer */}
            <footer className="mt-20 pt-12 border-t border-gray-100 text-center pb-12 print:hidden backdrop-blur-sm bg-srcc-pageBg/50">
              <div className="flex items-center justify-center gap-4 mb-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                 <img src="/SRCC.svg" alt="SRCC" className="h-10" />
                 <div className="h-6 w-[1px] bg-gray-300"></div>
                 <img src="/SRCC100.svg" alt="SRCC 100" className="h-12" />
              </div>
              <p className="text-[11px] font-black tracking-[5px] text-srcc-portalNavy/40 uppercase mb-2">SRCC Admin Assist Portal</p>
              <p className="text-[10px] text-gray-400 font-bold tracking-tight">Designed & Developed with Curiosity by <span className="text-srcc-portalNavy/60">Keshav Singal (24BC702)</span></p>
            </footer>
          </div>
      </main>

      {/* Shared Modals */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-srcc-portalNavy/60 backdrop-blur-sm px-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center border-b border-gray-50">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
              <h3 className="text-2xl font-black text-srcc-portalNavy uppercase tracking-tight mb-2 font-serif">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">This action will permanently remove the absence record from all synced platforms.</p>
            </div>
            <div className="flex h-16">
              <button onClick={() => { setDeleteModalOpen(false); setRecordToDelete(null); }} className="flex-1 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 text-sm font-black text-red-600 hover:bg-red-50 transition-colors uppercase tracking-widest border-l border-gray-100">Delete Record</button>
            </div>
          </div>
        </div>
      )}

      {clearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-srcc-portalNavy/60 backdrop-blur-sm px-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center border-b border-gray-50">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
              <h3 className="text-2xl font-black text-srcc-portalNavy uppercase tracking-tight mb-2 font-serif">Clear Today's List?</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">This will remove all teachers currently marked as absent for today. Future or past records will not be affected.</p>
            </div>
            <div className="flex h-16">
              <button onClick={() => setClearAllModalOpen(false)} className="flex-1 text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest">Cancel</button>
              <button onClick={handleClearAllAbsences} className="flex-1 text-sm font-black text-red-600 hover:bg-red-50 transition-colors uppercase tracking-widest border-l border-gray-100">Clear Registry</button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-srcc-portalNavy/60 backdrop-blur-sm px-4 animate-in fade-in duration-300 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-xl font-black text-srcc-portalNavy uppercase tracking-tight font-serif">Modify Record</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-srcc-portalNavy"><X size={20} /></button>
            </div>
            <form onSubmit={submitEdit} className="p-8 space-y-6">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Faculty Name</label>
                  <input type="text" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-srcc-portalNavy outline-none transition-all text-sm font-bold" value={editTeacherName} onChange={(e) => setEditTeacherName(e.target.value)} required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Commencement</label>
                    <input type="date" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-srcc-portalNavy outline-none transition-all text-sm font-bold" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Termination</label>
                    <input type="date" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-srcc-portalNavy outline-none transition-all text-sm font-bold" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} required />
                  </div>
               </div>
               <button type="submit" className="w-full h-[55px] bg-srcc-portalNavy text-white font-black text-xs uppercase tracking-[2px] rounded-xl hover:bg-srcc-deepNavy transition-all shadow-lg active:scale-95">Synchronize Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Global Print Engine Renderers */}
      {(printMode === 'absence' || printMode === 'daily') && (
        <div className="hidden print:block w-full">
          <PrintLetterhead 
            title="DAILY FACULTY ABSENCE REPORT" 
            dateStr={todayStr} 
            records={todayAbsences}
            pageBreakAfter={printMode === 'daily' ? 'always' : 'auto'} 
          />
        </div>
      )}

      {(printMode === 'rooms' || printMode === 'daily') && (() => {
        const currentDayName = format(new Date(), 'EEEE') as DayOfWeek;
        const getFreedSlotsForDay = (targetDay: DayOfWeek) => {
          const map = new Map<number, any[]>();
          TIME_SLOTS.forEach((_, i) => map.set(i, []));
          allRooms.forEach(room => {
            if (!room.occupiedBy || !room.occupiedBy[targetDay]) return;
            const dayOccupancy = room.occupiedBy[targetDay];
            Object.entries(dayOccupancy).forEach(([idxStr, tids]) => {
              const slotIdx = parseInt(idxStr);
              const occupants = tids as string[];
              const validOccupants = occupants.filter(tid => allTeachers.some(t => t.id === tid));
              if (validOccupants.length > 0) {
                const absentOccupants = validOccupants.map(tid => {
                  const teacher = allTeachers.find(t => t.id === tid)!;
                  return todayAbsences.some(a => a.teacher_name === teacher.name) ? teacher.name : null;
                }).filter(Boolean);
                if (absentOccupants.length > 0 && absentOccupants.length === validOccupants.length) map.get(slotIdx)?.push({ ...room });
              }
            });
          });
          return map;
        };
        const printFreedSlotsMap = getFreedSlotsForDay(currentDayName);
        const renderTablePrint = (title: string, slots: number[], pageBreak: 'always' | 'auto') => (
          <PrintLetterhead title={title} dateStr={`${todayStr} | Day: ${currentDayName}`} pageBreakAfter={pageBreak}>
            <table className="print-table w-full mt-1" style={{ fontSize: '11.5px', lineHeight: '1.2' }}>
              <thead><tr><th className="w-20 border border-gray-300 py-1 px-2 text-center font-black">Time</th><th className="w-32 border border-gray-300 py-1 px-2 text-center font-black">Type</th><th className="text-left border border-gray-300 py-1 px-2 font-black">Campus Rooms</th></tr></thead>
              <tbody>
                {slots.map(idx => {
                  const empty = allRooms.filter(r => r.emptySlots?.[currentDayName]?.includes(idx));
                  const freed = printFreedSlotsMap.get(idx) || [];
                  let final = [...empty]; freed.forEach(f => { if(!final.find(r => r.id === f.id)) final.push(f); });
                  if (idx >= 6) final = final.filter(r => r.type !== 'Tutorial Room');
                  const grp: Record<string, string[]> = {};
                  final.forEach(r => { const t = r.type || 'Other'; if(!grp[t]) grp[t] = []; grp[t].push(r.name); });
                  return Object.entries(grp).map(([type, rooms], gIdx) => (
                    <tr key={`${idx}-${type}`}>
                      {gIdx === 0 && <td rowSpan={Object.keys(grp).length} className="text-center border border-gray-300 font-bold bg-gray-50/80 py-1 px-2 text-[11px]">{TIME_SLOTS[idx]}</td>}
                      <td className="text-center border border-gray-300 font-bold py-1 px-2 text-gray-700 text-[11px]">{type}</td>
                      <td className="border border-gray-300 py-2 px-2"><div className="flex flex-wrap gap-1.5">{rooms.sort().map(rm => <span key={rm} className="px-1.5 py-0.5 border border-gray-300 bg-gray-50/50 rounded-md text-[11px] font-black text-srcc-portalNavy tracking-tight shadow-sm">{rm}</span>)}</div></td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </PrintLetterhead>
        );
        return (
          <div className="hidden print:block w-full">
            {renderTablePrint("EMPTY ROOMS MATRIX (8:30 AM - 1:30 PM)", [0,1,2,3,4], 'always')}
            {renderTablePrint("EMPTY ROOMS MATRIX (2:00 PM - 6:00 PM)", [5,6,7,8], 'auto')}
          </div>
        );
      })()}
    </div>
  );
}

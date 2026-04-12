import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon, UserCheck, AlertCircle, CheckCircle2, Printer,
  Clock, Edit2, Trash2, X, Users, UserPlus, Upload, Building2, Search, Filter
} from 'lucide-react';
import { format } from 'date-fns';
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
      const data = await res.json();
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
      const data = await response.json();
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
      const data = await response.json();
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

// === MAIN DASHBOARD ===
export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'absence' | 'faculty' | 'upload'>('absence');

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

  // --- Faculty Management States ---
  const [allTeachers, setAllTeachers] = useState<TeacherProfile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  // --- Room Management States ---
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomFilterType, setRoomFilterType] = useState('All');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number>(0);

  // Toast state
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => setToast({ message: msg, type });

  // --- Data Fetching ---
  const fetchTodayAbsences = async () => {
    try {
      const response = await fetch('/api/absences/today');
      if (response.ok) {
        const data = await response.json();
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
        if (Array.isArray(data)) setAllRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoadingRooms(false);
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

    setStatus('loading');

    try {
      const response = await fetch('/api/mark_absent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teacherName, startDate, endDate, adminUser: 'admin' }),
      });

      const data = await response.json() as { message?: string; error?: string };

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Absence recorded successfully.');
        setTeacherName('');
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

  const handlePrint = () => { window.print(); };

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
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Section Tabs - Hidden during print */}
      <div className="flex gap-2 print:hidden">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === s.id
                ? 'bg-srcc-portalNavy text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* === ABSENCE MANAGEMENT SECTION === */}
      {activeSection === 'absence' && (
        <>
          {/* Form Section */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden print:hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Mark Teacher Absence</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Record a teacher's absence. This will automatically notify the Student and Teacher applications.
                </p>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="teacherName" className="block text-sm font-medium text-gray-700">
                      Teacher Name
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                        <UserCheck className="h-5 w-5 text-gray-400" />
                      </div>
                      <Select
                        className="w-full text-sm"
                        styles={{
                          control: (base) => ({
                            ...base,
                            paddingLeft: '32px',
                            minHeight: '42px',
                            borderColor: '#D1D5DB',
                            boxShadow: 'none',
                            '&:hover': { borderColor: '#1E3A8A' }
                          }),
                          input: (base) => ({ ...base, "input:focus": { boxShadow: "none" } })
                        }}
                        placeholder="Search teacher..."
                        options={allTeachers.map(t => ({ value: t.name, label: `${t.name} (${t.id})` }))}
                        value={teacherName ? { value: teacherName, label: teacherName } : null}
                        onChange={(selected) => setTeacherName(selected ? selected.value : '')}
                        isClearable
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        required
                        className="focus:ring-srcc-portalNavy focus:border-srcc-portalNavy block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (e.target.value > endDate) setEndDate(e.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        required
                        className="focus:ring-srcc-portalNavy focus:border-srcc-portalNavy block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {status === 'success' && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Success</h3>
                        <div className="mt-2 text-sm text-green-700"><p>{message}</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700"><p>{message}</p></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-srcc-portalNavy hover:bg-srcc-deepNavy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-srcc-portalNavy disabled:opacity-50 transition-colors"
                  >
                    {status === 'loading' ? 'Processing...' : 'Mark Absent'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Today's Absences List */}
          <div className={`bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden ${activeSection === 'rooms' ? 'print:hidden' : 'print:shadow-none print:border-none'}`}>
            {/* Print Header */}
            <PrintLetterhead title="TEACHERS ON LEAVE" dateStr={todayStr} />

            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center print:hidden">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-srcc-portalNavy" />
                <h2 className="text-lg font-medium text-gray-900">Today's Absences ({todayStr})</h2>
              </div>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-srcc-portalNavy transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </button>
            </div>

            <div className="p-0 print:p-0">
              {loadingAbsences ? (
                <div className="p-6 text-center text-gray-500 print:hidden">Loading...</div>
              ) : todayAbsences.length === 0 ? (
                <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 m-6 rounded-lg">
                  No teachers marked absent for today.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:font-bold">Teacher Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:font-bold">Start Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:font-bold">End Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black print:font-bold">Recorded At</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todayAbsences.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.teacher_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:text-black">{format(new Date(record.start_date), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:text-black">{format(new Date(record.end_date), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:text-black">{format(new Date(record.created_at), 'h:mm a')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                          <button onClick={() => openEditModal(record)} className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors" title="Edit Record">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => openDeleteModal(record.id)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete Record">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-16 pt-8 border-t border-gray-300">
              <div className="flex justify-between text-sm text-gray-600">
                <p>Generated by SRCC Admin Portal</p>
                <p>Authorized Signature: _______________________</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === FACULTY DIRECTORY SECTION === */}
      {activeSection === 'faculty' && (
        <>
          <QuickAddTeacher onTeacherAdded={fetchTeachers} showToast={showToast} />

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Faculty Directory</h2>
                <p className="text-sm text-gray-500">{allTeachers.length} teachers registered • Click to view schedule details</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or code..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-srcc-portalNavy w-full md:w-64 text-sm"
                  value={teacherSearchTerm}
                  onChange={e => setTeacherSearchTerm(e.target.value)}
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
        </>
      )}

      {/* === ROOM FINDER SECTION === */}
      {activeSection === 'rooms' && (() => {
        // Compute today's day name to restrict freed rooms
        const currentDayName = format(new Date(), 'EEEE') as DayOfWeek;

        // Map all slots to freed rooms for the entire day (needed for report)
        const getFreedSlotsForDay = () => {
          const map = new Map<number, any[]>();
          TIME_SLOTS.forEach((_, i) => map.set(i, []));
          if (selectedDay !== currentDayName) return map;

          todayAbsences.forEach(absence => {
            const teacher = allTeachers.find(t => t.id === absence.teacher_id || t.name === absence.teacher_name);
            if (!teacher || !teacher.schedule) return;
            
            const schedule = teacher.schedule[selectedDay];
            if (!schedule) return;

            schedule.forEach((c: any) => {
              if (c.room && c.periods) {
                c.periods.forEach((pIndex: number) => {
                   map.get(pIndex)?.push({
                     id: c.room,
                     name: c.room,
                     type: 'Lecture Hall', // Generalization for freed rooms
                     emptySlots: { [selectedDay]: [pIndex] },
                     tags: [`Freed: ${teacher.name}`]
                   });
                });
              }
            });
          });
          return map;
        };

        const freedSlotsMap = getFreedSlotsForDay();
        const freedRooms = freedSlotsMap.get(selectedTimeIndex) || [];

        // Filter standard available rooms
        const baseAvailableRooms = allRooms.filter(room => {
          if (roomFilterType !== 'All' && room.type !== roomFilterType && room.type + 's' !== roomFilterType) return false;
          if (roomSearchQuery && !room.name.toLowerCase().includes(roomSearchQuery.toLowerCase())) return false;
          return room.emptySlots?.[selectedDay as DayOfWeek]?.includes(selectedTimeIndex);
        });

        // Merge standard + freed rooms
        const finalAvailableRooms = [...baseAvailableRooms];
        freedRooms.forEach(freed => {
          // Add it only if it meets the filter criteria and isn't already there
          if (roomFilterType !== 'All' && freed.type !== roomFilterType && freed.type + 's' !== roomFilterType) return;
          if (roomSearchQuery && !freed.name.toLowerCase().includes(roomSearchQuery.toLowerCase())) return;
          if (!finalAvailableRooms.find(r => r.id === freed.id)) {
            finalAvailableRooms.push(freed);
          }
        });

        return (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 print:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <Clock className="w-4 h-4 text-srcc-portalNavy" /> Select Room Time
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-500">
                  {allRooms.length} rooms mapped
                </div>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-srcc-portalNavy transition-colors"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  Print Empty Day Report
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-srcc-portalNavy"
              >
                {Object.values(DayOfWeek).map(day => <option key={day} value={day}>{day}</option>)}
              </select>
              <select
                value={selectedTimeIndex}
                onChange={(e) => setSelectedTimeIndex(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-srcc-portalNavy"
              >
                {TIME_SLOTS.map((slot, index) => <option key={index} value={index}>{slot}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
             <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search room (e.g. 104)" 
                  value={roomSearchQuery} 
                  onChange={(e) => setRoomSearchQuery(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm focus:ring-2 focus:ring-srcc-portalNavy/20 focus:border-srcc-portalNavy transition-all"
                />
             </div>
             <div className="relative shrink-0 md:w-56">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <Filter className="w-5 h-5 text-gray-400" />
                </div>
                <select 
                  value={roomFilterType} 
                  onChange={(e) => setRoomFilterType(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none shadow-sm font-bold text-gray-700 appearance-none focus:ring-2 focus:ring-srcc-portalNavy/20 focus:border-srcc-portalNavy transition-all"
                >
                  <option value="All">All Rooms</option>
                  <option value="Lecture Hall">Lecture Halls</option>
                  <option value="Tutorial Room">Tutorial Rooms</option>
                  <option value="Computer Lab">Computer Labs</option>
                  <option value="Seminar Room">Seminar Rooms</option>
                </select>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {finalAvailableRooms.map((room) => {
              // Calculate free duration
              let freeSlots = 0;
              const slots = room.emptySlots?.[selectedDay as DayOfWeek] || [];
              for (let i = selectedTimeIndex; i < TIME_SLOTS.length; i++) {
                  if (slots.includes(i)) freeSlots++;
                  else break;
              }

              return (
                <div
                  key={room.id}
                  className={`relative bg-white rounded-xl border p-5 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg group ${room.tags ? 'border-green-300 ring-2 ring-green-50' : 'border-gray-200'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 text-xl font-bold shadow-sm ${room.tags ? 'bg-green-100 text-green-700' : 'bg-srcc-portalNavy/10 text-srcc-portalNavy group-hover:bg-srcc-portalNavy group-hover:text-srcc-yellow'} transition-colors`}>
                    {room.name.replace(/[^0-9]/g, '') || room.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                  {room.tags ? (
                     <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase mt-1">
                        {room.tags[0]}
                     </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md mt-2">
                      <Clock className="w-3 h-3" /> Free {freeSlots} hr{freeSlots > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className={`p-1.5 transition-colors rounded-md ${room.source === 'database' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-200 cursor-not-allowed'}`} 
                      title={room.source === 'database' ? "Delete Room" : "Static room cannot be deleted"}
                      onClick={() => {
                        if (room.source === 'database') {
                          if (confirm(`Delete ${room.name}?`)) {
                            alert('Room deletion functionality simulated.');
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Print Table for Empty Rooms - Visually hidden except on print */}
          <div className="hidden print:block pt-4">
             <PrintLetterhead title="EMPTY ROOMS MATRIX (EXCL. TUTORIALS)" dateStr={`${todayStr} | Day: ${selectedDay}`} />
             
             <table className="min-w-full divide-y divide-gray-200 border border-gray-200 shadow-none">
               <thead className="bg-gray-100">
                 <tr>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 w-48">Time Slot</th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Available Lecture Halls, Labs, Seminar Rooms</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {TIME_SLOTS.map((slot, index) => {
                   const baseEmpty = allRooms.filter(r => r.type !== 'Tutorial Room' && r.type !== 'Tutorial Rooms' && r.emptySlots?.[selectedDay as DayOfWeek]?.includes(index));
                   const freedForSlot = freedSlotsMap.get(index) || [];
                   const finalEmpty = [...baseEmpty];
                   freedForSlot.forEach(f => {
                       if (f.type !== 'Tutorial Room' && f.type !== 'Tutorial Rooms') {
                           if (!finalEmpty.find(r => r.id === f.id)) finalEmpty.push(f);
                       }
                   });
                   finalEmpty.sort((a,b) => a.name.localeCompare(b.name));
                   
                   return (
                     <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-200">{slot}</td>
                       <td className="px-6 py-4 text-sm font-medium text-gray-700 leading-relaxed max-w-4xl break-words">
                         {finalEmpty.length > 0 ? (
                            finalEmpty.map(r => r.name).join(', ')
                         ) : (
                            <span className="italic text-gray-400 font-normal">None Available</span>
                         )}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>

        </div>
        );
      })()}

      {/* === DATA UPLOAD SECTION === */}
      {activeSection === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimetableUploader
            teachersList={allTeachers}
            onSuccess={fetchTeachers}
            showToast={showToast}
          />
          <RoomTimetableUploader showToast={showToast} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this absence record? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setRecordToDelete(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-srcc-portalNavy"
              >Cancel</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >Delete Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 mx-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-medium text-gray-900">Edit Absence Record</h3>
              <button onClick={() => { setEditModalOpen(false); setEditRecord(null); }} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-srcc-portalNavy focus:border-srcc-portalNavy sm:text-sm"
                  value={editTeacherName}
                  onChange={(e) => setEditTeacherName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-srcc-portalNavy focus:border-srcc-portalNavy sm:text-sm"
                    value={editStartDate}
                    onChange={(e) => {
                      setEditStartDate(e.target.value);
                      if (e.target.value > editEndDate) setEditEndDate(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-srcc-portalNavy focus:border-srcc-portalNavy sm:text-sm"
                    value={editEndDate}
                    min={editStartDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditRecord(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-srcc-portalNavy"
                >Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-srcc-portalNavy bg-srcc-yellow border border-transparent rounded-md hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-srcc-portalNavy"
                >Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

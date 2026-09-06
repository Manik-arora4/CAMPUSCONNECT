import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, Users, CheckCircle2, XCircle, Clock, AlertTriangle,
  Loader2, Search, Filter, ChevronDown, Save, Send, History, BookOpen
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, EmptyState, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { fmtDate } from '../../lib/format';

export default function TakeAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [step, setStep] = useState('select'); // select | mark | submitted
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Today's classes
  const { data: todayData, loading: todayLoading } = useAsync(() => api.get('/faculty-attendance/today'));

  // Create session
  const createSession = async (subject) => {
    setLoading(true);
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.post('/faculty-attendance/session', {
        subjectId: subject.id,
        date: today,
      });
      setSession(res.session);
      setSelectedSubject(subject);
      await loadStudents(res.session.id);
      setStep('mark');
    } catch (err) {
      // If session already exists, try to get it
      if (err.message?.includes('already exists')) {
        // Fetch today's sessions and find the one for this subject
        const todayRes = await api.get('/faculty-attendance/today');
        const existing = todayRes.todaySessions?.find(s => s.subject === subject.id);
        if (existing) {
          setSession(existing);
          setSelectedSubject(subject);
          await loadStudents(existing.id);
          setStep('mark');
          return;
        }
      }
      setError(err.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  // Load students for session
  const loadStudents = async (sessionId) => {
    try {
      const res = await api.get(`/faculty-attendance/session/${sessionId}/students`);
      setStudents(res.students || []);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    }
  };

  // Mark individual student
  const markStudent = (studentId, status) => {
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId ? { ...s, attendanceStatus: status } : s
      )
    );
  };

  // Mark all present
  const markAllPresent = () => {
    setStudents(prev =>
      prev.map(s => ({ ...s, attendanceStatus: 'present' }))
    );
  };

  // Submit attendance
  const submitAttendance = async () => {
    setSaving(true);
    setError('');
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: s.attendanceStatus || 'absent', // default absent if not marked
      }));

      await api.post(`/faculty-attendance/session/${session.id}/mark`, { records });
      setSuccess('Attendance submitted successfully!');
      setStep('submitted');
    } catch (err) {
      setError(err.message || 'Failed to submit attendance');
    } finally {
      setSaving(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment?.enrollmentNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const stats = {
    total: students.length,
    present: students.filter(s => s.attendanceStatus === 'present').length,
    absent: students.filter(s => s.attendanceStatus === 'absent').length,
    late: students.filter(s => s.attendanceStatus === 'late').length,
    unmarked: students.filter(s => !s.attendanceStatus).length,
  };

  if (todayLoading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Take Attendance</h1>
          <p className="page-subtitle">Mark attendance for your classes</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => navigate('/faculty/attendance/history')}
        >
          <History size={16} /> View History
        </button>
      </div>

      <ErrorBanner error={error} />
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Step 1: Select Subject */}
      {step === 'select' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Today's Classes</h3>
            <p className="text-sm text-slate-500 mb-4">Select a class to take attendance</p>

            {todayData?.subjects?.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No classes assigned"
                message="You don't have any subjects assigned yet."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayData?.subjects?.map(subject => {
                  const hasSession = todayData.todaySessions?.some(s => s.subject === subject.id);
                  return (
                    <button
                      key={subject.id}
                      onClick={() => createSession(subject)}
                      disabled={loading}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        hasSession
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50'
                      }`}
                    >
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ backgroundColor: subject.color || '#6366f1' }}
                      >
                        {subject.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{subject.name}</p>
                        <p className="text-xs text-slate-400">{subject.code} · Semester {subject.semester}</p>
                      </div>
                      {hasSession ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={12} className="mr-1" /> Done
                        </Badge>
                      ) : (
                        <Badge className="bg-brand-100 text-brand-700">
                          <Clock size={12} className="mr-1" /> Take
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Today's sessions summary */}
          {todayData?.todaySessions?.length > 0 && (
            <Card>
              <h3 className="font-semibold text-slate-800 mb-3">Completed Today</h3>
              <div className="space-y-2">
                {todayData.todaySessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span className="text-sm font-medium text-slate-700">{s.subjectName}</span>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: Mark Attendance */}
      {step === 'mark' && (
        <div className="space-y-4">
          {/* Subject Info */}
          <Card className="bg-gradient-to-r from-brand-50 to-violet-50 border-brand-200">
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: selectedSubject?.color || '#6366f1' }}
              >
                {selectedSubject?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{selectedSubject?.name}</h3>
                <p className="text-sm text-slate-500">{selectedSubject?.code} · {fmtDate(new Date())}</p>
              </div>
            </div>
          </Card>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
              <p className="text-xs text-emerald-500">Present</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-xs text-red-500">Absent</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
              <p className="text-xs text-amber-500">Late</p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-2xl font-bold text-slate-500">{stats.unmarked}</p>
              <p className="text-xs text-slate-400">Unmarked</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary flex items-center gap-2" onClick={markAllPresent}>
              <CheckCircle2 size={16} className="text-emerald-600" />
              Mark All Present
            </button>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Student List */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                    <th className="py-3 px-3 font-semibold">#</th>
                    <th className="py-3 px-3 font-semibold">Student</th>
                    <th className="py-3 px-3 font-semibold">Roll No</th>
                    <th className="py-3 px-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm shrink-0">
                            {student.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {student.enrollment?.enrollmentNumber || student.profile?.enrollmentNumber || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => markStudent(student.id, 'present')}
                            className={`p-2 rounded-lg transition-all ${
                              student.attendanceStatus === 'present'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title="Present"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button
                            onClick={() => markStudent(student.id, 'absent')}
                            className={`p-2 rounded-lg transition-all ${
                              student.attendanceStatus === 'absent'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title="Absent"
                          >
                            <XCircle size={18} />
                          </button>
                          <button
                            onClick={() => markStudent(student.id, 'late')}
                            className={`p-2 rounded-lg transition-all ${
                              student.attendanceStatus === 'late'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                            title="Late"
                          >
                            <Clock size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>No students found</p>
              </div>
            )}
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => { setStep('select'); setSession(null); setStudents([]); }}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={submitAttendance}
              disabled={saving || stats.unmarked > 0}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                <><Send size={16} /> Submit Attendance</>
              )}
            </button>
          </div>
          {stats.unmarked > 0 && (
            <p className="text-sm text-amber-600 text-right">
              ⚠️ {stats.unmarked} student(s) unmarked. They will be marked absent by default.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Submitted */}
      {step === 'submitted' && (
        <Card className="text-center py-12">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Attendance Submitted! ✅</h2>
          <p className="text-slate-500 mb-6">
            {stats.present} present, {stats.absent} absent, {stats.late} late out of {stats.total} students
          </p>
          <div className="flex justify-center gap-3">
            <button className="btn-secondary" onClick={() => navigate('/faculty/attendance/history')}>
              View History
            </button>
            <button
              className="btn-primary"
              onClick={() => { setStep('select'); setSession(null); setStudents([]); setSuccess(''); }}
            >
              Take Another Class
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}



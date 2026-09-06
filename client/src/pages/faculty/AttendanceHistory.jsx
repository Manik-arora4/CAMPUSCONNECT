import { useState } from 'react';
import { History, Download, Filter, Calendar, Users, CheckCircle2, XCircle, Clock, BarChart3 } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, EmptyState } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { fmtDate } from '../../lib/format';

export default function AttendanceHistory() {
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSession, setSelectedSession] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Fetch history
  const { data, loading, reload } = useAsync(() => {
    const params = new URLSearchParams();
    if (subjectFilter) params.set('subjectId', subjectFilter);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    return api.get(`/faculty-attendance/history?${params.toString()}`);
  });

  // Fetch subjects for filter
  const { data: courseData } = useAsync(() => api.get('/faculty-attendance/courses'));

  // Load report for a session
  const loadReport = async (session) => {
    setSelectedSession(session);
    setLoadingReport(true);
    try {
      const res = await api.get(`/faculty-attendance/report?subjectId=${session.subject}`);
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading) return <PageLoader />;

  const sessions = data?.sessions || [];
  const subjects = courseData?.subjects || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance History</h1>
          <p className="page-subtitle">View past attendance sessions and reports</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select
              className="input"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
            <input
              type="date"
              className="input"
              value={dateRange.start}
              onChange={(e) => setDateRange(r => ({ ...r, start: e.target.value }))}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
            <input
              type="date"
              className="input"
              value={dateRange.end}
              onChange={(e) => setDateRange(r => ({ ...r, end: e.target.value }))}
            />
          </div>
          <button className="btn-secondary" onClick={reload}>
            <Filter size={16} /> Apply
          </button>
        </div>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No attendance sessions found"
          message="Start taking attendance to see history here."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSession?.id === session.id ? 'ring-2 ring-brand-500' : ''
              }`}
              onClick={() => loadReport(session)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 flex items-center justify-center">
                    <Calendar size={20} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{session.subjectName}</h3>
                    <p className="text-sm text-slate-500">{fmtDate(session.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={14} /> {session.stats?.present || 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={14} /> {session.stats?.absent || 0}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock size={14} /> {session.stats?.late || 0}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {session.stats?.percentage || 0}% attendance
                    </p>
                  </div>
                  <Badge className={
                    session.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' :
                    session.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }>
                    {session.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Report Detail */}
      {selectedSession && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} /> Report: {selectedSession.subjectName}
            </h3>
            <button className="btn-secondary text-xs" onClick={() => { setSelectedSession(null); setReportData(null); }}>
              Close
            </button>
          </div>

          {loadingReport ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 mt-2">Loading report...</p>
            </div>
          ) : reportData ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-800">{reportData.summary?.totalStudents || 0}</p>
                  <p className="text-xs text-slate-400">Students</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-slate-800">{reportData.summary?.totalClasses || 0}</p>
                  <p className="text-xs text-slate-400">Classes</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{reportData.summary?.overallPercentage || 0}%</p>
                  <p className="text-xs text-emerald-500">Overall</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-red-600">{reportData.summary?.lowAttendance || 0}</p>
                  <p className="text-xs text-red-500">Low Attendance</p>
                </div>
              </div>

              {/* Student Details */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                      <th className="py-2 px-3 font-semibold">#</th>
                      <th className="py-2 px-3 font-semibold">Student</th>
                      <th className="py-2 px-3 font-semibold">Present</th>
                      <th className="py-2 px-3 font-semibold">Absent</th>
                      <th className="py-2 px-3 font-semibold">Late</th>
                      <th className="py-2 px-3 font-semibold">Total</th>
                      <th className="py-2 px-3 font-semibold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.report?.map((student, idx) => (
                      <tr key={student.student} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{student.name}</td>
                        <td className="py-2 px-3 text-emerald-600">{student.present}</td>
                        <td className="py-2 px-3 text-red-600">{student.absent}</td>
                        <td className="py-2 px-3 text-amber-600">{student.late}</td>
                        <td className="py-2 px-3 text-slate-600">{student.total}</td>
                        <td className="py-2 px-3">
                          <span className={`font-semibold ${
                            student.percentage >= 75 ? 'text-emerald-600' :
                            student.percentage >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {student.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

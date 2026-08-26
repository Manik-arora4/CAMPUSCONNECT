import { useState } from 'react';
import { Users, Search, ChevronDown, ChevronRight, Mail, Phone, BookOpen, Percent } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, EmptyState, Tabs } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { Avatar } from '../../components/UI';

export default function FacultyStudents() {
  const { data, loading } = useAsync(() => api.get('/faculty/students'));
  const [search, setSearch] = useState('');
  const [selectedSem, setSelectedSem] = useState('all');
  const [expandedSem, setExpandedSem] = useState({});

  if (loading) return <PageLoader />;

  const { students = [], grouped = {}, semesters = [], subjects = [], total = 0 } = data || {};

  // Filter by search
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.profile?.enrollmentNumber?.toLowerCase().includes(q)
    );
  });

  // Group filtered students by semester
  const displayGrouped = {};
  for (const s of filtered) {
    const sem = s.profile?.semester || 1;
    if (selectedSem !== 'all' && sem !== Number(selectedSem)) continue;
    if (!displayGrouped[sem]) displayGrouped[sem] = [];
    displayGrouped[sem].push(s);
  }

  const sortedSems = Object.keys(displayGrouped).sort((a, b) => Number(a) - Number(b));

  const toggleSem = (sem) => setExpandedSem((prev) => ({ ...prev, [sem]: !prev[sem] }));

  const avgAttendance = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + (s.attendance?.percentage || 0), 0) / filtered.length)
    : 0;

  const lowAttendance = filtered.filter((s) => s.attendance?.percentage > 0 && s.attendance?.percentage < 75).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">My Students</h1>
        <p className="page-subtitle">
          Students from your {subjects.length} subject{subjects.length !== 1 ? 's' : ''} across {semesters.length} semester{semesters.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><Users size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <p className="text-sm text-slate-500">Total students</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><Percent size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{avgAttendance}%</p>
            <p className="text-sm text-slate-500">Avg attendance</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><BookOpen size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{semesters.length}</p>
            <p className="text-sm text-slate-500">Semesters</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${lowAttendance > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <Percent size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{lowAttendance}</p>
            <p className="text-sm text-slate-500">Low attendance</p>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or enrollment number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={selectedSem}
          onChange={(e) => setSelectedSem(e.target.value)}
        >
          <option value="all">All semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Students grouped by semester */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No students found"
            message={search ? 'Try a different search term.' : 'No students match your filters.'}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedSems.map((sem) => {
            const semStudents = displayGrouped[sem];
            const isExpanded = expandedSem[sem] !== false; // default open
            return (
              <Card key={sem}>
                <button
                  onClick={() => toggleSem(sem)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    <h3 className="font-semibold text-slate-800">Semester {sem}</h3>
                    <Badge className="bg-slate-100 text-slate-600">{semStudents.length} students</Badge>
                  </div>
                  <span className="text-sm text-slate-500">
                    Avg: {semStudents.length
                      ? Math.round(semStudents.reduce((s, st) => s + (st.attendance?.percentage || 0), 0) / semStudents.length)
                      : 0}%
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                          <th className="py-2.5 pr-4 font-semibold">Student</th>
                          <th className="py-2.5 pr-4 font-semibold">Enrollment</th>
                          <th className="py-2.5 pr-4 font-semibold">Email</th>
                          <th className="py-2.5 pr-4 font-semibold">Attendance</th>
                          <th className="py-2.5 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semStudents.map((s) => (
                          <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={s.name} size="sm" src={s.avatar} />
                                <div>
                                  <p className="font-medium text-slate-800">{s.name}</p>
                                  <p className="text-xs text-slate-400">{s.profile?.course || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-slate-600 font-mono text-xs">
                              {s.profile?.enrollmentNumber || '—'}
                            </td>
                            <td className="py-3 pr-4 text-slate-500 text-xs">
                              <div className="flex items-center gap-1">
                                <Mail size={12} />
                                <span className="truncate max-w-[180px]">{s.email}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              {s.attendance?.total > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-16 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        s.attendance.percentage >= 75 ? 'bg-emerald-500' :
                                        s.attendance.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${s.attendance.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-600">
                                    {s.attendance.percentage}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">No data</span>
                              )}
                            </td>
                            <td className="py-3">
                              <Badge
                                className={
                                  s.attendance?.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                  s.attendance?.percentage >= 60 ? 'bg-amber-100 text-amber-700' :
                                  s.attendance?.total > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                                }
                              >
                                {s.attendance?.total > 0
                                  ? s.attendance.percentage >= 75 ? 'Good' :
                                    s.attendance.percentage >= 60 ? 'Warning' : 'Critical'
                                  : 'N/A'
                                }
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

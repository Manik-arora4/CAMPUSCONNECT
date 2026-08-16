import { useState } from 'react';
import { Search, Trash2, Ban, CheckCircle2, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, Avatar, EmptyState, ConfirmModal } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { timeAgo } from '../../lib/format';

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const { data, loading, reload } = useAsync(() => api.get('/admin/students', { search, limit: 30 }), [search]);
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const students = data?.students || [];

  const toggleActive = async (s) => {
    await api.patch(`/admin/students/${s.id}`, { active: !s.active });
    reload();
  };

  const remove = async (s) => {
    await api.delete(`/admin/students/${s.id}`);
    reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Students</h1>
        <p className="page-subtitle">Manage all student accounts ({data?.total || 0}).</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="input pl-10" />
      </div>

      {students.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No students found" message="Try a different search." />
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/60">
                  <th className="py-3 px-5 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Course</th>
                  <th className="py-3 px-4 font-semibold">Semester</th>
                  <th className="py-3 px-4 font-semibold">Joined</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.profile?.course || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.profile?.semester || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4">
                      <Badge className={s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{s.active ? 'Active' : 'Disabled'}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActive(s)}
                          className={`p-1.5 rounded-lg transition ${s.active ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-300 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={s.active ? 'Disable' : 'Enable'}
                        >
                          {s.active ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                        <button onClick={() => setConfirm(s)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm)}
        title="Delete student?"
        message={confirm ? `Permanently delete ${confirm.name}'s account and profile?` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

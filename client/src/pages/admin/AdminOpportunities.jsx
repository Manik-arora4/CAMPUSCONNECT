import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Briefcase, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, EmptyState, ConfirmModal } from '../../components/UI';
import { useAsync } from '../../components/UI';
import { categoryColor, relativeDay, fmtDate } from '../../lib/format';

export default function AdminOpportunities() {
  const { data: pendingData, loading, reload } = useAsync(() => api.get('/admin/pending-opportunities'));
  const { data: allData, reload: reloadAll } = useAsync(() => api.get('/opportunities', { limit: 50, status: 'all' }));
  const [tab, setTab] = useState('pending');
  const [confirm, setConfirm] = useState(null);

  if (loading) return <PageLoader />;

  const pending = pendingData?.opportunities || [];
  const all = allData?.opportunities || [];

  const verify = async (id) => {
    await api.post(`/opportunities/${id}/verify`);
    reload();
    reloadAll();
  };
  const reject = async (id) => {
    await api.post(`/opportunities/${id}/reject`);
    reload();
    reloadAll();
  };
  const remove = async (id) => {
    await api.delete(`/opportunities/${id}`);
    reload();
    reloadAll();
  };

  const list = tab === 'pending' ? pending : all;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Opportunities</h1>
        <p className="page-subtitle">Moderate submissions and manage the catalog.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('pending')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'pending' ? 'bg-brand-600 text-white' : 'bg-white/60 backdrop-blur-md border border-white/60 text-slate-600 hover:bg-white/80'}`}>
          Pending review ({pending.length})
        </button>
        <button onClick={() => setTab('all')} className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === 'all' ? 'bg-brand-600 text-white' : 'bg-white/60 backdrop-blur-md border border-white/60 text-slate-600 hover:bg-white/80'}`}>
          All ({all.length})
        </button>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title={tab === 'pending' ? 'No pending opportunities' : 'No opportunities found'} message={tab === 'pending' ? 'Faculty submissions awaiting review will appear here.' : ''} />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((opp) => (
            <Card key={opp._id}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/opportunities/${opp._id}`} className="font-semibold text-slate-900 hover:text-brand-700 transition">
                      {opp.title}
                    </Link>
                    <Badge className={categoryColor(opp.category)}>{opp.category}</Badge>
                    <Badge className={opp.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : opp.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                      {opp.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{opp.organization} · {opp.mode} · {opp.location}</p>
                  <p className="text-xs text-slate-400 mt-1">Deadline {fmtDate(opp.deadline)} · Posted {fmtDate(opp.postedDate)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tab === 'pending' ? (
                    <>
                      <button onClick={() => verify(opp._id)} className="btn-primary !py-1.5 !px-3 text-xs">
                        <CheckCircle2 size={14} /> Verify
                      </button>
                      <button onClick={() => reject(opp._id)} className="btn-secondary !py-1.5 !px-3 text-xs !text-red-600">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  ) : null}
                  <button onClick={() => setConfirm(opp)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition" aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && remove(confirm._id)}
        title="Delete opportunity?"
        message={confirm ? `Delete "${confirm.title}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

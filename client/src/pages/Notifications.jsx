import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, EmptyState } from '../components/UI';
import { useAsync } from '../components/UI';
import { timeAgo } from '../lib/format';

export default function NotificationsPage() {
  const { data, loading, reload } = useAsync(() => api.get('/notifications', { limit: 50 }));
  const [filter, setFilter] = useState('all');

  if (loading) return <PageLoader />;

  const notifications = data?.notifications || [];
  const visible = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter((n) => !n.read) : notifications.filter((n) => n.category === filter);

  const markRead = async (n) => {
    if (n.read) return;
    await api.patch(`/notifications/${n._id}/read`);
    reload();
  };

  const markAll = async () => {
    await api.post('/notifications/read-all');
    reload();
  };

  const remove = async (id) => {
    await api.delete(`/notifications/${id}`);
    reload();
  };

  const cats = ['all', 'unread', ...new Set(notifications.map((n) => n.category))];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Everything your campus and AI want to tell you.</p>
        </div>
        {notifications.some((n) => !n.read) ? (
          <button className="btn-secondary" onClick={markAll}>
            <CheckCheck size={16} /> Mark all read
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              filter === c ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Nothing here" message="You're all caught up." />
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <Card key={n._id} className={`!py-3.5 ${n.read ? '' : 'border-brand-200 bg-brand-50/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-slate-200' : 'bg-brand-500'}`} />
                <div className="flex-1 min-w-0">
                  {n.link ? (
                    <Link to={n.link} onClick={() => markRead(n)} className="block">
                      <p className={`text-sm font-medium ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </Link>
                  ) : (
                    <div onClick={() => markRead(n)}>
                      <p className={`text-sm font-medium ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400 capitalize">{n.category}</span>
                    <span className="text-[11px] text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => remove(n._id)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition shrink-0" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

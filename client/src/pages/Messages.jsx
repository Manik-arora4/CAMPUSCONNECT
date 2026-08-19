import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Users, ChevronLeft, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Avatar, EmptyState } from '../components/UI';
import { timeAgo, fmtDateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null); // { id, name, designation, role }
  const [messages, setMessages] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const d = await api.get('/messages/conversations');
      setConversations(d.conversations || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadThread = useCallback(async (userId) => {
    try {
      const d = await api.get(`/messages/${userId}`);
      setActive(d.user);
      setMessages(d.messages || []);
      setShowContacts(false);
      loadConversations();
    } catch {
      /* ignore */
    }
  }, [loadConversations]);

  useEffect(() => {
    (async () => {
      try {
        const [c, contactsData] = await Promise.all([
          api.get('/messages/conversations'),
          api.get('/messages/contacts'),
        ]);
        setConversations(c.conversations || []);
        setContacts(contactsData.contacts || []);
      } finally {
        setLoading(false);
      }
    })();
    const t = setInterval(() => {
      loadConversations();
      if (active?.id) {
        api
          .get(`/messages/${active.id}`)
          .then((d) => setMessages(d.messages || []))
          .catch(() => {});
      }
    }, 5000);
    return () => clearInterval(t);
  }, [active?.id, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, active?.id]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !active?.id || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await api.post('/messages', { receiverId: active.id, content: text });
      setMessages((m) => [...m, res.message]);
      loadConversations();
    } catch (err) {
      setInput(text);
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  if (loading) return <PageLoader />;

  const otherRoleLabel = user?.role === 'student' ? 'faculty' : user?.role === 'faculty' ? 'student' : 'user';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            Chat with your college {otherRoleLabel} · {unreadTotal > 0 ? `${unreadTotal} unread` : 'all caught up'}
          </p>
        </div>
        <button onClick={() => { setShowContacts((s) => !s); setActive(null); }} className="btn-secondary !px-3.5">
          <Users size={16} /> New chat
        </button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="grid lg:grid-cols-[320px_1fr] h-[68vh]">
          {/* Left pane — conversations or contacts */}
          <div className={`${active ? 'hidden lg:block' : ''} border-r border-slate-100 flex flex-col min-h-0`}>
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{showContacts ? 'Your college' : 'Conversations'}</p>
              {showContacts ? (
                <button onClick={() => setShowContacts(false)} className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1">
                  <ChevronLeft size={13} /> Back
                </button>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto">
              {showContacts ? (
                contacts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10 px-4">No {otherRoleLabel} added to your college yet.</p>
                ) : (                <div className="p-2 space-y-1">
                  {contacts.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => loadThread(c.id)}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 hover:translate-x-0.5 transition-all duration-300 text-left animate-fade-up"
                        style={{ animationDelay: `${i * 0.04}s` }}
                      >
                        <Avatar name={c.name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate">{c.designation || c.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : conversations.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No conversations yet" message={`Tap "New chat" to message your college ${otherRoleLabel}.`} />
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map((c, i) => (
                    <button
                      key={c._id}
                      onClick={() => loadThread(c._id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 text-left animate-fade-up ${
                        active?.id === c._id ? 'bg-brand-50' : 'hover:bg-slate-50 hover:translate-x-0.5'
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <Avatar name={c.user?.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate">{c.user?.name}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.lastAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                          {c.unread > 0 ? (
                            <span className="h-5 min-w-[20px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 animate-pulse-soft">
                              {c.unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right pane — thread */}
          <div className={`${active ? '' : 'hidden lg:flex'} flex-col min-h-0 ${active ? 'flex' : 'lg:flex'}`}>
            {!active ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState icon={MessageSquare} title="Select a conversation" message={`Choose a chat from the list, or start a new one with your college ${otherRoleLabel}.`} />
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => setActive(null)} className="lg:hidden text-slate-400 hover:text-slate-600">
                      <ChevronLeft size={20} />
                    </button>
                    <Avatar name={active.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{active.name}</p>
                      <p className="text-xs text-slate-500 truncate">{active.designation || active.role}</p>
                    </div>
                  </div>
                  <button onClick={() => loadThread(active.id)} className="p-2 text-slate-400 hover:text-brand-600 transition" title="Refresh">
                    <RefreshCw size={15} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-slate-50/40">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-10">No messages yet — say hi!</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <div key={m.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''} ${mine ? 'animate-slide-in-right' : 'animate-scale-in-soft'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${mine ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white/80 backdrop-blur-md border border-white/70 text-slate-800 rounded-tl-sm'}`}>
                            <p>{m.content}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-slate-400'}`}>{fmtDateTime(m.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${active.name.split(' ')[0]}…`}
                    className="input flex-1"
                    maxLength={2000}
                  />
                  <button type="submit" className="btn-primary shrink-0 !px-4" disabled={sending || !input.trim()}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

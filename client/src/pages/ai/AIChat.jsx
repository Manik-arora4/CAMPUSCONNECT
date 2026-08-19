import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/UI';
import TypingAnimation from '../../components/TypingAnimation';
import { useAuth } from '../../context/AuthContext';

const SUGGESTIONS = [
  'What classes do I have today?',
  'How is my attendance looking?',
  'What should I focus on today?',
  'Which opportunity matches me best?',
  'What skills am I missing for my career goal?',
  'Give me tips to improve my attendance',
];

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0]}! 👋 I'm your CAMPUSCONNECT assistant. I can see your timetable, attendance, tasks, deadlines and opportunities. Ask me anything!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      // Send conversation history for context continuity
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6) // last 6 messages for context
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/ai/chat', { message: msg, history });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply || 'Hmm, I could not process that. Try rephrasing!' }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Hi ${user?.name?.split(' ')[0]}! 👋 I'm your CAMPUSCONNECT assistant. Ask me anything about your campus life.`,
      },
    ]);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Context-aware copilot</p>
        </div>
        <button onClick={reset} className="btn-ghost !p-2" title="Reset conversation">
          <RefreshCw size={16} />
        </button>
      </div>

      <Card className="flex flex-col h-[65vh] !p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gradient-to-br from-violet-500 to-brand-600 text-white'
                }`}
              >
                {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white/70 backdrop-blur-md border border-white/60 text-slate-800 rounded-tl-sm'
                }`}
              >
                <TypingAnimation children={m.content} duration={m.role === 'user' ? 40 : 22} startOnView={false} />
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-brand-600 text-white flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 p-3">
          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-white/60 backdrop-blur-md border border-white/60 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-white/80 rounded-full px-3 py-1.5 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your timetable, attendance, deadlines, opportunities…"
              className="input flex-1"
            />
            <button type="submit" className="btn-primary shrink-0 !px-4" disabled={loading || !input.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}

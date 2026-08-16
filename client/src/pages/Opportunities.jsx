import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search, Sparkles, Bookmark, Send, MapPin, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Badge, EmptyState } from '../components/UI';
import { useAsync } from '../components/UI';
import { categoryColor, scoreColor, relativeDay } from '../lib/format';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'internship', 'hackathon', 'job', 'scholarship', 'training', 'workshop', 'competition', 'fellowship', 'research', 'conference'];
const MODES = ['all', 'remote', 'onsite', 'hybrid'];
const SORTS = [
  ['match', 'Best match'],
  ['deadline', 'Soonest deadline'],
  ['newest', 'Newest'],
];

export default function Opportunities() {
  const { isStudent } = useAuth();
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('match');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInfo, setAiInfo] = useState('');

  const { data, loading, reload } = useAsync(
    () => api.get('/opportunities', { category, mode, search, sort, limit: 24 }),
    [category, mode, search, sort]
  );

  const save = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    await api.post(`/opportunities/${id}/save`);
    reload();
  };

  const apply = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    await api.post(`/opportunities/${id}/apply`);
    reload();
  };

  const aiSearch = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiInfo('');
    try {
      const res = await api.post('/opportunities/search', { query: aiQuery });
      setAiResults(res.results);
      setAiInfo(res.fromAI ? 'Parsed by AI ✨' : 'Keyword search');
    } catch (err) {
      setAiInfo(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const list = aiResults !== null ? aiResults : data?.opportunities || [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Opportunities</h1>
        <p className="page-subtitle">
          Internships, hackathons, jobs and more — ranked by how well they match you.
        </p>
      </div>

      {/* AI search */}
      <form onSubmit={aiSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500" />
          <input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder='Try "remote AI hackathon for beginners before next week"'
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0" disabled={aiLoading}>
          {aiLoading ? 'Searching…' : 'AI Search'}
        </button>
      </form>
      {aiInfo ? <p className="text-xs text-slate-500 -mt-2">{aiInfo}</p> : null}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.slice(0, 7).map((c) => {
            const active = category === c && aiResults === null;
            return (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setAiResults(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition duration-300 ${
                  active
                    ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-glow-sm scale-[1.04]'
                    : 'bg-white/60 backdrop-blur-md border border-white/60 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-white/80 hover:-translate-y-0.5'
                }`}
              >
                {c === 'all' ? '✨ All' : c}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="input !w-auto !py-1.5 text-xs capitalize">
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !w-auto !py-1.5 text-xs">
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search box */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, company, skill…" className="input pl-10" />
      </div>

      {loading ? (
        <PageLoader />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title="No opportunities found" message="Try widening your filters or an AI search with different words." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((item) => {
            const opp = item.opportunity || item;
            const score = item.score;
            return (
              <Link key={opp._id} to={`/opportunities/${opp._id}`} className="card card-hover group p-5 hover:border-brand-200">
                <div className="flex items-start justify-between gap-2">
                  <Badge className={categoryColor(opp.category)}>{opp.category}</Badge>
                  <div className="flex items-center gap-1">
                    {score !== undefined && isStudent ? (
                      <span className={`text-sm font-bold ${scoreColor(score)}`}>{Math.round(score)}%</span>
                    ) : null}
                    {isStudent ? (
                      <button
                        onClick={(e) => save(e, opp._id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition"
                        title="Save"
                      >
                        <Bookmark size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mt-2.5 group-hover:text-brand-700 transition leading-snug">{opp.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{opp.organization}</p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{opp.description}</p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(opp.skillsRequired || []).slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] font-medium bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1 group-hover:border-brand-200 group-hover:text-brand-700 transition"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} /> {opp.mode} · {opp.location}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Clock size={14} /> {relativeDay(opp.deadline)}
                  </span>
                </div>

                {isStudent && (opp.prize || opp.stipend) ? (
                  <p className="text-xs font-semibold text-emerald-600 mt-2">
                    {opp.stipend ? `💸 ${opp.stipend}` : ''} {opp.prize ? `🏆 ${opp.prize}` : ''}
                  </p>
                ) : null}

                {isStudent ? (
                  <button onClick={(e) => apply(e, opp._id)} className="btn-primary w-full mt-3 !py-2 text-xs">
                    <Send size={15} /> Apply
                  </button>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search, Sparkles, Bookmark, Send, MapPin, Clock, ExternalLink, Filter, ChevronDown, Loader2, Building2 } from 'lucide-react';
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
  ['source', 'By source'],
];
const PAID_OPTIONS = [
  ['all', 'Any'],
  ['paid', '💰 Paid'],
  ['free', '🆓 Free'],
];

export default function Opportunities() {
  const { isStudent, profileVersion } = useAuth();
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [paid, setPaid] = useState('all');
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('match');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInfo, setAiInfo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Infinite scroll state
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Source list for filter dropdown
  const [sourceList, setSourceList] = useState([]);
  const prevProfileVersion = useRef(profileVersion);

  // Fetch opportunities with cursor-based pagination
  const fetchOpportunities = useCallback(async (cursor = null, reset = false) => {
    if (reset) {
      setLoading(true);
      setOpportunities([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = { sort, limit: 20 };
      if (category !== 'all') params.category = category;
      if (mode !== 'all') params.mode = mode;
      if (paid !== 'paid' && paid !== 'free') params.paid = paid;
      if (source !== 'all') params.institution = source;
      if (search) params.search = search;
      if (cursor) params.cursor = cursor;

      const data = await api.get('/opportunities', params);

      if (aiResults !== null) return; // Don't update if AI search is active

      const newOpps = data.opportunities || [];
      if (reset) {
        setOpportunities(newOpps);
      } else {
        setOpportunities((prev) => [...prev, ...newOpps]);
      }
      setTotalCount(data.total || 0);
      setHasMore(data.hasMore || false);
      setNextCursor(data.nextCursor || null);
    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, mode, paid, source, search, sort, aiResults]);

  // Initial load and filter changes
  useEffect(() => {
    fetchOpportunities(null, true);
  }, [fetchOpportunities]);

  // Fetch source list
  useEffect(() => {
    api.get('/opportunities/sources').then((data) => {
      setSourceList(data.sources || []);
    }).catch(() => {});
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && aiResults === null) {
          fetchOpportunities(nextCursor, false);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [hasMore, loadingMore, loading, nextCursor, fetchOpportunities, aiResults]);

  // Clear stale AI search results whenever profile changes
  useEffect(() => {
    if (profileVersion !== prevProfileVersion.current) {
      prevProfileVersion.current = profileVersion;
      setAiResults(null);
      setAiInfo('');
    }
  }, [profileVersion]);

  const save = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    await api.post(`/opportunities/${id}/save`);
    // Refresh the list
    fetchOpportunities(null, true);
  };

  const apply = async (e, id, opp) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.post(`/opportunities/${id}/apply`);
      // Always try to open the original source URL
      const url = res.applyUrl || opp?.applyUrl || opp?.applyLink || opp?.sourceUrl || '';
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Silently handle
    }
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

  const clearAiSearch = () => {
    setAiResults(null);
    setAiInfo('');
    setAiQuery('');
  };

  const list = aiResults !== null ? aiResults : opportunities;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Opportunities</h1>
          <p className="page-subtitle">
            {totalCount > 0 ? `${totalCount}+ opportunities from IITs, NITs, IIITs & more — ranked by how well they match you.` : 'Internships, hackathons, jobs and more — ranked by how well they match you.'}
          </p>
        </div>
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
        {aiResults !== null && (
          <button type="button" onClick={clearAiSearch} className="btn-secondary shrink-0">
            ✕ Clear
          </button>
        )}
      </form>
      {aiInfo ? <p className="text-xs text-slate-500 -mt-2">{aiInfo}</p> : null}

      {/* Category filters */}
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${showFilters ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-white/60 border border-white/60 text-slate-600 hover:border-brand-300'}`}
          >
            <Filter size={14} /> Filters
          </button>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="input !w-auto !py-1.5 text-xs capitalize">
            {MODES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !w-auto !py-1.5 text-xs">
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-4 animate-fade-in space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Source filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Institution / Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="input text-xs">
                <option value="all">All Sources</option>
                {sourceList.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({s.count})</option>
                ))}
              </select>
            </div>
            {/* Paid/Free filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Stipend</label>
              <select value={paid} onChange={(e) => setPaid(e.target.value)} className="input text-xs">
                {PAID_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {/* Search */}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, company, skill…" className="input pl-9 text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search box (always visible) */}
      {!showFilters && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, company, skill…" className="input pl-10" />
        </div>
      )}

      {/* Results count */}
      {totalCount > 0 && !loading && (
        <p className="text-xs text-slate-400">
          Showing {list.length} of {totalCount}+ opportunities
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {/* Loading skeletons */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
                <div className="h-5 w-24 bg-slate-200 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-slate-200 rounded mt-3" />
              <div className="h-4 w-1/2 bg-slate-100 rounded mt-2" />
              <div className="h-4 w-full bg-slate-100 rounded mt-3" />
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title="No opportunities found" message="Try widening your filters or use AI search with different words." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((item, index) => {
              const opp = item.opportunity || item;
              const score = item.score;
              const eligibility = item.eligibility;
              const isFetched = opp.source?.startsWith('fetched:');
              const directUrl = opp.applyUrl || opp.applyLink || opp.sourceUrl;

              return (
                <Link
                  key={opp._id || opp.id || `opp-${index}`}
                  to={`/opportunities/${opp._id || opp.id}`}
                  className="card card-hover group p-5 hover:border-brand-200"
                >
                  {/* Top row: category + match badge + source */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={categoryColor(opp.category)}>{opp.category}</Badge>
                      {isFetched && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5">
                          <Building2 size={10} /> {opp.organization}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {score !== undefined && isStudent ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          score >= 80 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          score >= 60 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          score >= 40 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          🎯 {Math.round(score)}% Match
                        </span>
                      ) : null}
                      {isStudent ? (
                        <button
                          onClick={(e) => save(e, opp._id || opp.id)}
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

                  {/* Eligibility info row */}
                  {isStudent && eligibility ? (
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        eligibility.status === 'eligible' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        eligibility.status === 'partially_eligible' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {eligibility.status === 'eligible' ? '🟢 Eligible' :
                         eligibility.status === 'partially_eligible' ? '🟡 Partially eligible' :
                         '🔴 Not eligible'}
                      </span>
                    </div>
                  ) : null}

                  {/* Degree + year restrictions */}
                  {isStudent && (opp.degreeRestrictions?.length > 0 || (opp.yearMin || opp.yearMax)) ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500">
                      {opp.degreeRestrictions?.length > 0 ? (
                        <span>{opp.degreeRestrictions.join(' · ')}</span>
                      ) : null}
                      {opp.yearMin || opp.yearMax ? (
                        <span>Year {opp.yearMin || 1}–{opp.yearMax || 4}</span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(opp.skillsRequired || []).slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-medium bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-600 rounded-full px-2.5 py-1 group-hover:border-brand-200 group-hover:text-brand-700 transition"
                      >
                        {s}
                      </span>
                    ))}
                    {(opp.skillsRequired || []).length > 3 ? (
                      <span className="text-[11px] text-slate-400">+{opp.skillsRequired.length - 3} more</span>
                    ) : null}
                  </div>

                  {/* Bottom row: location + deadline + stipend/prize */}
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

                  {/* Source link for fetched opportunities */}
                  {isFetched && directUrl ? (
                    <p className="text-[11px] text-blue-500 mt-2 flex items-center gap-1">
                      <ExternalLink size={11} /> View on original source →
                    </p>
                  ) : null}

                  {/* Action buttons */}
                  {isStudent ? (
                    <div className="flex gap-2 mt-3">
                      {isFetched && directUrl ? (
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            apply(e, opp._id || opp.id, opp);
                          }}
                          className="btn-primary flex-1 !py-2 text-xs"
                        >
                          <ExternalLink size={14} /> Apply on Source
                        </a>
                      ) : (
                        <button onClick={(e) => apply(e, opp._id || opp.id, opp)} className="btn-primary flex-1 !py-2 text-xs">
                          <Send size={14} /> Apply
                        </button>
                      )}
                      <button onClick={(e) => save(e, opp._id || opp.id)} className="btn-secondary !py-2 text-xs">
                        <Bookmark size={14} /> Save
                      </button>
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="flex justify-center py-6">
            {loadingMore && (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading more opportunities…</span>
              </div>
            )}
            {!hasMore && list.length > 0 && (
              <p className="text-sm text-slate-400">✨ You've seen all {totalCount} opportunities</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

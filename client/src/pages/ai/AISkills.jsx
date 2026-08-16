import { useState } from 'react';
import { Sparkles, Lightbulb, Rocket, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, Card, Badge, ErrorBanner } from '../../components/UI';
import { useAsync } from '../../components/UI';

export default function AISkills() {
  const { data, loading } = useAsync(() => api.get('/students/me/profile'));
  const [roadmap, setRoadmap] = useState(null);
  const [gap, setGap] = useState(null);
  const [projects, setProjects] = useState(null);
  const [insights, setInsights] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [openSection, setOpenSection] = useState('roadmap');

  if (loading) return <PageLoader />;

  const profile = data;
  const careerGoal = profile?.careerGoal;

  const run = async (kind) => {
    setError('');
    setBusy(kind);
    try {
      if (kind === 'roadmap') {
        const res = await api.post('/ai/roadmap', {});
        setRoadmap(res.roadmap);
      } else if (kind === 'gap') {
        const res = await api.post('/ai/skill-gap', {});
        setGap(res);
      } else if (kind === 'projects') {
        const res = await api.post('/ai/projects', {});
        setProjects(res.projects);
      } else if (kind === 'insights') {
        const res = await api.post('/ai/profile-insights', {});
        setInsights(res);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (!careerGoal) {
    return (
      <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
        <h1 className="page-title">Skill Roadmap</h1>
        <Card className="text-center py-10">
          <Target size={32} className="text-violet-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-800">Set a career goal first</p>
          <p className="text-sm text-slate-500 mt-1">Add your career goal on your profile page, then come back here for AI-powered guidance.</p>
          <a href="/profile" className="btn-primary mt-4">
            Go to profile
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">AI Skill Development</h1>
        <p className="page-subtitle">
          Roadmap toward <span className="font-semibold text-slate-700">{careerGoal}</span> — generated for your current skills.
        </p>
      </div>

      <ErrorBanner error={error} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GenerateCard
          icon={Rocket}
          tone="violet"
          title="Generate roadmap"
          desc="Step-by-step path from your current skills to your goal"
          busy={busy === 'roadmap'}
          onClick={() => run('roadmap')}
          active={openSection === 'roadmap'}
          onToggle={() => setOpenSection(openSection === 'roadmap' ? '' : 'roadmap')}
        />
        <GenerateCard
          icon={Target}
          tone="brand"
          title="Skill gap analysis"
          desc="What's missing between you and your target roles"
          busy={busy === 'gap'}
          onClick={() => run('gap')}
          active={openSection === 'gap'}
          onToggle={() => setOpenSection(openSection === 'gap' ? '' : 'gap')}
        />
        <GenerateCard
          icon={Lightbulb}
          tone="emerald"
          title="Project ideas"
          desc="Portfolio projects tailored to your skills and goal"
          busy={busy === 'projects'}
          onClick={() => run('projects')}
          active={openSection === 'projects'}
          onToggle={() => setOpenSection(openSection === 'projects' ? '' : 'projects')}
        />
      </div>

      {/* Roadmap */}
      {openSection === 'roadmap' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Rocket size={18} className="text-violet-600" /> Your roadmap
            </h3>
            {!roadmap ? (
              <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => run('roadmap')} disabled={busy === 'roadmap'}>
                <Sparkles size={13} /> {busy === 'roadmap' ? 'Generating…' : 'Generate'}
              </button>
            ) : null}
          </div>
          {roadmap ? (
            <div className="relative">
              <div className="absolute left-[13px] top-3 bottom-3 w-px bg-slate-200" />
              <div className="space-y-3">
                {roadmap.map((r, i) => (
                  <div key={i} className="flex gap-3">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border-2 z-10 ${
                        r.status === 'Completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : r.status === 'Learning'
                            ? 'bg-amber-100 border-amber-300 text-amber-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 rounded-xl border border-slate-100 px-4 py-2.5 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{r.skill}</p>
                      <Badge
                        className={
                          r.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'Learning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Generate your roadmap to see the steps.</p>
          )}
        </Card>
      ) : null}

      {/* Gap analysis */}
      {openSection === 'gap' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Target size={18} className="text-brand-600" /> Skill gaps
            </h3>
            {!gap ? (
              <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => run('gap')} disabled={busy === 'gap'}>
                <Sparkles size={13} /> {busy === 'gap' ? 'Analyzing…' : 'Analyze'}
              </button>
            ) : null}
          </div>
          {gap ? (
            <div className="space-y-3">
              {gap.missingSkills?.length ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Skills to learn</p>
                  <div className="flex flex-wrap gap-2">
                    {gap.missingSkills.map((s) => (
                      <span key={s} className="text-xs bg-red-50 text-red-700 border border-red-100 rounded-lg px-2.5 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {gap.summary ? <p className="text-sm text-slate-600 leading-relaxed">{gap.summary}</p> : null}
              {gap.recommendations?.length ? (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Recommendations</p>
                  <ul className="space-y-1.5">
                    {gap.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-brand-500 mt-0.5">→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Analyze the gap between your skills and your goal.</p>
          )}
        </Card>
      ) : null}

      {/* Projects */}
      {openSection === 'projects' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Lightbulb size={18} className="text-emerald-600" /> Project ideas
            </h3>
            {!projects ? (
              <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => run('projects')} disabled={busy === 'projects'}>
                <Sparkles size={13} /> {busy === 'projects' ? 'Generating…' : 'Generate'}
              </button>
            ) : null}
          </div>
          {projects?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:bg-slate-50 transition">
                  <p className="font-medium text-slate-800 text-sm">{p.title}</p>
                  {p.description ? <p className="text-xs text-slate-500 mt-1 line-clamp-3">{p.description}</p> : null}
                  {p.skills?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.skills.map((s) => (
                        <span key={s} className="skill-chip border-brand-200 bg-brand-50/50 text-brand-700 hover:border-brand-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Generate project ideas to build your portfolio.</p>
          )}
        </Card>
      ) : null}

      {/* Profile insights */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles size={18} className="text-violet-600" /> Profile insights
          </h3>
          <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => run('insights')} disabled={busy === 'insights'}>
            <Sparkles size={13} /> {busy === 'insights' ? 'Analyzing…' : insights ? 'Re-run' : 'Analyze profile'}
          </button>
        </div>
        {insights ? (
          <div className="space-y-3">
            {insights.strengths?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {insights.strengths.map((s) => (
                    <span key={s} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2.5 py-1">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {insights.weaknesses?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Areas to improve</p>
                <div className="flex flex-wrap gap-2">
                  {insights.weaknesses.map((s) => (
                    <span key={s} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-2.5 py-1">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {insights.summary ? <p className="text-sm text-slate-600 leading-relaxed">{insights.summary}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Get an AI review of your profile's strengths and weaknesses.</p>
        )}
      </Card>
    </div>
  );
}

function GenerateCard({ icon: Icon, tone, title, desc, busy, onClick, active, onToggle }) {
  const tones = {
    violet: 'bg-violet-100 text-violet-600',
    brand: 'bg-brand-100 text-brand-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <Card className={`cursor-pointer transition ${active ? 'ring-2 ring-brand-500' : 'hover:shadow-lift'}`} onClick={onToggle}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
        {active ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </div>
      <p className="font-semibold text-slate-800 mt-3">{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
      <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="btn-primary w-full mt-3 !py-2 text-xs" disabled={busy}>
        <Sparkles size={13} /> {busy ? 'Working…' : active ? 'Generate now' : 'Open'}
      </button>
    </Card>
  );
}

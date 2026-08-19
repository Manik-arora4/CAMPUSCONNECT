import { useState, useEffect } from 'react';
import { Sparkles, Save, UserCircle2, GraduationCap, MapPin, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Field, Badge, ErrorBanner } from '../components/UI';
import { useAsync } from '../components/UI';
import PulsatingButton from '../components/PulsatingButton';
import { useAuth } from '../context/AuthContext';

const DEGREES = ['BCA', 'B.Tech', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MCA', 'M.Tech', 'MBA', 'M.Sc', 'MA', 'M.Com', 'PhD', 'Other'];
const SKILLS = ['Python', 'JavaScript', 'Java', 'C', 'C++', 'SQL', 'React', 'Node.js', 'Machine Learning', 'AI', 'Data Science', 'HTML', 'CSS', 'Flutter', 'UI/UX', 'Cloud', 'Docker', 'Cybersecurity'];
const INTERESTS = ['AI/ML', 'Web Development', 'Data Science', 'Cybersecurity', 'Mobile Development', 'Cloud', 'Blockchain', 'UI/UX Design', 'Competitive Programming', 'Robotics'];
const OPP_TYPES = ['internship', 'hackathon', 'training', 'scholarship', 'job', 'workshop', 'competition', 'fellowship', 'research', 'conference'];
const ROADMAP_STATUS = ['Not Started', 'Learning', 'Completed'];

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/students/me/profile'));
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) {
      setForm({
        degree: data.degree || '',
        course: data.course || '',
        semester: data.semester || 1,
        year: data.year || Math.ceil((data.semester || 1) / 2),
        section: data.section || '',
        enrollmentNumber: data.enrollmentNumber || '',
        bio: data.bio || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || '',
        careerGoal: data.careerGoal || '',
        preferredLocation: data.preferredLocation || '',
        remotePreference: data.remotePreference || 'remote',
        weeklyLearningHours: data.weeklyLearningHours || 10,
        skills: data.skills?.map((s) => s.name) || [],
        interests: data.interests || [],
        preferredOpportunityTypes: data.preferredOpportunityTypes || [],
        experienceYears: data.experienceYears || 0,
      });
    }
  }, [data]);

  if (loading || !form) return <PageLoader />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (key, value) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        ...form,
        skills: form.skills.map((name) => ({ name, level: 'Intermediate' })),
        completeOnboarding: true,
      };
      await api.patch('/students/me/profile', payload);
      await refreshMe();
      setSaved(true);
      reload();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Your profile</h1>
        <p className="page-subtitle">A complete profile unlocks match scores, AI recommendations and smarter planning.</p>
      </div>

      {!user?.onboarded ? (
        <Card className="bg-gradient-to-r from-brand-600 to-violet-700 border-0 text-white">
          <p className="font-semibold flex items-center gap-2">
            <Sparkles size={18} /> Almost there!
          </p>
          <p className="text-sm text-brand-100 mt-1">Fill in your details below and save — your AI assistant will start working for you instantly.</p>
        </Card>
      ) : null}

      <ErrorBanner error={error} />

      <form onSubmit={submit} className="space-y-5">
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UserCircle2 size={18} className="text-brand-600" /> Basic details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Degree">
              <select className="input" value={form.degree} onChange={set('degree')}>
                <option value="">Select degree</option>
                {DEGREES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Course / Branch">
              <input className="input" value={form.course} onChange={set('course')} placeholder="e.g. Computer Science" />
            </Field>
            <Field label="Year">
              <select className="input" value={form.year} onChange={set('year')}>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </Field>
            <Field label="Semester">
              <select className="input" value={form.semester} onChange={set('semester')}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Enrollment number">
              <input className="input" value={form.enrollmentNumber} onChange={set('enrollmentNumber')} placeholder="BCA2025-042" />
            </Field>
            <Field label="LinkedIn">
              <input className="input" value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="GitHub">
              <input className="input" value={form.github} onChange={set('github')} placeholder="https://github.com/…" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Short bio">
              <textarea className="input min-h-[80px]" value={form.bio} onChange={set('bio')} placeholder="Tell us about yourself…" />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-violet-600" /> Career & interests
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Career goal">
              <input className="input" value={form.careerGoal} onChange={set('careerGoal')} placeholder="e.g. AI Engineer" />
            </Field>
            <Field label="Preferred location">
              <input className="input" value={form.preferredLocation} onChange={set('preferredLocation')} placeholder="e.g. Pune" />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Field label="Work mode">
              <select className="input" value={form.remotePreference} onChange={set('remotePreference')}>
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Weekly learning hours">
              <input type="number" min="0" max="80" className="input" value={form.weeklyLearningHours} onChange={set('weeklyLearningHours')} />
            </Field>
          </div>

          <div className="mt-5">
            <p className="label">Skills</p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle('skills', s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    form.skills.includes(s) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="label">Interests</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle('interests', s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    form.interests.includes(s) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="label">Opportunity types you're interested in</p>
            <div className="flex flex-wrap gap-2">
              {OPP_TYPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle('preferredOpportunityTypes', s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                    form.preferredOpportunityTypes.includes(s) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Roadmap */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" /> Learning roadmap
          </h3>
          <p className="text-sm text-slate-500 mb-4">Generated by AI, editable by you. Update the status as you progress.</p>
          {data?.roadmap?.length ? (
            <div className="space-y-2.5">
              {data.roadmap.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5">
                  <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="text-sm font-medium text-slate-800 flex-1">{r.skill}</p>
                  <select
                    className="input !w-auto !py-1.5 text-xs"
                    value={r.status}
                    onChange={(e) => {
                      const roadmap = [...data.roadmap];
                      roadmap[i] = { ...r, status: e.target.value };
                      api.patch('/students/me/profile', { roadmap });
                      reload();
                    }}
                  >
                    {ROADMAP_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Generate a roadmap on the <span className="font-medium text-slate-600">AI Skill Roadmap</span> page, then track it here.
            </p>
          )}
        </Card>

        <div className="flex items-center gap-3">
          <PulsatingButton type="submit" className="!px-6" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving…' : 'Save profile'}
          </PulsatingButton>
          {saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 size={16} /> Saved!
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

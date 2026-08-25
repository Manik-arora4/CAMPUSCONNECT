import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, User, Mail, Lock, School, BookOpen, Building2, Briefcase, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/UI';
import InteractiveHoverButton from '../components/InteractiveHoverButton';

const INPUT_CLS =
  'w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 focus:shadow-glow-sm transition';

const SELECT_CLS =
  'w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition [&>option]:text-slate-900';

const ROLES = [
  { role: 'student', label: 'Student', icon: GraduationCap, emoji: '🎓', color: 'from-brand-500 to-violet-600', desc: 'Access timetable, assignments, opportunities & AI tools' },
  { role: 'faculty', label: 'Faculty', icon: BookOpen, emoji: '👨‍🏫', color: 'from-violet-500 to-purple-600', desc: 'Manage classes, assignments, notices & resources' },
  { role: 'admin', label: 'College Admin', icon: ShieldCheck, emoji: '🛡️', color: 'from-emerald-500 to-teal-600', desc: 'Manage students, faculty, departments & analytics' },
];

const DEGREES = ['BCA', 'B.Tech', 'BBA', 'B.Sc', 'B.Com', 'BA', 'MCA', 'M.Tech', 'MBA', 'M.Sc', 'MA', 'M.Com', 'PhD', 'Other'];
const SKILLS = ['Python', 'JavaScript', 'Java', 'C', 'C++', 'SQL', 'React', 'Node.js', 'Machine Learning', 'AI', 'Data Science', 'HTML', 'CSS', 'Flutter', 'UI/UX', 'Cloud', 'Docker', 'Cybersecurity'];
const INTERESTS = ['AI/ML', 'Web Development', 'Data Science', 'Cybersecurity', 'Mobile Development', 'Cloud', 'Blockchain', 'UI/UX Design', 'Competitive Programming', 'Robotics'];
const CAREER_GOALS = ['AI Engineer', 'Software Developer', 'Data Scientist', 'Cybersecurity Engineer', 'Product Manager', 'Entrepreneur', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Mobile Developer', 'UI/UX Designer', 'Cloud Engineer', 'DevOps Engineer', 'Machine Learning Engineer'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = role, 1 = account, 2 = details
  const [role, setRole] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', college: '',
    // Student
    degree: '', course: '', semester: 1, year: 1, section: '',
    skills: [], interests: [], careerGoal: '',
    // Faculty
    employeeId: '', department: '', designation: '', subjects: [], classes: [],
    // Admin
    inviteCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleArray = (key, value) =>
    setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));

  const selectRole = (r) => {
    setRole(r);
    setStep(1);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, role };
      const data = await register(payload);
      if (role === 'student') navigate('/profile', { replace: true });
      else navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const maxSteps = role === 'admin' ? 2 : role === 'faculty' ? 2 : 3;

  return (
    <div
      className="min-h-screen flex bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 animate-gradient-pan"
      style={{ backgroundSize: '160% 160%' }}
    >
      {/* Aurora orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-violet-600/30 blur-3xl animate-float" />
        <div className="absolute top-1/4 -right-40 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/25 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-brand-500/25 blur-3xl animate-float" style={{ animationDelay: '2.5s' }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-lg relative">
          <div className="flex items-center gap-2.5 justify-center mb-8 animate-fade-up">
            <img
              src="/campusconnect-logo.png"
              alt="CampusConnect"
              className="h-10 w-10 rounded-xl object-cover border border-white/20"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 items-center justify-center hidden">
              <GraduationCap size={22} className="text-white icon-glow" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight drop-shadow">CAMPUSCONNECT</span>
          </div>

          <div className="rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] p-8 animate-scale-in relative">
            {/* Step progress */}
            {step > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => { setStep(step > 1 ? step - 1 : 0); setError(''); }} className="text-white/60 hover:text-white transition">
                  <ArrowLeft size={16} />
                </button>
                <div className="flex gap-1.5 flex-1">
                  {Array.from({ length: maxSteps }, (_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${step >= i + 1 ? 'bg-white' : 'bg-white/20'}`} />
                  ))}
                </div>
                <span className="text-xs text-white/50">Step {step}/{maxSteps}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm px-4 py-3 mb-4 animate-fade-in backdrop-blur">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 0: Who are you? */}
            {step === 0 && (
              <div className="animate-fade-up">
                <h2 className="text-2xl font-bold text-white drop-shadow text-center">Who are you?</h2>
                <p className="text-sm text-white/70 mt-1 mb-6 text-center">Select your role to get started</p>
                <div className="space-y-3">
                  {ROLES.map(({ role: r, label, icon: Icon, emoji, color, desc }) => (
                    <button
                      key={r}
                      onClick={() => selectRole(r)}
                      className="w-full flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-white/15 hover:border-white/30 hover:shadow-glow-sm group"
                    >
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm">{emoji} {label}</p>
                        <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                      </div>
                      <ArrowRight size={16} className="text-white/30 group-hover:text-white/70 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: Account details */}
            {step === 1 && (
              <div className="animate-fade-up">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{ROLES.find((r) => r.role === role)?.emoji}</span>
                  <h2 className="text-2xl font-bold text-white drop-shadow">Create {role} account</h2>
                </div>
                <p className="text-sm text-white/70 mt-1 mb-6">Set up your login credentials</p>

                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Full name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input required value={form.name} onChange={set('name')} placeholder="Aarav Sharma" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input type="email" required value={form.email} onChange={set('email')} placeholder="you@college.edu" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">College</label>
                    <div className="relative">
                      <School size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input value={form.college} onChange={set('college')} placeholder="e.g. IIIT Ropar" className={INPUT_CLS} />
                    </div>
                  </div>
                  <InteractiveHoverButton type="submit" className="w-full py-2.5">
                    Continue →
                  </InteractiveHoverButton>
                </form>
              </div>
            )}

            {/* STEP 2: Admin account + invite code */}
            {step === 2 && role === 'admin' && (
              <div className="animate-fade-up">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🛡️</span>
                  <h2 className="text-2xl font-bold text-white drop-shadow">Admin details</h2>
                </div>
                <p className="text-sm text-white/70 mt-1 mb-6">Enter your admin invite code to proceed</p>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Admin Invite Code</label>
                    <div className="relative">
                      <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input required value={form.inviteCode} onChange={set('inviteCode')} placeholder="Enter your admin invite code" className={INPUT_CLS} />
                    </div>
                    <p className="text-xs text-white/40 mt-1">Admin registration requires an authorized invite code</p>
                  </div>

                  <p className="text-xs text-white/40">Your account will be reviewed before activation.</p>

                  <InteractiveHoverButton type="submit" disabled={loading} className="w-full py-2.5">
                    {loading ? <Spinner size={18} /> : 'Submit for approval'}
                  </InteractiveHoverButton>
                </form>
              </div>
            )}

            {/* STEP 2: Student academic details */}
            {step === 2 && role === 'student' && (
              <div className="animate-fade-up">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🎓</span>
                  <h2 className="text-2xl font-bold text-white drop-shadow">Student details</h2>
                </div>
                <p className="text-sm text-white/70 mt-1 mb-6">Tell us about your academic background</p>

                <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Degree</label>
                      <select value={form.degree} onChange={set('degree')} className={SELECT_CLS} required>
                        <option value="">Select degree</option>
                        {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Course / Branch</label>
                      <input value={form.course} onChange={set('course')} placeholder="e.g. Computer Science" className={INPUT_CLS.replace('pl-10', 'px-3.5')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Year</label>
                      <select value={form.year} onChange={set('year')} className={SELECT_CLS}>
                        {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Semester</label>
                      <select value={form.semester} onChange={set('semester')} className={SELECT_CLS}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Section</label>
                      <input value={form.section} onChange={set('section')} placeholder="A / B" className={INPUT_CLS.replace('pl-10', 'px-3.5')} />
                    </div>
                  </div>

                  <InteractiveHoverButton type="submit" className="w-full py-2.5">
                    Continue →
                  </InteractiveHoverButton>
                </form>
              </div>
            )}

            {/* STEP 2: Faculty details */}
            {step === 2 && role === 'faculty' && (
              <div className="animate-fade-up">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">👨‍🏫</span>
                  <h2 className="text-2xl font-bold text-white drop-shadow">Faculty details</h2>
                </div>
                <p className="text-sm text-white/70 mt-1 mb-6">Set up your faculty profile</p>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Employee ID</label>
                      <input value={form.employeeId} onChange={set('employeeId')} placeholder="EMP-2026-001" className={INPUT_CLS.replace('pl-10', 'px-3.5')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1.5">Department</label>
                      <input value={form.department} onChange={set('department')} placeholder="e.g. Computer Science" className={INPUT_CLS.replace('pl-10', 'px-3.5')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Designation</label>
                    <select value={form.designation} onChange={set('designation')} className={SELECT_CLS}>
                      <option value="">Select designation</option>
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Lab Assistant">Lab Assistant</option>
                      <option value="HOD">Head of Department</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Subjects you teach</label>
                    <div className="relative">
                      <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input value={form.subjects.join(', ')} onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="e.g. Data Structures, OS, DBMS (comma-separated)" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Classes you handle</label>
                    <div className="relative">
                      <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
                      <input value={form.classes.join(', ')} onChange={(e) => setForm((f) => ({ ...f, classes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="e.g. BCA-1, BCA-2, B.Tech-3 (comma-separated)" className={INPUT_CLS} />
                    </div>
                  </div>

                  <p className="text-xs text-white/40 mt-1">Your account will be reviewed by a college admin before activation.</p>

                  <InteractiveHoverButton type="submit" disabled={loading} className="w-full py-2.5">
                    {loading ? <Spinner size={18} /> : 'Submit for approval'}
                  </InteractiveHoverButton>
                </form>
              </div>
            )}

            {/* STEP 3: Student skills, interests & career */}
            {step === 3 && role === 'student' && (
              <div className="animate-fade-up">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🎯</span>
                  <h2 className="text-2xl font-bold text-white drop-shadow">Your profile</h2>
                </div>
                <p className="text-sm text-white/70 mt-1 mb-6">Skills, interests and career goals for personalized matching</p>

                <form onSubmit={submit} className="space-y-5">
                  {/* Skills */}
                  <div>
                    <p className="text-sm font-medium text-white/80 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleArray('skills', s)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            form.skills.includes(s)
                              ? 'bg-brand-600 text-white border border-brand-500'
                              : 'bg-white/10 text-white/70 border border-white/15 hover:bg-white/20'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interests */}
                  <div>
                    <p className="text-sm font-medium text-white/80 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleArray('interests', s)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            form.interests.includes(s)
                              ? 'bg-violet-600 text-white border border-violet-500'
                              : 'bg-white/10 text-white/70 border border-white/15 hover:bg-white/20'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Career Goal */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Career goal</label>
                    <select value={form.careerGoal} onChange={set('careerGoal')} className={SELECT_CLS}>
                      <option value="">Select career goal</option>
                      {CAREER_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <InteractiveHoverButton type="submit" disabled={loading} className="w-full py-2.5">
                    {loading ? <Spinner size={18} /> : 'Create account & set up profile →'}
                  </InteractiveHoverButton>
                </form>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-white/70 mt-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white hover:text-brand-200 transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

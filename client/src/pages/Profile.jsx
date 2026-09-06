import { useState, useEffect, useRef } from 'react';
import { Sparkles, Save, UserCircle2, GraduationCap, MapPin, CheckCircle2, Camera, BookOpen, Users, Hash, CalendarDays, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader, Card, Field, Badge, ErrorBanner, Avatar } from '../components/UI';
import { useAsync } from '../components/UI';
import PulsatingButton from '../components/PulsatingButton';
import { useAuth } from '../context/AuthContext';
const SKILLS = ['Python', 'JavaScript', 'Java', 'C', 'C++', 'SQL', 'React', 'Node.js', 'Machine Learning', 'AI', 'Data Science', 'HTML', 'CSS', 'Flutter', 'UI/UX', 'Cloud', 'Docker', 'Cybersecurity'];
const INTERESTS = ['AI/ML', 'Web Development', 'Data Science', 'Cybersecurity', 'Mobile Development', 'Cloud', 'Blockchain', 'UI/UX Design', 'Competitive Programming', 'Robotics'];
const OPP_TYPES = ['internship', 'hackathon', 'training', 'scholarship', 'job', 'workshop', 'competition', 'fellowship', 'research', 'conference'];
const ROADMAP_STATUS = ['Not Started', 'Learning', 'Completed'];

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const { data, loading, reload } = useAsync(() => api.get('/students/me/profile'));
  const { data: enrollmentData, reload: reloadEnrollment } = useAsync(() => api.get('/students/me/enrollment'));
  const { data: coursesData } = useAsync(() => api.get('/students/courses'));
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const result = await api.postForm('/users/avatar', formData);
      await refreshMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Your profile</h1>
        <p className="page-subtitle">A complete profile unlocks match scores, AI recommendations and smarter planning.</p>
      </div>

      {/* Profile Picture */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar name={user?.name} size="lg" src={user?.avatar} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              disabled={uploadingAvatar}
            >
              <Camera size={22} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Profile picture</p>
            <p className="text-sm text-slate-500">{uploadingAvatar ? 'Uploading…' : 'Click the photo to upload a new picture'}</p>
          </div>
        </div>
      </Card>

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
        {/* Current Enrollment */}
        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-emerald-600" /> Enrollment
          </h3>
          {enrollmentData?.enrollment ? (
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{enrollmentData.enrollment.courseDetails?.name || 'N/A'}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm text-slate-600">Section {enrollmentData.enrollment.sectionDetails?.name || 'N/A'}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-600">Semester {enrollmentData.enrollment.semester}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-600">Year {enrollmentData.enrollment.year}</span>
                    {enrollmentData.enrollment.enrollmentNumber && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-sm text-slate-600">{enrollmentData.enrollment.enrollmentNumber}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EnrollForm coursesData={coursesData} onEnrolled={() => { reload(); reloadEnrollment(); }} />
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <UserCircle2 size={18} className="text-brand-600" /> Basic details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Degree">
              <select className="input" value={form.degree} onChange={set('degree')}>
                <option value="">Select degree</option>
                {(coursesData?.courses || []).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
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
              <input className="input" value={form.preferredLocation} onChange={set('preferredLocation')} placeholder="e.g. Rupnagar" />
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

function EnrollForm({ coursesData, onEnrolled }) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [semester, setSemester] = useState(1);
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const courses = coursesData?.courses || [];
  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const availableSections = selectedCourseData?.sections?.filter(s => s.semester === Number(semester)) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/students/enroll', {
        courseId: selectedCourse,
        sectionId: selectedSection,
        semester: Number(semester),
        enrollmentNumber,
      });
      onEnrolled();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-6">
        <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No courses available. Contact your admin to add courses.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">Select your course and section to enroll:</p>
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Course">
          <select className="input" value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedSection(''); }} required>
            <option value="">-- Select Course --</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Semester">
          <select className="input" value={semester} onChange={e => { setSemester(e.target.value); setSelectedSection(''); }} required>
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </Field>
        <Field label="Section">
          <select className="input" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} required disabled={!selectedCourse}>
            <option value="">-- Select Section --</option>
            {availableSections.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.enrollmentCount || 0}/{s.maxStudents} enrolled)</option>
            ))}
          </select>
        </Field>
        <Field label="Enrollment Number (optional)">
          <input className="input" value={enrollmentNumber} onChange={e => setEnrollmentNumber(e.target.value)} placeholder="e.g. EN2026001" />
        </Field>
      </div>
      <button type="submit" className="btn-primary" disabled={saving || !selectedCourse || !selectedSection}>
        {saving ? 'Enrolling...' : 'Enroll Now'}
      </button>
    </form>
  );
}

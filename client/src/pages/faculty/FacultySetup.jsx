import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, BookOpen, GraduationCap, MapPin, User, ChevronRight, Check, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Card, Field, ErrorBanner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  { key: 'college', label: 'College', icon: Building2 },
  { key: 'department', label: 'Department', icon: Building2 },
  { key: 'profile', label: 'Profile Details', icon: User },
  { key: 'subjects', label: 'Assigned Subjects', icon: BookOpen },
];

export default function FacultySetup() {
  const navigate = useNavigate();
  const { user, reloadUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Form data
  const [form, setForm] = useState({
    collegeId: user?.college || '',
    departmentId: '',
    employeeId: '',
    designation: '',
    location: '',
    assignedSubjects: [],
    assignedCourses: [],
    assignedSections: [],
  });

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const [collegeRes, profileRes] = await Promise.all([
          api.get('/colleges'),
          api.get('/faculty/me/profile').catch(() => null),
        ]);
        setColleges(collegeRes.colleges || []);

        if (profileRes) {
          setForm(f => ({
            ...f,
            departmentId: profileRes.departmentId || '',
            employeeId: profileRes.employeeId || '',
            designation: profileRes.designation || '',
            location: profileRes.location || '',
            assignedSubjects: profileRes.assignedSubjects || [],
            assignedCourses: profileRes.assignedCourses || [],
            assignedSections: profileRes.assignedSections || [],
          }));

          // If profile is already set up, skip to dashboard
          if (profileRes.employeeId && profileRes.department) {
            navigate('/faculty/dashboard', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [navigate]);

  // Load departments when college changes
  useEffect(() => {
    if (!form.collegeId) return;
    api.get('/admin/departments').then(res => {
      setDepartments(res.departments || []);
    }).catch(() => {});
  }, [form.collegeId]);

  // Load courses when step changes to subjects
  useEffect(() => {
    if (step === 3 && form.collegeId) {
      api.get('/courses').then(res => {
        setCourses(res.courses || []);
      }).catch(() => {});
    }
  }, [step, form.collegeId]);

  // Load subjects when courses change
  useEffect(() => {
    if (step === 3 && form.assignedCourses.length > 0) {
      api.get('/admin/subjects').then(res => {
        const filtered = (res.subjects || []).filter(s =>
          form.assignedCourses.includes(s.course) || !s.course
        );
        setSubjects(filtered);
      }).catch(() => {});
    }
  }, [step, form.assignedCourses]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const toggleSubject = (subjectId) => {
    setForm(f => {
      const current = f.assignedSubjects || [];
      const updated = current.includes(subjectId)
        ? current.filter(id => id !== subjectId)
        : [...current, subjectId];
      return { ...f, assignedSubjects: updated };
    });
  };

  const toggleCourse = (courseId) => {
    setForm(f => {
      const current = f.assignedCourses || [];
      const updated = current.includes(courseId)
        ? current.filter(id => id !== courseId)
        : [...current, courseId];
      return { ...f, assignedCourses: updated };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.collegeId;
      case 1: return !!form.departmentId;
      case 2: return !!form.employeeId && !!form.designation;
      case 3: return form.assignedSubjects.length > 0;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      // Update college on user
      if (form.collegeId && form.collegeId !== user.college) {
        await api.patch('/users/me', { college: form.collegeId });
      }

      // Update faculty profile
      await api.patch('/faculty/me/profile', {
        employeeId: form.employeeId,
        department: departments.find(d => d.id === form.departmentId)?.name || '',
        departmentId: form.departmentId,
        designation: form.designation,
        location: form.location,
        assignedSubjects: form.assignedSubjects,
        assignedCourses: form.assignedCourses,
        assignedSections: form.assignedSections,
      });

      // Mark as onboarded
      await api.patch('/students/me/profile', {}).catch(() => {});
      await reloadUser();
      navigate('/faculty/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Faculty Setup</h1>
          <p className="text-slate-500 mt-1">Set up your profile to start managing classes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isActive ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  isActive ? 'text-brand-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <ErrorBanner error={error} />

        {/* Step Content */}
        <Card className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Select Your College</h2>
              <p className="text-sm text-slate-500">Choose the college you belong to.</p>
              <Field label="College">
                <select className="input" value={form.collegeId} onChange={set('collegeId')}>
                  <option value="">-- Select College --</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              {colleges.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No colleges found. Please ask admin to create a college first.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Select Department</h2>
              <p className="text-sm text-slate-500">Choose your department.</p>
              <Field label="Department">
                <select className="input" value={form.departmentId} onChange={set('departmentId')}>
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              {departments.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No departments found. Please ask admin to create departments first.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Profile Details</h2>
              <p className="text-sm text-slate-500">Enter your professional details.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee/Faculty ID">
                  <input
                    className="input"
                    value={form.employeeId}
                    onChange={set('employeeId')}
                    placeholder="e.g. FAC-001"
                    required
                  />
                </Field>
                <Field label="Designation">
                  <select className="input" value={form.designation} onChange={set('designation')} required>
                    <option value="">-- Select --</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                    <option value="Guest Faculty">Guest Faculty</option>
                  </select>
                </Field>
              </div>
              <Field label="Campus Location (optional)">
                <input
                  className="input"
                  value={form.location}
                  onChange={set('location')}
                  placeholder="e.g. Building A, Room 301"
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">Assign Subjects</h2>
              <p className="text-sm text-slate-500">Select the subjects you teach.</p>

              {/* Courses */}
              {courses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Courses</label>
                  <div className="flex flex-wrap gap-2">
                    {courses.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleCourse(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          form.assignedCourses?.includes(c.id)
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjects */}
              {subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subjects You Teach</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subjects.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg text-left transition-all ${
                          form.assignedSubjects?.includes(s.id)
                            ? 'bg-brand-50 border-2 border-brand-500 text-brand-700'
                            : 'bg-slate-50 border-2 border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: s.color || '#6366f1' }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs opacity-60">{s.code} · Sem {s.semester}</p>
                        </div>
                        {form.assignedSubjects?.includes(s.id) && (
                          <Check className="h-4 w-4 ml-auto text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {courses.length === 0 && subjects.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No courses or subjects available yet. You can skip this step and add them later from the admin panel.
                </p>
              )}

              {form.assignedSubjects.length > 0 && (
                <p className="text-sm text-emerald-600">
                  ✅ {form.assignedSubjects.length} subject(s) selected
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              className="btn-secondary"
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleSubmit}
                disabled={saving || !canProceed()}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Check className="h-4 w-4" /> Complete Setup</>
                )}
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

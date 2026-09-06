import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '';

export default function FacultyAssignment() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    facultyId: '',
    courseId: '',
    sectionId: '',
    semester: 1,
    academicYear: '2025-2026',
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [assignRes, facultyRes, coursesRes] = await Promise.all([
        fetch(`${API}/api/faculty-assignment`, { headers }),
        fetch(`${API}/api/faculty-assignment/faculty-list`, { headers }),
        fetch(`${API}/api/courses`, { headers }),
      ]);

      if (assignRes.ok) {
        const data = await assignRes.json();
        setAssignments(data.assignments || []);
      }
      if (facultyRes.ok) {
        const data = await facultyRes.json();
        setFaculty(data.faculty || []);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Load sections when course changes
  useEffect(() => {
    if (!form.courseId) { setSections([]); return; }
    fetch(`${API}/api/courses/${form.courseId}`, { headers })
      .then(r => r.json())
      .then(data => setSections(data.sections || []))
      .catch(() => setSections([]));
  }, [form.courseId]);

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.facultyId || !form.courseId) {
      setError('Select faculty and course');
      return;
    }

    try {
      const res = await fetch(`${API}/api/faculty-assignment`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign');

      setSuccess('Faculty assigned successfully!');
      setShowForm(false);
      setForm({ facultyId: '', courseId: '', sectionId: '', semester: 1, academicYear: '2025-2026' });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    if (!confirm('Remove this assignment?')) return;
    try {
      const res = await fetch(`${API}/api/faculty-assignment/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Assignment removed');
        loadData();
      }
    } catch (err) {
      setError('Failed to remove');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Assignment</h1>
          <p className="text-gray-500 mt-1">Assign faculty to courses and sections</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {showForm ? '✕ Cancel' : '+ New Assignment'}
        </button>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{success}</div>}

      {/* Assignment Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Assign Faculty</h2>
          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faculty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Faculty *</label>
              <select
                value={form.facultyId}
                onChange={e => setForm({ ...form, facultyId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Faculty</option>
                {faculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select
                value={form.courseId}
                onChange={e => setForm({ ...form, courseId: e.target.value, sectionId: '' })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section (optional)</label>
              <select
                value={form.sectionId}
                onChange={e => setForm({ ...form, sectionId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Sections</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>Sem {s.semester} - {s.name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
              <select
                value={form.semester}
                onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={form.academicYear}
                onChange={e => setForm({ ...form, academicYear: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Assign Faculty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Current Assignments ({assignments.length})</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-3">📋</p>
            <p>No faculty assignments yet</p>
            <p className="text-sm mt-1">Click "New Assignment" to assign faculty to courses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{a.facultyDetails?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{a.facultyDetails?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{a.courseDetails?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{a.courseDetails?.code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {a.sectionDetails ? `${a.sectionDetails.name}` : 'All Sections'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">Sem {a.semester}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{a.academicYear}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemove(a.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

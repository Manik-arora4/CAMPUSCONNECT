import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import { LoadingScreen } from './components/UI';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Tasks from './pages/Tasks';
import Exams from './pages/Exams';
import Notices from './pages/Notices';
import College from './pages/College';
import Events from './pages/Events';
import Clubs from './pages/Clubs';
import Opportunities from './pages/Opportunities';
import OpportunityDetail from './pages/OpportunityDetail';
import Applications from './pages/Applications';
import Resumes from './pages/Resumes';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Account from './pages/Account';
import NotificationsPage from './pages/Notifications';

import AIChat from './pages/ai/AIChat';
import AIPlanner from './pages/ai/AIPlanner';
import AISkills from './pages/ai/AISkills';

import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyAssignments from './pages/faculty/FacultyAssignments';
import AdminOverview from './pages/admin/AdminOverview';
import AdminStudents from './pages/admin/AdminStudents';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminOpportunities from './pages/admin/AdminOpportunities';
import AdminColleges from './pages/admin/AdminColleges';
import AdminSupport from './pages/admin/AdminSupport';
import Support from './pages/Support';
import SupportTicketDetail from './pages/SupportTicketDetail';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Loading your campus…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleGate({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'student' ? '/dashboard' : user.role === 'faculty' ? '/faculty' : '/admin'} replace />;
  return children;
}

function AppLayout() {
  return (
    <Protected>
      <Layout />
    </Protected>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app shell */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/account" element={<Account />} />

        {/* Student */}
        <Route path="/dashboard" element={<RoleGate role="student"><Dashboard /></RoleGate>} />
        <Route path="/timetable" element={<RoleGate role="student"><Timetable /></RoleGate>} />
        <Route path="/attendance" element={<RoleGate role="student"><Attendance /></RoleGate>} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/tasks" element={<RoleGate role="student"><Tasks /></RoleGate>} />
        <Route path="/exams" element={<RoleGate role="student"><Exams /></RoleGate>} />
        <Route path="/college" element={<Notices />} />
        <Route path="/college-info" element={<College />} />
        <Route path="/events" element={<RoleGate role="student"><Events /></RoleGate>} />
        <Route path="/clubs" element={<RoleGate role="student"><Clubs /></RoleGate>} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/applications" element={<RoleGate role="student"><Applications /></RoleGate>} />
        <Route path="/resumes" element={<RoleGate role="student"><Resumes /></RoleGate>} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/tickets/:id" element={<SupportTicketDetail />} />
        <Route path="/profile" element={<RoleGate role="student"><Profile /></RoleGate>} />

        {/* AI */}
        <Route path="/ai/chat" element={<RoleGate role="student"><AIChat /></RoleGate>} />
        <Route path="/ai/planner" element={<RoleGate role="student"><AIPlanner /></RoleGate>} />
        <Route path="/ai/skills" element={<RoleGate role="student"><AISkills /></RoleGate>} />

        {/* Faculty */}
        <Route path="/faculty" element={<RoleGate role="faculty"><FacultyDashboard /></RoleGate>} />
        <Route path="/faculty/assignments" element={<RoleGate role="faculty"><FacultyAssignments /></RoleGate>} />

        {/* Admin */}
        <Route path="/admin" element={<RoleGate role="admin"><AdminOverview /></RoleGate>} />
        <Route path="/admin/students" element={<RoleGate role="admin"><AdminStudents /></RoleGate>} />
        <Route path="/admin/faculty" element={<RoleGate role="admin"><AdminFaculty /></RoleGate>} />
        <Route path="/admin/opportunities" element={<RoleGate role="admin"><AdminOpportunities /></RoleGate>} />
        <Route path="/admin/colleges" element={<RoleGate role="admin"><AdminColleges /></RoleGate>} />
        <Route path="/admin/support" element={<RoleGate role="admin"><AdminSupport /></RoleGate>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

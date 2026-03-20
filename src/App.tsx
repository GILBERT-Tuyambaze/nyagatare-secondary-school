import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from './pages/Index';
import Enrollment from './pages/Enrollment';
import AdminDashboard from './pages/AdminDashboard';
import Events from './pages/Events';
import BoardMembers from './pages/BoardMembers';
import StudentPortal from './pages/StudentPortal';
import AdminBoardManagement from './pages/AdminBoardManagement';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import AdminRoute from './components/AdminRoute';
import { SystemLayout } from '@/loginpage/components/SystemLayout';
import { PermissionGate } from '@/loginpage/components/PermissionGate';
import { RoleGate } from '@/loginpage/components/RoleGate';
import SystemIndexPage from '@/loginpage/pages';
import ApplicationsPage from '@/loginpage/pages/applications';
import UsersPage from '@/loginpage/pages/users';
import RolesPage from '@/loginpage/pages/roles';
import AcademicsPage from '@/loginpage/pages/academics';
import ContentPage from '@/loginpage/pages/content';
import DisciplinePage from '@/loginpage/pages/discipline';
import FinancePage from '@/loginpage/pages/finance';
import InvitePage from '@/loginpage/pages/invite';
import InviteSignupPage from '@/loginpage/pages/invite-signup';
import StudentDashboardPage from '@/loginpage/pages/student-dashboard';
import ControlCenterPage from '@/loginpage/pages/control-center';
import AiHubPage from '@/loginpage/pages/ai-hub';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/enroll" element={<Enrollment />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/events" element={<Events />} />
            <Route path="/board-members" element={<BoardMembers />} />
            <Route path="/student-portal" element={<StudentPortal />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/invite-signup/:token" element={<InviteSignupPage />} />
            <Route path="/system" element={<AdminRoute><SystemLayout /></AdminRoute>}>
              <Route index element={<SystemIndexPage />} />
              <Route path="applications" element={<RoleGate roles={['SuperAdmin', 'Headmaster', 'AdmissionsOfficer', 'DOS', 'HOD']}><ApplicationsPage /></RoleGate>} />
              <Route path="student-dashboard" element={<PermissionGate permission="view_marks"><StudentDashboardPage /></PermissionGate>} />
              <Route path="control-center" element={<PermissionGate permission="view_reports"><ControlCenterPage /></PermissionGate>} />
              <Route path="ai-hub" element={<PermissionGate permission="view_reports"><AiHubPage /></PermissionGate>} />
              <Route path="users" element={<PermissionGate permission="manage_users"><UsersPage /></PermissionGate>} />
              <Route path="roles" element={<PermissionGate permission="assign_roles"><RolesPage /></PermissionGate>} />
              <Route path="academics" element={<PermissionGate permission="view_marks"><AcademicsPage /></PermissionGate>} />
              <Route path="content" element={<PermissionGate permission="manage_content"><ContentPage /></PermissionGate>} />
              <Route path="discipline" element={<PermissionGate permission="manage_discipline"><DisciplinePage /></PermissionGate>} />
              <Route path="finance" element={<PermissionGate permission="manage_finance"><FinancePage /></PermissionGate>} />
              <Route path="invite" element={<PermissionGate permission="assign_roles"><InvitePage /></PermissionGate>} />
            </Route>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/board-management" element={<AdminBoardManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

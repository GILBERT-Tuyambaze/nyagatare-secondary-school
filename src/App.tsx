import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import { PermissionGate } from '@/loginpage/components/PermissionGate';
import { RoleGate } from '@/loginpage/components/RoleGate';

const Index = lazy(() => import('./pages/Index'));
const Enrollment = lazy(() => import('./pages/Enrollment'));
const Events = lazy(() => import('./pages/Events'));
const Blog = lazy(() => import('./pages/Blog'));
const BoardMembers = lazy(() => import('./pages/BoardMembers'));
const StudentPortal = lazy(() => import('./pages/StudentPortal'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SystemLayout = lazy(() => import('@/loginpage/components/SystemLayout').then((module) => ({ default: module.SystemLayout })));
const SystemIndexPage = lazy(() => import('@/loginpage/pages'));
const ApplicationsPage = lazy(() => import('@/loginpage/pages/applications'));
const UsersPage = lazy(() => import('@/loginpage/pages/users'));
const RolesPage = lazy(() => import('@/loginpage/pages/roles'));
const AcademicsPage = lazy(() => import('@/loginpage/pages/academics'));
const ClassOperationsPage = lazy(() => import('@/loginpage/pages/class-operations'));
const ContentPage = lazy(() => import('@/loginpage/pages/content'));
const DisciplinePage = lazy(() => import('@/loginpage/pages/discipline'));
const FinancePage = lazy(() => import('@/loginpage/pages/finance'));
const InvitePage = lazy(() => import('@/loginpage/pages/invite'));
const InviteSignupPage = lazy(() => import('@/loginpage/pages/invite-signup'));
const StudentDashboardPage = lazy(() => import('@/loginpage/pages/student-dashboard'));
const ControlCenterPage = lazy(() => import('@/loginpage/pages/control-center'));
const AiHubPage = lazy(() => import('@/loginpage/pages/ai-hub'));
const ProfilePage = lazy(() => import('@/loginpage/pages/profile'));

const queryClient = new QueryClient();

const ScrollManager = () => {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '')
      window.setTimeout(() => {
        const target = document.getElementById(targetId)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 60)
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search, location.hash])

  return null
}

const LegacyApplicantPortalRedirect = () => {
  const location = useLocation()
  return <Navigate to={`/applicant-portal${location.search}`} replace />
}

const LegacyAdminRedirect = () => <Navigate to="/system/control-center" replace />

const LegacyBoardManagementRedirect = () => <Navigate to="/system/content" replace />

const RouteLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-background">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-cyan-400" />
  </div>
)

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollManager />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/enroll" element={<Enrollment />} />
              <Route path="/enrollment" element={<Enrollment />} />
              <Route path="/events" element={<Events />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/board-members" element={<BoardMembers />} />
              <Route path="/applicant-portal" element={<StudentPortal />} />
              <Route path="/student-portal" element={<LegacyApplicantPortalRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/invite-signup/:token" element={<InviteSignupPage />} />
              <Route path="/system" element={<AdminRoute><SystemLayout /></AdminRoute>}>
                <Route index element={<SystemIndexPage />} />
                <Route path="applications" element={<RoleGate roles={['SuperAdmin', 'Headmaster', 'AdmissionsOfficer', 'DOS', 'HOD']}><ApplicationsPage /></RoleGate>} />
                <Route path="student-dashboard" element={<PermissionGate permission="view_marks"><StudentDashboardPage /></PermissionGate>} />
                <Route path="control-center" element={<PermissionGate permission="view_reports"><ControlCenterPage /></PermissionGate>} />
                <Route path="ai-hub" element={<PermissionGate permission="view_reports"><AiHubPage /></PermissionGate>} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="users" element={<PermissionGate permission="manage_users"><UsersPage /></PermissionGate>} />
                <Route path="roles" element={<PermissionGate permission="assign_roles"><RolesPage /></PermissionGate>} />
                <Route path="academics" element={<PermissionGate permission="view_marks"><AcademicsPage /></PermissionGate>} />
                <Route path="class-operations" element={<RoleGate roles={['SuperAdmin', 'Headmaster', 'DOS', 'HOD', 'DOD']}><ClassOperationsPage /></RoleGate>} />
                <Route path="content" element={<RoleGate roles={['SuperAdmin', 'Headmaster', 'ContentManager', 'DOS', 'DOD', 'HOD']}><ContentPage /></RoleGate>} />
                <Route path="discipline" element={<PermissionGate permission="manage_discipline"><DisciplinePage /></PermissionGate>} />
                <Route path="finance" element={<PermissionGate permission="manage_finance"><FinancePage /></PermissionGate>} />
                <Route path="invite" element={<PermissionGate permission="assign_roles"><InvitePage /></PermissionGate>} />
              </Route>
              <Route path="/admin" element={<LegacyAdminRedirect />} />
              <Route path="/admin/board-management" element={<LegacyBoardManagementRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

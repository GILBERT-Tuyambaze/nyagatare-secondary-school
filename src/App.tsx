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
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/enroll" element={<Enrollment />} />
            <Route path="/enrollment" element={<Enrollment />} />
            <Route path="/events" element={<Events />} />
            <Route path="/board-members" element={<BoardMembers />} />
            <Route path="/student-portal" element={<StudentPortal />} />
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
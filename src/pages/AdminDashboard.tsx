import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, Calendar, DollarSign, Search, Filter, Download, LogOut, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getApplications, getEvents, getDonations, updateApplication } from '@/services/supabaseService';
import { Application, Event, Donation } from '@/types/database';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    totalStudents: 0,
    upcomingEvents: 0,
    totalDonations: 0,
    totalBoardMembers: 0,
    applicationsByStatus: {
      pending: 0,
      review: 0,
      approved: 0,
      rejected: 0,
      waitlist: 0,
    },
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, signOut, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) fetchDashboardData();
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      const [dashboardStats, applicationsData, eventsData, donationsData] = await Promise.all([
        getDashboardStats(),
        getApplications(),
        getEvents(),
        getDonations(),
      ]);

      setStats(dashboardStats);
      setApplications(applicationsData);
      setEvents(eventsData);
      setDonations(donationsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await updateApplication(applicationId, { status: newStatus as any });
      await fetchDashboardData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      review: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      waitlist: 'bg-orange-100 text-orange-800',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You need admin privileges to access this dashboard.</p>
              <Link to="/">
                <Button>Return to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Nyagatare Secondary School</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/admin/board-management">
                  <Button variant="outline" size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Board Management
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{user?.email?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'applications', name: 'Applications' },
                { id: 'events', name: 'Events' },
                { id: 'donations', name: 'Donations' },
                { id: 'content', name: 'Content' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                    </div>
                    <FileText className="h-4 w-4" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
                    </div>
                    <Users className="h-4 w-4" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                    </div>
                    <Calendar className="h-4 w-4" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Donations</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDonations} RWF</p>
                    </div>
                    <DollarSign className="h-4 w-4" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              {/* ... your applications content here ... */}
            </div>
          )}

          {/* Other tabs */}
          {activeTab !== 'overview' && activeTab !== 'applications' && (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                </h3>
                <p className="text-gray-600">This section is under development. Coming soon!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;

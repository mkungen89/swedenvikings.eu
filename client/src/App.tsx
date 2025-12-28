import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';

// Public Pages
import Home from '@/pages/Home';
import News from '@/pages/News';
import NewsArticle from '@/pages/NewsArticle';
import Events from '@/pages/Events';
import EventDetails from '@/pages/EventDetails';
import Rules from '@/pages/Rules';
import Clans from '@/pages/Clans';
import ClanDetails from '@/pages/ClanDetails';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';

// User Pages
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import MyTickets from '@/pages/MyTickets';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminRoles from '@/pages/admin/Roles';
import AdminNews from '@/pages/admin/News';
import AdminEvents from '@/pages/admin/Events';
import AdminServer from '@/pages/admin/Server';
import AdminLogs from '@/pages/admin/Logs';
import AdminSettings from '@/pages/admin/Settings';
import AdminTickets from '@/pages/admin/Tickets';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminRoute from '@/components/auth/AdminRoute';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<NewsArticle />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:slug" element={<EventDetails />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/clans" element={<Clans />} />
        <Route path="/clans/:id" element={<ClanDetails />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/settings" element={<Settings />} />
          <Route path="/tickets" element={<MyTickets />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="server" element={<AdminServer />} />
          <Route path="logs" element={<AdminLogs />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;


import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Shield,
  Newspaper,
  Calendar,
  Server,
  FileText,
  Settings,
  Ticket,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { href: '/admin/users', label: 'Användare', icon: Users },
  { href: '/admin/roles', label: 'Roller', icon: Shield },
  { href: '/admin/news', label: 'Nyheter', icon: Newspaper },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/server', label: 'Server', icon: Server },
  { href: '/admin/logs', label: 'Loggar', icon: FileText },
  { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { href: '/admin/settings', label: 'Inställningar', icon: Settings },
];

export default function AdminLayout() {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-darker flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-background-dark border-r border-white/5 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {sidebarOpen && (
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-display font-bold text-white text-sm">
                SV
              </div>
              <span className="font-display font-semibold">Admin</span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronDown
              className={cn(
                'w-5 h-5 transition-transform',
                sidebarOpen ? 'rotate-90' : '-rotate-90'
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white',
                  !sidebarOpen && 'justify-center'
                )
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Back to site */}
        <div className="p-4 border-t border-white/5">
          <Link
            to="/"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors',
              !sidebarOpen && 'justify-center'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
            {sidebarOpen && <span>Tillbaka till sidan</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-background-dark border-r border-white/5 z-50 flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                <Link to="/admin" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-display font-bold text-white text-sm">
                    SV
                  </div>
                  <span className="font-display font-semibold">Admin</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {sidebarLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    end={link.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary-600/20 text-primary-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-background-dark">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden sm:block">{user.username}</span>
              <img
                src={user.avatar || '/default-avatar.png'}
                alt={user.username}
                className="w-8 h-8 rounded-full border-2 border-primary-500"
              />
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


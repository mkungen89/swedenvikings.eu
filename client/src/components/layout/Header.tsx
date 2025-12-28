import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const navLinks = [
  { href: '/', label: 'Hem' },
  { href: '/news', label: 'Nyheter' },
  { href: '/events', label: 'Events' },
  { href: '/rules', label: 'Regler' },
  { href: '/clans', label: 'Clans' },
];

export default function Header() {
  const { user, isAuthenticated, login, logout, hasPermission } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background-darker/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-display font-bold text-white text-xl group-hover:scale-105 transition-transform">
              SV
            </div>
            <span className="font-display font-semibold text-lg hidden sm:block">
              Sweden Vikings
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <img
                    src={user.avatar || '/default-avatar.png'}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border-2 border-primary-500"
                  />
                  <span className="hidden sm:block text-sm font-medium">{user.username}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-background-card rounded-xl border border-white/10 shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/5">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.roles[0]?.name || 'Member'}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          to={`/profile/${user.id}`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <span>Min Profil</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-400" />
                          <span>Inställningar</span>
                        </Link>
                        {hasPermission('admin.access') && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-primary-400"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <hr className="my-2 border-white/5" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logga ut</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={login}
                className="btn-primary text-sm"
              >
                <img src="/steam-logo.svg" alt="Steam" className="w-5 h-5" />
                Logga in
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-background-darker"
          >
            <nav className="p-4 space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block px-4 py-2 rounded-lg font-medium transition-colors',
                      isActive
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-gray-300 hover:bg-white/5'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Search, BookOpen, GraduationCap, LogOut, Menu, X, User, Bell, ChevronDown } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import api from '../api/axios';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      console.warn('Failed to load notifications');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setDropdownOpen(false);
    setIsOpen(false);
  };

  const dashboardPath = () => {
    if (user?.role === 'admin') return '/dashboard/admin';
    if (user?.role === 'tutor') return '/dashboard/tutor';
    return '/dashboard/student';
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b dark:border-darkBorder/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
                <GraduationCap className="h-6 w-6" />
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Tech<span className="text-brand-500">Sips</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link to="/courses" className={`transition-colors hover:text-brand-500 ${location.pathname === '/courses' ? 'text-brand-500' : 'text-slate-600 dark:text-slate-300'}`}>
                Explore Courses
              </Link>
              <Link to="/about" className={`transition-colors hover:text-brand-500 ${location.pathname === '/about' ? 'text-brand-500' : 'text-slate-600 dark:text-slate-300'}`}>
                About
              </Link>
            </div>
          </div>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Bar */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const q = e.target.search.value;
              if (q) navigate(`/courses?search=${encodeURIComponent(q)}`);
            }} className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search skills..."
                className="w-48 lg:w-64 pl-10 pr-4 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-100/50 dark:bg-darkBg/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 transition-all duration-300"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </form>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-darkBorder hover:bg-slate-100 dark:hover:bg-darkCard transition-all text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-darkBorder hover:bg-slate-100 dark:hover:bg-darkCard transition-all text-slate-600 dark:text-slate-300 relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.some(n => !n.is_read) && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl p-4 shadow-xl z-50 text-sm max-h-96 overflow-y-auto">
                    <h3 className="font-semibold mb-3 border-b dark:border-darkBorder pb-2">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">No notifications yet</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((n) => (
                          <div key={n.id} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard/60 transition-colors">
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">{n.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 dark:border-darkBorder hover:bg-slate-100 dark:hover:bg-darkCard transition-all text-slate-700 dark:text-slate-200"
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium max-w-[100px] truncate">{user?.full_name}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-2xl py-2 shadow-xl z-50 text-sm">
                    <Link
                      to={dashboardPath()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-darkCard text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>My Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-500 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard text-slate-600 dark:text-slate-300"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden glass border-b dark:border-darkBorder/40 py-4 px-4 space-y-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const q = e.target.search.value;
            if (q) navigate(`/courses?search=${encodeURIComponent(q)}`);
            setIsOpen(false);
          }} className="relative">
            <input
              type="text"
              name="search"
              placeholder="Search skills..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-100/50 dark:bg-darkBg/60 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          </form>

          <div className="flex flex-col space-y-3 font-medium">
            <Link to="/courses" onClick={() => setIsOpen(false)} className="text-slate-700 dark:text-slate-300 hover:text-brand-500 px-2 py-1">Explore Courses</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className="text-slate-700 dark:text-slate-300 hover:text-brand-500 px-2 py-1">About</Link>
          </div>

          <div className="border-t dark:border-darkBorder pt-4 flex flex-col space-y-3">
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath()}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-2 px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-brand-500"
                >
                  <User className="h-4 w-4" />
                  <span>My Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-2 py-1 text-rose-600 dark:text-rose-400 hover:opacity-80 text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center px-4 py-2 text-sm font-medium border border-slate-200 dark:border-darkBorder hover:bg-slate-50 dark:hover:bg-darkCard rounded-xl text-slate-700 dark:text-slate-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Sidebar({ links = [], title = 'Dashboard' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close drawer automatically when the route changes (user tapped a link)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navContent = (
    <>
      <div className="mb-6 px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </h2>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/15'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-darkCard hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* ── Mobile hamburger trigger (only on small screens) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar menu"
        className="md:hidden fixed bottom-5 left-5 z-40 flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500 text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 active:scale-95 transition-all"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Backdrop overlay (mobile only) ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <div
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 glass border-r dark:border-darkBorder/60 flex flex-col p-5 shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </h2>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar menu"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard text-slate-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/15'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-darkCard hover:text-slate-900 dark:hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* ── Desktop sidebar (unchanged, always visible on md+) ── */}
      <aside className="w-64 glass border-r dark:border-darkBorder/40 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4">
        {navContent}
      </aside>
    </>
  );
}

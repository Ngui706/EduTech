import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Sidebar({ links = [], title = 'Dashboard' }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);

  // Auto-close when the user navigates to a new page
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const NavItems = ({ onItemClick }) =>
    links.map((link) => {
      const Icon = link.icon;
      return (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.end}
          onClick={onItemClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          <span>{link.label}</span>
        </NavLink>
      );
    });

  return (
    <>
      {/* ════════════════════════════════════════════════════
          DESKTOP SIDEBAR  (hidden on mobile)
          ════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-white dark:bg-darkCard border-r border-slate-200 dark:border-darkBorder/50 h-[calc(100vh-4rem)] sticky top-16 p-4 gap-1">
        <p className="px-2 mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {title}
        </p>
        <NavItems />
      </aside>

      {/* ════════════════════════════════════════════════════
          MOBILE  — Floating hamburger button
          ════════════════════════════════════════════════════ */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        style={{ position: 'fixed', bottom: '1.25rem', left: '1.25rem', zIndex: 999 }}
        className="md:hidden flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 text-white shadow-2xl shadow-brand-500/40 hover:bg-brand-600 active:scale-95 transition-all"
      >
        <Menu size={22} />
      </button>

      {/* ════════════════════════════════════════════════════
          MOBILE  — Full-screen backdrop
          ════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.55)',
          }}
        />
      )}

      {/* ════════════════════════════════════════════════════
          MOBILE  — Slide-in drawer (fully opaque)
          ════════════════════════════════════════════════════ */}
      <div
        ref={drawerRef}
        aria-modal="true"
        role="dialog"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '280px',
          zIndex: 1001,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          overflowY: 'auto',
          boxShadow: '4px 0 32px rgba(0,0,0,0.18)',
        }}
        className="bg-white dark:bg-darkCard border-r border-slate-200 dark:border-darkBorder md:hidden"
      >
        {/* Drawer top bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          <NavItems onItemClick={() => setMobileOpen(false)} />
        </nav>
      </div>
    </>
  );
}

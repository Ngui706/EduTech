import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ links = [], title = "Dashboard" }) {
  return (
    <aside className="w-64 glass border-r dark:border-darkBorder/40 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4">
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
              <Icon className="h-4.5 w-4.5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

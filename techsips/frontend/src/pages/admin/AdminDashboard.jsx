import React from 'react';
import { Outlet } from 'react-router-dom';
import { Users, BookOpen, Sparkles, FolderOpen, LayoutDashboard } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

export default function AdminDashboard() {
  const sidebarLinks = [
    { path: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { path: '/dashboard/admin/tutors', label: 'Tutor Verification', icon: Users },
    { path: '/dashboard/admin/courses', label: 'Course Approvals', icon: BookOpen },
    { path: '/dashboard/admin/promotions', label: 'Promotion Queue', icon: Sparkles },
    { path: '/dashboard/admin/categories', label: 'Category Manager', icon: FolderOpen },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] dark:bg-darkBg">
      {/* Admin Sidebar */}
      <Sidebar links={sidebarLinks} title="Admin Portal" />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

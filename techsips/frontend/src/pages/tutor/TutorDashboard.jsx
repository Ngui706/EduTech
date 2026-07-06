import React from 'react';
import { Outlet } from 'react-router-dom';
import { BookOpen, Users, Award, Settings, LayoutDashboard, Sparkles } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

export default function TutorDashboard() {
  const sidebarLinks = [
    { path: '/dashboard/tutor', label: 'Overview', icon: LayoutDashboard, end: true },
    { path: '/dashboard/tutor/courses', label: 'My Courses', icon: BookOpen },
    { path: '/dashboard/tutor/students', label: 'Students', icon: Users },
    { path: '/dashboard/tutor/promotions', label: 'Promotions', icon: Sparkles },
    { path: '/dashboard/tutor/settings', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] dark:bg-darkBg">
      {/* Tutor Sidebar */}
      <Sidebar links={sidebarLinks} title="Tutor Portal" />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

import React from 'react';
import { Outlet } from 'react-router-dom';
import { BookOpen, Award, Heart, Settings, LayoutDashboard } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

export default function StudentDashboard() {
  const sidebarLinks = [
    { path: '/dashboard/student', label: 'Overview', icon: LayoutDashboard, end: true },
    { path: '/dashboard/student/courses', label: 'My Courses', icon: BookOpen },
    { path: '/dashboard/student/wishlist', label: 'My Wishlist', icon: Heart },
    { path: '/dashboard/student/certificates', label: 'Certificates', icon: Award },
    { path: '/dashboard/student/settings', label: 'Profile Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] dark:bg-darkBg">
      {/* Dashboard Sidebar */}
      <Sidebar links={sidebarLinks} title="Student Portal" />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}

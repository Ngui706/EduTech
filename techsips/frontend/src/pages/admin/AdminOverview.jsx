import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Award, TrendingUp, Activity, ShieldCheck, Clock } from 'lucide-react';
import api from '../../api/axios';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch (err) {
        console.warn('Failed to load admin dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-brand-500', bg: 'bg-brand-500/10' },
    { label: 'Active Tutors', value: stats?.totalTutors || 0, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Pending Reviews', value: (stats?.pendingTutorApprovals || 0) + (stats?.pendingCourseApprovals || 0), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Enrollments', value: stats?.totalEnrollments || 0, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Recent Enrollments', value: stats?.recentEnrollments || 0, icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-900 dark:from-darkCard dark:to-darkBg p-6 sm:p-8 text-white shadow-xl border dark:border-darkBorder/40">
        <div className="absolute top-[-20%] right-[-10%] w-[35%] aspect-square rounded-full bg-brand-500/10 blur-[80px]"></div>
        <div className="relative space-y-2">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
            <Activity className="h-4 w-4 animate-pulse" />
            <span>Platform Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Administration Overview</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Monitor all platform activity, manage tutor verifications, approve courses, and configure global settings from this central hub.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-5 flex items-center space-x-4">
            <span className={`p-3 rounded-xl ${bg} ${color}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value.toLocaleString()}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Action Queue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="font-bold text-amber-500 flex items-center space-x-2">
              <Users className="h-4.5 w-4.5" />
              <span>Pending Tutors</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats?.pendingTutorApprovals || 0}</div>
            <p className="text-xs text-slate-500">Applications awaiting verification review</p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
            <div className="font-bold text-brand-500 flex items-center space-x-2">
              <BookOpen className="h-4.5 w-4.5" />
              <span>Pending Courses</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats?.pendingCourseApprovals || 0}</div>
            <p className="text-xs text-slate-500">Course submissions awaiting review</p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
            <div className="font-bold text-indigo-500 flex items-center space-x-2">
              <Activity className="h-4.5 w-4.5" />
              <span>Pending Promotions</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats?.pendingPromotions || 0}</div>
            <p className="text-xs text-slate-500">Promotion requests awaiting approval</p>
          </div>
        </div>
      </div>
    </div>
  );
}

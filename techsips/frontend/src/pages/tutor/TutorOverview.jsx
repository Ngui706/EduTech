import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Star, TrendingUp, Plus, ArrowRight, ShieldCheck, HelpCircle, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function TutorOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) {
      setRefreshing(true);
    }
    try {
      const { data } = await api.get('/tutors/me/dashboard');
      setStats(data.data);
    } catch (err) {
      console.warn('Failed to load tutor overview stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-sync every 30 seconds
    const intervalId = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  // Calculate earnings mock: 1,500 KES per enrollment as base
  const totalEnrollments = stats?.totalEnrollments || 0;
  const estimatedEarnings = totalEnrollments * 1500;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Instructor Console</h2>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 dark:bg-darkCard hover:bg-slate-200 dark:hover:bg-darkBorder border border-slate-200 dark:border-darkBorder rounded-xl text-xs font-bold text-slate-700 dark:text-white transition-all shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Welcome & Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute top-[-20%] right-[-10%] w-[35%] aspect-square rounded-full bg-brand-400/20 blur-[70px]"></div>
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome, Instructor {user?.full_name}! 🚀</h1>
          <p className="text-brand-100 text-sm max-w-xl">
            Check your ratings, manage syllabus modules, and request premium course promotion badges.
          </p>
        </div>
        <div className="relative">
          <Link
            to="/dashboard/tutor/courses/create"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-white text-brand-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Create Course</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.totalCourses || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Courses</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{totalEnrollments}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Students</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5 animate-pulse-subtle" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.avgRating || 0.0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg Rating</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {estimatedEarnings.toLocaleString()} KES
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Est. Revenue</div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Active Catalog</h2>
          <Link to="/dashboard/tutor/courses" className="text-xs font-semibold text-brand-500 hover:underline flex items-center">
            <span>Manage Catalog</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>

        {stats?.courses && stats.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.courses.slice(0, 3).map((course) => (
              <div key={course.id} className="glass-card flex flex-col justify-between overflow-hidden group">
                <div className="aspect-video bg-slate-100 dark:bg-darkBg relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={resolveMediaUrl(course.thumbnail_url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">TS</div>
                  )}
                  {course.is_approved ? (
                    <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Approved</span>
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
                      <HelpCircle className="h-3 w-3" />
                      <span className="capitalize">{course.status}</span>
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {course.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t dark:border-darkBorder/40 pt-4">
                    <span className="text-slate-400">{course.enrollment_count || 0} Students</span>
                    <Link
                      to={`/dashboard/tutor/courses/${course.id}/edit`}
                      className="px-3.5 py-1.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white transition-colors rounded-lg font-semibold"
                    >
                      Edit Syllabus
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
            <p>You have not created any courses yet.</p>
            <Link
              to="/dashboard/tutor/courses/create"
              className="mt-4 inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm"
            >
              Build Your First Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

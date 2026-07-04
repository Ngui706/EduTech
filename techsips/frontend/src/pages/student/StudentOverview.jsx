import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function StudentOverview() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await api.get('/students/dashboard');
        setStats(data.data);
      } catch (err) {
        console.warn('Failed to fetch student stats');
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-[35%] aspect-square rounded-full bg-brand-400/20 blur-[70px]"></div>
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold">Welcome back, {user?.full_name}! 👋</h1>
          <p className="text-brand-100 text-sm max-w-xl">
            Keep building your tech profile. Start where you left off or explore new bootcamps today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.totalEnrollments || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Courses Enrolled</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.completedCourses || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.totalCertificates || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Certificates</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center space-x-4">
          <span className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {stats?.recentEnrollments?.reduce((acc, curr) => acc + (curr.courses?.duration_hours || 0), 0) || 0}h
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Learning Hours</div>
          </div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Learning</h2>
          <Link to="/dashboard/student/courses" className="text-xs font-semibold text-brand-500 hover:underline">
            View All
          </Link>
        </div>

        {stats?.recentEnrollments?.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-400 text-sm">
            You are not enrolled in any courses yet.
            <Link to="/courses" className="block text-brand-500 font-bold mt-2 hover:underline">
              Explore Courses →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats?.recentEnrollments?.map((enroll) => (
              <div key={enroll.id} className="glass-card p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-12 bg-slate-100 dark:bg-darkBg rounded-lg overflow-hidden flex-shrink-0">
                    {enroll.courses?.thumbnail_url ? (
                      <img src={enroll.courses.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                        TS
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{enroll.courses?.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{enroll.courses?.duration_hours} hours total</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-500">
                    <span>Progress</span>
                    <span>{enroll.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-darkBg h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${enroll.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                <Link
                  to={`/dashboard/student/courses/${enroll.courses?.id}`}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-darkBg dark:hover:bg-darkCard text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs text-center flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <span>Continue Learning</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

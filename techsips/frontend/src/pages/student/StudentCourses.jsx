import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Award, Clock } from 'lucide-react';
import api from '../../api/axios';

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const { data } = await api.get('/students/enrollments');
        setEnrollments(data.data || []);
      } catch (err) {
        console.warn('Failed to load student enrollments');
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Enrolled Courses</h1>
        <p className="text-sm text-slate-500 mt-1">Track your active cohorts and keep building your skills.</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <BookOpen className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p>You have not enrolled in any courses yet.</p>
          <Link to="/courses" className="mt-4 inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enroll) => (
            <div key={enroll.id} className="glass-card flex flex-col h-full overflow-hidden group">
              <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-darkBg">
                {enroll.courses?.thumbnail_url ? (
                  <img
                    src={enroll.courses.thumbnail_url}
                    alt=""
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-500/10 text-brand-500 font-bold">
                    TS
                  </div>
                )}
                {enroll.completed_at && (
                  <span className="absolute top-3 left-3 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1">
                    <Award className="h-3 w-3" />
                    <span>Completed</span>
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-500">
                    <span>{enroll.courses?.categories?.name || 'Tech'}</span>
                    <span className="capitalize text-slate-500">{enroll.courses?.difficulty}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
                    {enroll.courses?.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {enroll.courses?.subtitle}
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  {/* Progress bar */}
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
                    className="w-full block py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-center font-semibold rounded-xl text-xs transition-colors"
                  >
                    {enroll.completed_at ? 'Review Materials' : 'Continue Course'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

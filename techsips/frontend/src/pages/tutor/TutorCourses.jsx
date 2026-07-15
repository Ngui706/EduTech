import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, ShieldCheck, HelpCircle, AlertCircle, Trash2, Edit3, Send, Sparkles, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function TutorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) {
      setRefreshing(true);
    }
    try {
      const response = await api.get('/tutors/me/courses');
      setCourses(response.data.data || []);
    } catch (err) {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    // Auto-sync every 30 seconds
    const intervalId = setInterval(() => {
      fetchCourses();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchCourses]);

  const handleSubmitForReview = async (id) => {
    if (processing) return;
    setProcessing(true);
    try {
      await api.post(`/tutors/me/courses/${id}/submit`);
      toast.success('Course submitted for admin review!');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit course.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (processing) return;
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    setProcessing(true);
    try {
      await api.delete(`/tutors/me/courses/${id}`);
      toast.success('Course deleted successfully.');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete course.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestPromotion = async (id) => {
    if (processing) return;
    const message = window.prompt('Provide a message/reason for requesting promotion (featured status):');
    if (message === null) return;
    setProcessing(true);
    try {
      await api.post(`/tutors/me/courses/${id}/promote`, { message });
      toast.success('Promotion request submitted!');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit promotion request.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Course Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Manage draft syllabi, submissions, and marketing promotions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCourses(true)}
            disabled={refreshing || processing}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBorder text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-darkBorder"
            title="Refresh course list"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/dashboard/tutor/courses/create"
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/15 hover:shadow-brand-500/25"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Course</span>
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <BookOpen className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p>No courses found in your catalog.</p>
          <Link
            to="/dashboard/tutor/courses/create"
            className="mt-4 inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm"
          >
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="glass-card flex flex-col justify-between overflow-hidden group">
              <div className="aspect-video bg-slate-100 dark:bg-darkBg relative overflow-hidden">
                {course.thumbnail_url ? (
                  <img
                    src={resolveMediaUrl(course.thumbnail_url)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                    TS
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {course.is_approved ? (
                    <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shadow-md">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Approved</span>
                    </span>
                  ) : (
                    <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center space-x-1 shadow-md">
                      <HelpCircle className="h-3 w-3" />
                      <span className="capitalize">{course.status}</span>
                    </span>
                  )}
                  {course.is_sponsored && (
                    <span className="bg-indigo-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 shadow-md">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Sponsored</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-brand-500">
                    <span>{course.categories?.name || 'Tech'}</span>
                    <span className="capitalize text-slate-400">{course.difficulty}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {course.subtitle}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t dark:border-darkBorder/40 mt-4">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>{course.course_modules?.length || 0} Modules</span>
                    <span>{course.enrollment_count || 0} Enrolled Students</span>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <Link
                      to={`/dashboard/tutor/courses/${course.id}/edit`}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-slate-100 dark:bg-darkCard hover:bg-slate-200 dark:hover:bg-darkBg border border-slate-200 dark:border-darkBorder rounded-xl transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Course</span>
                    </Link>

                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={processing}
                      className="flex items-center justify-center space-x-1 px-3 py-2 bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>

                    {course.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitForReview(course.id)}
                        disabled={processing}
                        className="col-span-2 flex items-center justify-center space-x-1 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/10 disabled:opacity-60"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit for Admin Approval</span>
                      </button>
                    )}

                    {course.is_approved && !course.is_sponsored && (
                      <button
                        onClick={() => handleRequestPromotion(course.id)}
                        disabled={processing}
                        className="col-span-2 flex items-center justify-center space-x-1 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/10 disabled:opacity-60"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Request Sponsored Placement</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

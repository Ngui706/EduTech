import React, { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, ShieldCheck, ShieldX, Star, Clock, ExternalLink, Trash2, RefreshCw,
  CheckCircle2, XCircle, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function AdminCourses() {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'all'
  const [deletingId, setDeletingId] = useState(null);

  const fetchPendingCourses = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/courses/pending');
      setPendingCourses(data.data || []);
    } catch {
      toast.error('Failed to load pending courses.');
    }
  }, []);

  const fetchAllCourses = useCallback(async () => {
    try {
      // Use tutors/all endpoint which includes all courses grouped by tutor
      const { data } = await api.get('/admin/tutors/all');
      const tutors = data.data || [];
      // Flatten all courses from all tutors
      const courses = tutors.flatMap((t) =>
        (t.courses || []).map((c) => ({
          ...c,
          tutor_name: t.full_name,
          tutor_email: t.email,
        }))
      );
      setAllCourses(courses);
    } catch {
      toast.error('Failed to load all courses.');
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPendingCourses(), fetchAllCourses()]);
    setLoading(false);
  }, [fetchPendingCourses, fetchAllCourses]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleApprove = async (courseId) => {
    try {
      await api.put(`/admin/courses/${courseId}/approve`);
      toast.success('Course approved and published!');
      // Optimistic: remove from pending list
      setPendingCourses((prev) => prev.filter((c) => c.id !== courseId));
      // Refresh all courses to reflect the status change
      fetchAllCourses();
    } catch {
      toast.error('Failed to approve course.');
    }
  };

  const handleReject = async (courseId) => {
    const reason = window.prompt('Reason for rejection (shown to the tutor):');
    if (reason === null) return;
    try {
      await api.put(`/admin/courses/${courseId}/reject`, {
        reason: reason || 'Does not meet platform standards.',
      });
      toast.success('Course rejected and returned to draft.');
      // Optimistic: remove from pending list
      setPendingCourses((prev) => prev.filter((c) => c.id !== courseId));
      fetchAllCourses();
    } catch {
      toast.error('Failed to reject course.');
    }
  };

  const handleFeature = async (courseId, currentFeatured) => {
    try {
      await api.put(`/admin/courses/${courseId}/feature`, { featured: !currentFeatured });
      toast.success(currentFeatured ? 'Course removed from homepage.' : 'Course featured on homepage!');
      // Optimistic update: toggle is_featured
      setPendingCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, is_featured: !currentFeatured } : c))
      );
      setAllCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, is_featured: !currentFeatured } : c))
      );
    } catch {
      toast.error('Failed to update course featured status.');
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    if (!window.confirm(
      `Are you sure you want to permanently delete the course:\n\n"${courseTitle}"\n\n⚠️ This will also delete all enrollments, reviews, and modules associated with this course.\n\nThis action CANNOT be undone.`
    )) return;

    setDeletingId(courseId);
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success(`Course "${courseTitle}" has been permanently deleted.`);
      // Optimistic: remove from both lists instantly
      setPendingCourses((prev) => prev.filter((c) => c.id !== courseId));
      setAllCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete course.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  const displayCourses = activeTab === 'pending' ? pendingCourses : allCourses;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Course Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, approve, feature, and manage all platform courses.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBorder text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-darkCard/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-darkBg text-amber-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Pending Review ({pendingCourses.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-darkBg text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            All Courses ({allCourses.length})
          </span>
        </button>
      </div>

      {displayCourses.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <BookOpen className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p className="font-semibold">
            {activeTab === 'pending' ? 'No courses awaiting review.' : 'No courses found.'}
          </p>
          <p className="text-xs mt-1 text-slate-500">
            {activeTab === 'pending'
              ? 'All submitted courses have been processed.'
              : 'Courses will appear here once tutors create them.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {displayCourses.map((course) => {
            const isDeleting = deletingId === course.id;
            const statusColor =
              course.status === 'published' && course.is_approved
                ? 'bg-emerald-500 text-white'
                : course.status === 'pending'
                ? 'bg-amber-500 text-white'
                : course.status === 'rejected'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-400 text-white';

            return (
              <div
                key={course.id}
                className={`glass-card overflow-hidden transition-opacity ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail */}
                  <div className="sm:w-48 aspect-video sm:aspect-auto bg-slate-100 dark:bg-darkBg flex-shrink-0 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={resolveMediaUrl(course.thumbnail_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-500/10 text-brand-500 font-bold text-lg">TS</div>
                    )}
                    <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${statusColor}`}>
                      {course.status === 'published' && course.is_approved ? (
                        <><CheckCircle2 className="h-3 w-3" /><span>Live</span></>
                      ) : course.status === 'rejected' ? (
                        <><XCircle className="h-3 w-3" /><span>Rejected</span></>
                      ) : (
                        <><Clock className="h-3 w-3" /><span>{course.status || 'pending'}</span></>
                      )}
                    </span>
                    {course.is_featured && (
                      <span className="absolute top-2 right-2 bg-brand-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{course.title}</h3>
                        <span className="text-xs text-slate-400 capitalize bg-slate-100 dark:bg-darkCard px-2 py-0.5 rounded-full">
                          {course.difficulty}
                        </span>
                      </div>
                      {course.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
                        <span>
                          By: <span className="font-bold text-slate-600 dark:text-slate-300">
                            {course.users?.full_name || course.tutor_name}
                          </span>
                        </span>
                        {course.categories?.name && <span>Category: {course.categories.name}</span>}
                        {course.duration_hours && <span>{course.duration_hours}h duration</span>}
                        {course.language && <span>{course.language}</span>}
                        {course.is_free ? (
                          <span className="text-emerald-500 font-bold">Free</span>
                        ) : (
                          <span>Paid: KES {course.price}</span>
                        )}
                        <span>Enrollments: <strong>{course.enrollment_count || 0}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-darkBorder/40 mt-4">
                      {/* Pending actions */}
                      {activeTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(course.id)}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/10"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span>Approve & Publish</span>
                          </button>
                          <button
                            onClick={() => handleReject(course.id)}
                            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                          >
                            <ShieldX className="h-4 w-4" />
                            <span>Reject to Draft</span>
                          </button>
                        </>
                      )}

                      {/* Feature toggle – always visible */}
                      <button
                        onClick={() => handleFeature(course.id, course.is_featured)}
                        className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                          course.is_featured
                            ? 'bg-brand-500 text-white hover:bg-brand-600'
                            : 'bg-brand-500/10 text-brand-500 border border-brand-500/20 hover:bg-brand-500 hover:text-white'
                        }`}
                      >
                        <Star className="h-4 w-4" />
                        <span>{course.is_featured ? 'Unfeature' : 'Feature on Landing'}</span>
                      </button>

                      {/* Delete – always visible */}
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        disabled={isDeleting}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-800/30 rounded-xl text-xs font-bold hover:bg-rose-100 hover:border-rose-300 transition-colors ml-auto disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span>{isDeleting ? 'Deleting…' : 'Delete Course'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

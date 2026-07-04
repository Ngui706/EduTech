import React, { useEffect, useState } from 'react';
import { BookOpen, ShieldCheck, ShieldX, Star, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const fetchPendingCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/courses/pending');
      setCourses(data.data || []);
    } catch {
      toast.error('Failed to load pending courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId) => {
    try {
      await api.put(`/admin/courses/${courseId}/approve`);
      toast.success('Course approved and published!');
      fetchPendingCourses();
    } catch {
      toast.error('Failed to approve course.');
    }
  };

  const handleReject = async (courseId) => {
    const reason = window.prompt('Reason for rejection (shown to the tutor):');
    if (reason === null) return;
    try {
      await api.put(`/admin/courses/${courseId}/reject`, { reason: reason || 'Does not meet platform standards.' });
      toast.success('Course rejected and returned to draft.');
      fetchPendingCourses();
    } catch {
      toast.error('Failed to reject course.');
    }
  };

  const handleFeature = async (courseId, currentFeatured) => {
    try {
      await api.put(`/admin/courses/${courseId}/feature`, { featured: !currentFeatured });
      toast.success(currentFeatured ? 'Course removed from homepage.' : 'Course featured on homepage!');
      fetchPendingCourses();
    } catch {
      toast.error('Failed to update course featured status.');
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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Course Approval Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review course syllabi submitted by verified tutors, then approve or reject for publication.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <BookOpen className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p className="font-semibold">No courses awaiting review.</p>
          <p className="text-xs mt-1 text-slate-500">All submitted courses have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="glass-card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="sm:w-48 aspect-video sm:aspect-auto bg-slate-100 dark:bg-darkBg flex-shrink-0 relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-500/10 text-brand-500 font-bold text-lg">TS</div>
                  )}
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Pending</span>
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{course.title}</h3>
                      <span className="text-xs text-slate-400 capitalize bg-slate-100 dark:bg-darkCard px-2 py-0.5 rounded-full">{course.difficulty}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{course.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
                      <span>By: <span className="font-bold text-slate-600 dark:text-slate-300">{course.users?.full_name}</span></span>
                      <span>Category: {course.categories?.name}</span>
                      <span>{course.duration_hours}h duration</span>
                      <span>{course.language}</span>
                      {course.is_free ? (
                        <span className="text-emerald-500 font-bold">Free</span>
                      ) : (
                        <span>Paid: KES {course.price}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-darkBorder/40 mt-4">
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

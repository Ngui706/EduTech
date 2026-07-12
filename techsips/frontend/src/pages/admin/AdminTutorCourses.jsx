import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  GraduationCap, BookOpen, Users, Star, ChevronDown, ChevronUp,
  Search, ExternalLink, CheckCircle2, XCircle, Clock, Award, Trash2, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, approved }) {
  if (status === 'published' && approved) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" /> Live
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  }
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
        Draft
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
      {status}
    </span>
  );
}

// ─── Tutor Card ────────────────────────────────────────────────────────────────
function TutorCard({ tutor, onTutorDeleted, onCourseDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [deletingTutor, setDeletingTutor] = useState(false);
  const profile = tutor.tutor_profile;
  const verificationStatus = profile?.verification_status;

  const verBadge = () => {
    if (verificationStatus === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <Award className="h-3.5 w-3.5" /> Verified Tutor
        </span>
      );
    }
    if (verificationStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock className="h-3.5 w-3.5" /> Pending Verification
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-500">
        {verificationStatus || 'Unverified'}
      </span>
    );
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(
      `Delete course "${courseTitle}"?\n\n⚠️ This will also remove all enrollments, reviews, and modules.\n\nThis action cannot be undone.`
    )) return;
    setDeletingCourseId(courseId);
    try {
      await api.delete(`/admin/courses/${courseId}`);
      toast.success(`Course "${courseTitle}" deleted.`);
      if (onCourseDeleted) onCourseDeleted(tutor.id, courseId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete course.');
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleDeleteTutor = async () => {
    if (!window.confirm(
      `Permanently delete tutor "${tutor.full_name}"?\n\n⚠️ This will delete:\n• All their courses\n• All student enrollments\n• Their tutor profile\n\nThis cannot be undone.`
    )) return;
    setDeletingTutor(true);
    try {
      await api.delete(`/admin/users/${tutor.id}`);
      toast.success(`Tutor "${tutor.full_name}" permanently deleted.`);
      if (onTutorDeleted) onTutorDeleted(tutor.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete tutor.');
      setDeletingTutor(false);
    }
  };

  return (
    <div className={`glass-card overflow-hidden transition-opacity ${deletingTutor ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {tutor.avatar_url ? (
            <img
              src={tutor.avatar_url}
              alt={tutor.full_name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-darkBorder"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-extrabold text-xl select-none">
              {tutor.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
              {tutor.full_name}
            </h3>
            {verBadge()}
          </div>
          <p className="text-xs text-slate-500 truncate">{tutor.email}</p>
          {profile?.bio && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="text-center">
            <p className="text-xl font-extrabold text-brand-500">{tutor.total_courses}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Courses</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-emerald-500">{tutor.published_courses}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Live</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold text-sky-500">{tutor.total_enrollments}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Students</p>
          </div>
          {/* Delete tutor button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTutor();
            }}
            disabled={deletingTutor}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors disabled:opacity-40"
            title="Permanently delete this tutor and all their courses"
          >
            {deletingTutor ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
          <div className="text-slate-400">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* ── Expanded Course List ─────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-darkBorder">
          {tutor.courses.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No courses created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-darkBorder">
              {tutor.courses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-16 h-10 rounded-lg object-cover border border-slate-200 dark:border-darkBorder"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-brand-500" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {course.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <StatusBadge status={course.status} approved={course.is_approved} />
                      {course.categories?.name && (
                        <span className="text-[10px] text-slate-400">{course.categories.name}</span>
                      )}
                      <span className="text-[10px] text-slate-400 capitalize">{course.difficulty}</span>
                    </div>
                  </div>

                    {/* Metrics + delete */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.enrollment_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      {course.rating_avg ? Number(course.rating_avg).toFixed(1) : '—'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {course.is_free ? 'Free' : `$${course.price}`}
                    </span>
                    <a
                      href={`/courses/${course.slug || course.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-brand-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id, course.title);
                      }}
                      disabled={deletingCourseId === course.id}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors disabled:opacity-40"
                      title="Delete this course permanently"
                    >
                      {deletingCourseId === course.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTutorCourses() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tutors/all');
      setTutors(data.data || []);
    } catch {
      toast.error('Failed to load tutor catalogue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Optimistic: remove entire tutor row after deletion
  const handleTutorDeleted = useCallback((tutorId) => {
    setTutors((prev) => prev.filter((t) => t.id !== tutorId));
  }, []);

  // Optimistic: remove specific course from tutor row after deletion
  const handleCourseDeleted = useCallback((tutorId, courseId) => {
    setTutors((prev) =>
      prev.map((t) => {
        if (t.id !== tutorId) return t;
        const newCourses = (t.courses || []).filter((c) => c.id !== courseId);
        return {
          ...t,
          courses: newCourses,
          total_courses: newCourses.length,
          published_courses: newCourses.filter((c) => c.status === 'published' && c.is_approved).length,
          total_enrollments: newCourses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0),
        };
      })
    );
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return tutors;
    const q = search.toLowerCase();
    return tutors.filter(
      (t) =>
        t.full_name?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.courses.some((c) => c.title?.toLowerCase().includes(q))
    );
  }, [tutors, search]);

  // Live computed stats from current state
  const totalCourses = useMemo(() => tutors.reduce((s, t) => s + t.total_courses, 0), [tutors]);
  const totalEnrollments = useMemo(() => tutors.reduce((s, t) => s + t.total_enrollments, 0), [tutors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Tutor Course Catalogue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse all tutors and their full course portfolios. Delete tutors or individual courses.
          </p>
        </div>
        <button
          onClick={fetchTutors}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBorder text-slate-700 dark:text-white rounded-xl text-sm font-bold transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Stat Cards – live computed */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-brand-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{tutors.length}</p>
            <p className="text-xs text-slate-400">Total Tutors</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalCourses}</p>
            <p className="text-xs text-slate-400">Total Courses</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalEnrollments}</p>
            <p className="text-xs text-slate-400">Total Enrollments</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          id="tutor-course-search"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tutor name, email, or course title…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {/* Tutor List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="font-semibold">No tutors found.</p>
          {search && <p className="text-xs mt-1">Try a different search term.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tutor) => (
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              onTutorDeleted={handleTutorDeleted}
              onCourseDeleted={handleCourseDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}


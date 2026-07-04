import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Globe, BarChart2, CheckCircle2, ChevronRight, Lock, PlayCircle, BookOpen, AlertCircle, Users } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('syllabus');

  useEffect(() => {
    fetchCourseDetail();
  }, [id, isAuthenticated]);

  const fetchCourseDetail = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`);
      setCourse(data.data);
    } catch (err) {
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll');
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      toast.error('Only students can enroll in courses');
      return;
    }
    if (enrolling) return;

    setEnrolling(true);
    try {
      await api.post(`/courses/${course.id}/enroll`);
      toast.success('Successfully enrolled!');
      fetchCourseDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <p className="text-slate-400 mt-2">The course you are looking for does not exist or has been removed.</p>
        <Link to="/courses" className="mt-6 inline-block px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-darkBg py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Course Header Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <nav className="flex space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Link to="/courses" className="hover:text-brand-500">Courses</Link>
              <span>/</span>
              <span className="text-brand-500">{course.categories?.name}</span>
            </nav>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {course.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 font-bold">{course.rating_avg || '5.0'}</span>
                <span className="text-slate-400 ml-1">({course.rating_count || 0} reviews)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{course.enrollment_count || 0} students enrolled</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{course.duration_hours || 0} total hours</span>
              </div>
            </div>

            {/* Created by */}
            <div className="flex items-center space-x-3 pt-2">
              {course.users?.avatar_url ? (
                <img src={course.users.avatar_url} alt="" className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-darkBorder" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                  {course.users?.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs text-slate-400">Instructor</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{course.users?.full_name}</div>
              </div>
            </div>
          </div>

          {/* Pricing & Enrollment Box */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24 space-y-6 shadow-2xl border border-slate-200 dark:border-darkBorder">
              <div className="aspect-video rounded-xl bg-slate-900 overflow-hidden relative border dark:border-darkBorder flex items-center justify-center">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <PlayCircle className="h-12 w-12 text-brand-500 opacity-60" />
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-400">Price</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {course.is_free ? 'Free' : `${course.price} KES`}
                </span>
              </div>

              {course.isEnrolled ? (
                <Link
                  to={`/dashboard/student/courses/${course.id}`}
                  className="w-full block py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                >
                  Go to Player
                </Link>
              ) : (
                <button
                  disabled={enrolling}
                  onClick={handleEnroll}
                  className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-500/15 hover:shadow-brand-500/30 disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}

              <div className="space-y-3 pt-4 border-t dark:border-darkBorder/60 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span>Language: {course.language || 'English'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                  <span className="capitalize">Level: {course.difficulty}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>Modules: {course.course_modules?.length || 0} sections</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Details Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex border-b dark:border-darkBorder">
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
                  activeTab === 'syllabus'
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Syllabus
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
                  activeTab === 'about'
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                About Instructor
              </button>
            </div>

            {/* Syllabus Tab */}
            {activeTab === 'syllabus' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Course Content</h3>
                  {course.course_modules?.length === 0 ? (
                    <p className="text-slate-400 text-sm">No curriculum has been added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {course.course_modules
                        ?.sort((a, b) => a.order_index - b.order_index)
                        .map((mod) => (
                          <div key={mod.id} className="glass-card overflow-hidden">
                            <div className="p-4 bg-slate-50 dark:bg-darkCard/40 border-b dark:border-darkBorder/60 flex items-center justify-between">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200">
                                {mod.title}
                              </h4>
                              <span className="text-xs text-slate-400">
                                {mod.course_lessons?.length || 0} lessons
                              </span>
                            </div>
                            <div className="divide-y dark:divide-darkBorder/40">
                              {mod.course_lessons
                                ?.sort((a, b) => a.order_index - b.order_index)
                                .map((les) => (
                                  <div key={les.id} className="p-3.5 px-6 flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                                      <PlayCircle className="h-4.5 w-4.5 text-brand-400 flex-shrink-0" />
                                      <span className="font-medium">{les.title}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                                      <span>{les.duration_mins} mins</span>
                                      {!course.isEnrolled && !les.is_preview && (
                                        <Lock className="h-3 w-3 text-slate-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Outcomes & Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Learning Outcomes</h4>
                    <ul className="space-y-2">
                      {course.learning_outcomes?.map((out, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
                          <span>{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">Requirements</h4>
                    <ul className="space-y-2">
                      {course.requirements?.map((req, i) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-400">
                          <ChevronRight className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Long description */}
                <div className="pt-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Description</h4>
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                    {course.description}
                  </div>
                </div>
              </div>
            )}

            {/* Instructor Tab */}
            {activeTab === 'about' && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">About {course.users?.full_name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {course.users?.bio || 'This instructor has not shared a bio yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

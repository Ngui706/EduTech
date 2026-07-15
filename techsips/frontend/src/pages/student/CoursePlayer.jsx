import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  CheckCircle,
  FileText,
  HelpCircle,
  ChevronLeft,
  Download,
  Upload,
  Check,
  Award,
  Video,
  BookOpen,
  Lock,
  RotateCcw,
  Trophy,
  ExternalLink,
  ClipboardList,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import jsPDF from 'jspdf';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);

  // Per-quiz state: { [quizId]: { answers: {}, result: null, submitted: false } }
  const [quizStates, setQuizStates] = useState({});

  // Per-lesson assignment submission tracking
  const [submittedAssignments, setSubmittedAssignments] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Completing enrollment
  const [completing, setCompleting] = useState(false);
  const [togglingProgress, setTogglingProgress] = useState(false);

  // Reading pattern tracking and active timer
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);

  // Required reading/watching time logic
  const getRequiredSeconds = useCallback((lesson) => {
    if (!lesson) return 0;
    // Fallback to 1 minute default if duration_mins is not specified or 0
    return (lesson.duration_mins || 1) * 60;
  }, []);

  const requiredSeconds = activeLesson ? getRequiredSeconds(activeLesson) : 0;
  const isTimeRequirementMet = timeSpent >= requiredSeconds || !!(data?.lessonProgress?.some(p => p.lesson_id === activeLesson?.id && p.completed));

  // Page visibility API listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Timer interval logic: increment only if tab is active and lesson is not already completed
  useEffect(() => {
    if (!activeLesson) return;
    
    // Reset time spent when active lesson changes
    setTimeSpent(0);

    const isAlreadyCompleted = data?.lessonProgress?.some(p => p.lesson_id === activeLesson.id && p.completed);
    if (isAlreadyCompleted) return;

    const interval = setInterval(() => {
      if (isTabActive) {
        setTimeSpent((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLesson, isTabActive, data?.lessonProgress]);

  // Keep a ref so fetchCourseContent can read the latest activeLesson without being a dependency
  const activeLessonRef = useRef(activeLesson);
  useEffect(() => { activeLessonRef.current = activeLesson; }, [activeLesson]);

  const fetchCourseContent = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${courseId}/content`);
      const courseData = response.data.data;
      setData(courseData);

      const currentActive = activeLessonRef.current;
      // Set first lesson as active by default
      if (!currentActive && courseData.modules?.[0]?.course_lessons?.[0]) {
        setActiveLesson(courseData.modules[0].course_lessons[0]);
      } else if (currentActive) {
        // Refresh active lesson data (progress may have updated)
        const updatedLesson = courseData.modules
          ?.flatMap(m => m.course_lessons || [])
          ?.find(l => l.id === currentActive.id);
        if (updatedLesson) setActiveLesson(updatedLesson);
      }
    } catch {
      toast.error('Failed to load course player.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseContent();
  }, [fetchCourseContent]);

  // ── Progress helpers ─────────────────────────────────────────────────────────
  const isLessonCompleted = (lessonId) =>
    data?.lessonProgress?.some(p => p.lesson_id === lessonId && p.completed);

  const handleLessonToggle = async (lessonId) => {
    if (!data?.enrollment?.id) return;
    if (togglingProgress) return;
    const current = isLessonCompleted(lessonId);

    // Enforce study time requirement when marking complete
    if (!current && !isTimeRequirementMet) {
      const remaining = Math.max(0, requiredSeconds - timeSpent);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      toast.error(`Please study this lesson for another ${mins}m ${secs}s before marking it as complete.`);
      return;
    }

    setTogglingProgress(true);
    try {
      await api.post('/students/progress', {
        lesson_id: lessonId,
        enrollment_id: data.enrollment.id,
        completed: !current,
        watch_time_secs: timeSpent
      });
      toast.success(!current ? '✅ Lesson marked as completed!' : 'Progress updated');
      await fetchCourseContent();
    } catch {
      toast.error('Failed to update progress.');
    } finally {
      setTogglingProgress(false);
    }
  };

  // ── Complete course ──────────────────────────────────────────────────────────
  const handleCompleteCourse = async () => {
    if (!data?.enrollment?.id) return;
    if (data.enrollment.progress_percentage < 100) {
      toast.error('Complete all lessons first before finishing the course.');
      return;
    }
    if (completing) return;
    setCompleting(true);
    try {
      await api.post(`/students/enrollments/${data.enrollment.id}/complete`);
      toast.success('🎉 Course completed! Certificate generated.');
      await fetchCourseContent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete course.');
    } finally {
      setCompleting(false);
    }
  };

  // ── Quiz ─────────────────────────────────────────────────────────────────────
  const getQuizState = (quizId) =>
    quizStates[quizId] || { answers: {}, result: null, submitted: false };

  const setQuizAnswer = (quizId, qIdx, optIdx) => {
    setQuizStates(prev => ({
      ...prev,
      [quizId]: {
        ...getQuizState(quizId),
        answers: { ...getQuizState(quizId).answers, [qIdx]: optIdx }
      }
    }));
  };

  const handleQuizSubmit = (quiz, questions) => {
    const state = getQuizState(quiz.id);
    // Validate all answered
    for (let i = 0; i < questions.length; i++) {
      if (state.answers[i] === undefined) {
        toast.error(`Please answer question ${i + 1} before submitting.`);
        return;
      }
    }

    let correct = 0;
    questions.forEach((q, idx) => {
      const selectedOptIdx = state.answers[idx];
      const opts = q.options || [];
      if (opts[selectedOptIdx]?.is_correct) correct++;
    });

    const percentage = Math.round((correct / questions.length) * 100);
    const passed = percentage >= (quiz.pass_percentage || 70);

    setQuizStates(prev => ({
      ...prev,
      [quiz.id]: {
        ...state,
        submitted: true,
        result: { correct, total: questions.length, percentage, passed }
      }
    }));

    if (passed) {
      toast.success(`🎉 Quiz passed! Score: ${percentage}%`);
    } else {
      toast.error(`Score: ${percentage}%. Need ${quiz.pass_percentage || 70}% to pass. Try again!`);
    }
  };

  const handleRetakeQuiz = (quizId) => {
    setQuizStates(prev => ({ ...prev, [quizId]: { answers: {}, result: null, submitted: false } }));
  };

  // ── Assignment upload ─────────────────────────────────────────────────────────
  const handleAssignmentUpload = async (e, assignmentId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (uploadingDoc) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingDoc(true);
    try {
      await api.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmittedAssignments(prev => ({ ...prev, [assignmentId]: true }));
      toast.success('Assignment uploaded successfully!');
    } catch {
      toast.error('Failed to upload assignment.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // ── Certificate PDF ───────────────────────────────────────────────────────────
  const generateCertificate = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(15);
    doc.rect(20, 20, 760, 560);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(2);
    doc.rect(35, 35, 730, 530);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(15, 23, 42);
    doc.text('CERTIFICATE OF COMPLETION', 400, 130, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(100, 116, 139);
    doc.text('This is proudly presented to:', 400, 200, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(99, 102, 241);
    const studentName = JSON.parse(localStorage.getItem('user'))?.full_name || 'Valued Student';
    doc.text(studentName, 400, 260, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(100, 116, 139);
    doc.text('for successfully completing the course:', 400, 320, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    const courseTitle = data?.courseTitle || data?.modules?.[0]?.title || 'TechSips Bootcamp';
    doc.text(courseTitle, 400, 370, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    const completedDate = data?.enrollment?.completed_at
      ? new Date(data.enrollment.completed_at).toLocaleDateString()
      : new Date().toLocaleDateString();
    doc.text(`Date of Issuance: ${completedDate}`, 400, 440, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Authorized by TechSips Inc.', 400, 520, { align: 'center' });

    doc.save(`TechSips-Certificate-${courseId}.pdf`);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const parseLessonType = (type) => {
    switch (type) {
      case 'video': return { label: 'Video Lesson', icon: Video, color: 'text-brand-500 bg-brand-500/10' };
      case 'pdf':
      case 'text':
      case 'document': return { label: 'Reading / PDF', icon: FileText, color: 'text-indigo-500 bg-indigo-500/10' };
      case 'quiz': return { label: 'Interactive Quiz', icon: HelpCircle, color: 'text-amber-500 bg-amber-500/10' };
      case 'assignment': return { label: 'Assignment / Lab', icon: ClipboardList, color: 'text-rose-500 bg-rose-500/10' };
      default: return { label: 'Lesson', icon: BookOpen, color: 'text-slate-500 bg-slate-500/10' };
    }
  };

  const parseQuestions = (questions) => {
    if (!questions) return [];
    if (typeof questions === 'string') {
      try { return JSON.parse(questions); } catch { return []; }
    }
    return Array.isArray(questions) ? questions : [];
  };

  const normalizeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://localhost:5000')) {
      return url.substring('http://localhost:5000'.length);
    }
    return url;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytReg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytReg);
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }
    const vimeoReg = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoReg);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return null;
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-darkBg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500" />
      </div>
    );
  }

  const progress = data?.enrollment?.progress_percentage || 0;
  const courseCompleted = !!data?.enrollment?.completed_at;
  const typeInfo = activeLesson ? parseLessonType(activeLesson.lesson_type) : null;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] dark:bg-darkBg">

      {/* ── Left: Player content ────────────────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-6 lg:border-r dark:border-darkBorder/40 overflow-y-auto">

        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <Link to="/dashboard/student/courses" className="flex items-center hover:text-brand-500 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Back to My Courses</span>
          </Link>
        </div>

        {activeLesson ? (
          <div className="space-y-6 animate-fade-in">

            {/* ── Content frame ─────────────────────────────────────────── */}
            <div className="glass-card overflow-hidden">
              {activeLesson.lesson_type === 'video' ? (
                <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
                  {activeLesson.content_url ? (
                    (() => {
                      const embedUrl = getEmbedUrl(activeLesson.content_url);
                      if (embedUrl) {
                        return (
                          <iframe
                            key={activeLesson.id}
                            src={embedUrl}
                            title={activeLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full aspect-video"
                          />
                        );
                      }
                      return (
                        <video
                          key={activeLesson.id}
                          src={normalizeUrl(activeLesson.content_url)}
                          controls
                          className="w-full h-full"
                        />
                      );
                    })()
                  ) : (
                    <div className="text-center text-slate-500 space-y-2">
                      <Video className="h-12 w-12 mx-auto text-slate-700 animate-pulse" />
                      <p className="text-sm">No video uploaded for this lesson.</p>
                    </div>
                  )}
                </div>
              ) : (activeLesson.lesson_type === 'document' || activeLesson.lesson_type === 'pdf' || activeLesson.lesson_type === 'text') ? (
                <div className="p-8 space-y-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Reading / PDF
                  </span>
                  <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Review the attached PDF document below. Read carefully before proceeding to the quiz.
                  </p>
                  {activeLesson.content_url ? (
                    <div className="space-y-4">
                      <div className="w-full h-[550px] bg-slate-150 dark:bg-darkBg rounded-2xl overflow-hidden border dark:border-darkBorder relative">
                        <iframe
                          src={`${normalizeUrl(activeLesson.content_url)}#toolbar=0`}
                          title={activeLesson.title}
                          className="w-full h-full"
                          frameBorder="0"
                        />
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-darkCard rounded-2xl border dark:border-darkBorder flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-brand-500/10 rounded-xl">
                            <FileText className="h-6 w-6 text-brand-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Course Document</p>
                            <p className="text-xs text-slate-400">PDF Document</p>
                          </div>
                        </div>
                        <a
                          href={normalizeUrl(activeLesson.content_url)}
                          download
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          <Download className="h-3.5 w-3.5" /> Download PDF
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No document attached to this lesson.</p>
                  )}
                </div>
              ) : activeLesson.lesson_type === 'quiz' ? (
                <div className="p-8 space-y-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                    <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Interactive Quiz
                  </span>
                  <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Complete this quiz to test your understanding. You need {activeLesson.course_quizzes?.[0]?.pass_percentage || 70}% to pass.
                  </p>
                </div>
              ) : (
                <div className="p-8 space-y-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Assignment / Lab
                  </span>
                  <h2 className="text-2xl font-bold">{activeLesson.title}</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Complete the assignment below and upload your work to mark this lesson as done.
                  </p>
                </div>
              )}
            </div>

            {/* Timer / Progress Banner */}
            {!isLessonCompleted(activeLesson.id) && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                isTimeRequirementMet 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/50 dark:bg-darkCard rounded-xl animate-pulse">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {isTimeRequirementMet 
                        ? '✅ Time requirement met! You can now mark this lesson as completed.' 
                        : '⏱️ Study Requirement Active'}
                    </p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {!isTabActive && '⚠️ Timer paused (tab is inactive)'}
                      {isTabActive && !isTimeRequirementMet && `Please study for at least ${activeLesson.duration_mins || 1} minute(s).`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-extrabold">
                    {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs opacity-60 ml-1">
                    / {activeLesson.duration_mins || 1}:00
                  </span>
                </div>
              </div>
            )}

            {/* ── Title bar + Mark completed ────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeLesson.title}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {typeInfo?.label} · {activeLesson.duration_mins || 1} minutes
                </p>
              </div>
              <button
                onClick={() => handleLessonToggle(activeLesson.id)}
                disabled={togglingProgress || (!isLessonCompleted(activeLesson.id) && !isTimeRequirementMet)}
                className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLessonCompleted(activeLesson.id)
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                    : isTimeRequirementMet
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-350 dark:border-slate-700'
                }`}
              >
                {isLessonCompleted(activeLesson.id) ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Mark as Completed</span>
                  </>
                )}
              </button>
            </div>

            {/* ── Sub-sections ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Resources & Assignments */}
              <div className="space-y-4">
                {/* Resources */}
                <div className="glass-card p-5 space-y-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Download className="h-4 w-4 text-brand-500" /> Resources & Assets
                  </h3>
                  {activeLesson.course_resources && activeLesson.course_resources.length > 0 ? (
                    <div className="space-y-2">
                      {activeLesson.course_resources.map((res) => (
                        <div key={res.id} className="p-3 bg-slate-50 dark:bg-darkBg rounded-xl border dark:border-darkBorder/50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 bg-brand-500/10 rounded-lg flex-shrink-0">
                              <FileText className="h-4 w-4 text-brand-500" />
                            </div>
                            <span className="text-sm font-semibold truncate">{res.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={normalizeUrl(res.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-100 dark:bg-darkCard hover:bg-brand-500/10 text-slate-500 hover:text-brand-500 rounded-lg transition-colors"
                              title="Open"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={normalizeUrl(res.file_url)}
                              download
                              className="p-1.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No resources attached to this lesson.</p>
                  )}
                </div>

                {/* Assignments */}
                <div className="glass-card p-5 space-y-4">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-rose-500" /> Assignment / Lab
                  </h3>
                  {activeLesson.course_assignments && activeLesson.course_assignments.length > 0 ? (
                    <div className="space-y-4">
                      {activeLesson.course_assignments.map((ass) => (
                        <div key={ass.id} className="space-y-3">
                          <div>
                            <h4 className="font-bold text-sm">{ass.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{ass.description}</p>
                            {ass.due_days && (
                              <p className="text-xs text-amber-500 font-semibold mt-1">Due within {ass.due_days} days</p>
                            )}
                          </div>

                          <div className="border border-dashed dark:border-darkBorder rounded-2xl p-4 text-center space-y-2">
                            {submittedAssignments[ass.id] ? (
                              <div className="text-emerald-500 text-sm font-bold flex items-center justify-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                <span>Assignment Submitted!</span>
                              </div>
                            ) : (
                              <>
                                <label className="cursor-pointer block">
                                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                  <span className="text-xs font-semibold text-brand-500 hover:underline">
                                    {uploadingDoc ? 'Uploading...' : 'Choose file to submit'}
                                  </span>
                                  <input
                                    type="file"
                                    onChange={(e) => handleAssignmentUpload(e, ass.id)}
                                    className="hidden"
                                    disabled={uploadingDoc}
                                  />
                                </label>
                                <p className="text-[10px] text-slate-400">ZIP, PDF, or image — max 10MB</p>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No assignment required for this lesson.</p>
                  )}
                </div>
              </div>

              {/* Quizzes */}
              <div className="glass-card p-5 space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-500" /> Lesson Quiz
                </h3>
                {activeLesson.course_quizzes && activeLesson.course_quizzes.length > 0 ? (
                  <div className="space-y-6">
                    {activeLesson.course_quizzes.map((quiz) => {
                      const questions = parseQuestions(quiz.questions);
                      const qState = getQuizState(quiz.id);

                      if (questions.length === 0) {
                        return (
                          <p key={quiz.id} className="text-sm text-slate-400 italic">
                            This quiz has no questions yet.
                          </p>
                        );
                      }

                      return (
                        <div key={quiz.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm">{quiz.title}</h4>
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full">
                              Pass: {quiz.pass_percentage || 70}%
                            </span>
                          </div>

                          {/* Result banner */}
                          {qState.result && (
                            <div className={`p-4 rounded-2xl border ${
                              qState.result.passed
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-rose-500/10 border-rose-500/20'
                            }`}>
                              <p className={`font-bold text-sm ${qState.result.passed ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {qState.result.passed ? '🎉 Quiz Passed!' : '❌ Not quite — try again!'}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Score: {qState.result.correct}/{qState.result.total} ({qState.result.percentage}%)
                              </p>
                              {!qState.result.passed && (
                                <button
                                  onClick={() => handleRetakeQuiz(quiz.id)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:underline mt-2"
                                >
                                  <RotateCcw className="h-3 w-3" /> Retake Quiz
                                </button>
                              )}
                            </div>
                          )}

                          {/* Questions */}
                          {!qState.submitted && (
                            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                              {questions.map((q, qIdx) => {
                                const opts = q.options || [];
                                return (
                                  <div key={qIdx} className="space-y-2 border-b dark:border-darkBorder/40 pb-4 last:border-0">
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                      {qIdx + 1}. {q.question}
                                    </p>
                                    <div className="grid gap-2">
                                      {opts.map((opt, optIdx) => {
                                        const optText = typeof opt === 'string' ? opt : opt.text;
                                        const selected = qState.answers[qIdx] === optIdx;
                                        return (
                                          <button
                                            key={optIdx}
                                            onClick={() => setQuizAnswer(quiz.id, qIdx, optIdx)}
                                            className={`text-left text-xs px-3 py-2 rounded-xl transition-all border font-medium ${
                                              selected
                                                ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                                                : 'border-slate-200 dark:border-darkBorder hover:bg-slate-50 dark:hover:bg-darkBg text-slate-600 dark:text-slate-400'
                                            }`}
                                          >
                                            <span className="font-black mr-1.5 text-slate-400">
                                              {String.fromCharCode(65 + optIdx)}.
                                            </span>
                                            {optText}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Submit button */}
                          {!qState.submitted && (
                            <button
                              onClick={() => handleQuizSubmit(quiz, questions)}
                              className="w-full py-2.5 bg-brand-500 text-white font-bold rounded-xl text-xs hover:bg-brand-600 transition-colors shadow-md shadow-brand-500/15"
                            >
                              Submit Answers
                            </button>
                          )}

                          {/* Review mode after submission */}
                          {qState.submitted && (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Answer Review</p>
                              {questions.map((q, qIdx) => {
                                const opts = q.options || [];
                                const selectedIdx = qState.answers[qIdx];
                                return (
                                  <div key={qIdx} className="space-y-1.5">
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                      {qIdx + 1}. {q.question}
                                    </p>
                                    {opts.map((opt, optIdx) => {
                                      const optText = typeof opt === 'string' ? opt : opt.text;
                                      const isCorrect = typeof opt === 'object' ? opt.is_correct : false;
                                      const isSelected = selectedIdx === optIdx;
                                      let cls = 'border-slate-200 dark:border-darkBorder text-slate-500';
                                      if (isCorrect) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
                                      else if (isSelected && !isCorrect) cls = 'border-rose-400 bg-rose-500/10 text-rose-500';
                                      return (
                                        <div key={optIdx} className={`text-xs px-3 py-1.5 rounded-xl border font-medium ${cls}`}>
                                          <span className="font-black mr-1.5">
                                            {String.fromCharCode(65 + optIdx)}.
                                          </span>
                                          {optText}
                                          {isCorrect && <span className="ml-2 text-[10px] font-black">✓ CORRECT</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No quiz available for this lesson.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
            <Video className="h-10 w-10 text-slate-500 opacity-60" />
            <p>Select a lesson from the sidebar to start learning.</p>
          </div>
        )}
      </div>

      {/* ── Right: Course outline ───────────────────────────────────────────── */}
      <div className="w-full lg:w-80 p-6 space-y-5">

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Course Syllabus</h3>
            <span className="text-xs font-bold text-brand-500">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-darkBorder h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {data?.lessonProgress?.filter(p => p.completed).length || 0} of{' '}
            {data?.modules?.flatMap(m => m.course_lessons || []).length || 0} lessons completed
          </p>
        </div>

        {/* Complete Course button */}
        {!courseCompleted ? (
          <button
            onClick={handleCompleteCourse}
            disabled={progress < 100 || completing}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-sm transition-all ${
              progress === 100
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/20 hover:opacity-90'
                : 'bg-slate-100 dark:bg-darkCard text-slate-400 cursor-not-allowed'
            }`}
          >
            {completing ? (
              <><Loader className="h-4 w-4 animate-spin" /> Completing...</>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                {progress === 100 ? 'Complete Course' : `Complete all lessons first (${progress}%)`}
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Course Completed! 🎉</span>
            </div>
            <button
              onClick={generateCertificate}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-tr from-brand-600 to-indigo-500 text-white rounded-2xl hover:opacity-90 font-bold text-sm shadow-xl shadow-brand-500/15"
            >
              <Award className="h-4 w-4" />
              Download Certificate
            </button>
          </div>
        )}

        {/* Module list */}
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {data?.modules?.map((mod, modIdx) => (
            <div key={mod.id} className="space-y-1.5">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1">
                Module {modIdx + 1}: {mod.title}
              </h4>
              <div className="space-y-1">
                {mod.course_lessons?.map((les) => {
                  const completed = isLessonCompleted(les.id);
                  const isActive = activeLesson?.id === les.id;
                  const lesType = parseLessonType(les.lesson_type);
                  const LesIcon = lesType.icon;
                  return (
                    <button
                      key={les.id}
                      onClick={() => {
                        setActiveLesson(les);
                        setQuizStates({}); // reset quiz on lesson switch
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs ${
                        isActive
                          ? 'bg-brand-500/10 text-brand-500 font-bold border border-brand-500/15'
                          : 'hover:bg-slate-100 dark:hover:bg-darkCard text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {completed ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <LesIcon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                        )}
                        <span className="truncate">{les.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal pl-1 flex-shrink-0">
                        {les.duration_mins || 10}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

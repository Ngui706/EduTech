import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  Video,
  FileText,
  Save,
  Loader,
  Play,
  Upload,
  BookOpen,
  Check,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function TutorCourseEditor({ isCreate = false }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Steps: 'metadata' or 'curriculum'
  const [step, setStep] = useState('metadata');
  const normalizeUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://localhost:5000')) {
      return url.substring('http://localhost:5000'.length);
    }
    return url;
  };
  // Track course approval/published state for UI hints
  const [courseStatus, setCourseStatus] = useState({ status: 'draft', is_approved: false });

  // Metadata form state
  const [metadata, setMetadata] = useState({
    title: '',
    subtitle: '',
    description: '',
    category_id: '',
    difficulty: 'beginner',
    duration_hours: '',
    language: 'English',
    learning_outcomes: '',
    requirements: '',
    thumbnail_url: '',
    is_free: true
  });

  // Curriculum state (modules & lessons)
  const [modules, setModules] = useState([]);

  // Active modal state
  const [moduleModal, setModuleModal] = useState({ isOpen: false, editId: null, title: '', description: '' });
  const [lessonModal, setLessonModal] = useState({
    isOpen: false,
    editId: null,
    moduleId: null,
    title: '',
    lesson_type: 'video',
    content_url: '',
    duration_mins: 15,
    is_preview: false
  });

  const [quizModal, setQuizModal] = useState({
    isOpen: false,
    lessonId: null,
    lessonTitle: '',
    title: 'Lesson Quiz',
    questions: []
  });

  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (!isCreate) {
      fetchCourseDetails();
    } else {
      setLoading(false);
    }
  }, [courseId, isCreate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      console.warn('Failed to load categories', err);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      // Use tutor-specific endpoint so draft/pending courses load correctly
      const response = await api.get(`/tutors/me/courses/${courseId}`);
      const course = response.data.data;

      setMetadata({
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        category_id: course.category_id || '',
        difficulty: course.difficulty || 'beginner',
        duration_hours: course.duration_hours || '',
        language: course.language || 'English',
        learning_outcomes: Array.isArray(course.learning_outcomes) ? course.learning_outcomes.join('\n') : course.learning_outcomes || '',
        requirements: Array.isArray(course.requirements) ? course.requirements.join('\n') : course.requirements || '',
        thumbnail_url: course.thumbnail_url || '',
        is_free: course.is_free ?? true
      });

      // Track approval state
      setCourseStatus({ status: course.status, is_approved: course.is_approved });

      // Load curriculum details
      if (course.course_modules) {
        // Sort modules by order_index
        const sorted = [...course.course_modules].sort((a, b) => a.order_index - b.order_index);
        setModules(sorted);
      }
    } catch (err) {
      toast.error('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setMetadata({ ...metadata, [e.target.name]: value });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgFormData = new FormData();
    imgFormData.append('file', file);
    setUploadingFile(true);

    try {
      const { data } = await api.post('/upload/image', imgFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMetadata(prev => ({ ...prev, thumbnail_url: data.url }));
      toast.success('Thumbnail uploaded!');
    } catch {
      toast.error('Failed to upload thumbnail image.');
    } finally {
      setUploadingFile(false);
    }
  };

  const saveMetadata = async (e) => {
    if (e) e.preventDefault();
    if (saving) return;
    setSaving(true);

    // Format outcomes and requirements as arrays
    const payload = {
      ...metadata,
      learning_outcomes: metadata.learning_outcomes.split('\n').filter(Boolean),
      requirements: metadata.requirements.split('\n').filter(Boolean),
      duration_hours: Number(metadata.duration_hours) || 10
    };

    try {
      if (isCreate) {
        const response = await api.post('/tutors/me/courses', payload);
        toast.success('Course draft created!');
        navigate(`/dashboard/tutor/courses/${response.data.data.id}/edit`);
      } else {
        await api.put(`/tutors/me/courses/${courseId}`, payload);
        toast.success('Metadata saved successfully!');
        setStep('curriculum');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save metadata.');
    } finally {
      setSaving(false);
    }
  };

  // Module actions
  const handleSaveModule = async () => {
    if (saving) return;
    if (!moduleModal.title) return;
    setSaving(true);
    try {
      if (moduleModal.editId) {
        const { data: updated } = await api.put(`/tutors/me/modules/${moduleModal.editId}`, {
          title: moduleModal.title,
          description: moduleModal.description
        });
        setModules(modules.map(m => m.id === moduleModal.editId ? { ...m, ...updated.data } : m));
        toast.success('Module updated!');
      } else {
        const { data: created } = await api.post(`/tutors/me/courses/${courseId}/modules`, {
          title: moduleModal.title,
          description: moduleModal.description
        });
        setModules([...modules, { ...created.data, course_lessons: [] }]);
        toast.success('Module added!');
      }
      setModuleModal({ isOpen: false, editId: null, title: '', description: '' });
    } catch {
      toast.error('Failed to save module.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this module and all its lessons?')) return;
    try {
      await api.delete(`/tutors/me/modules/${moduleId}`);
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Module deleted.');
    } catch {
      toast.error('Failed to delete module.');
    }
  };

  // Lesson actions
  const handleLessonUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append('file', file);
    setUploadingFile(true);

    try {
      const endpoint = lessonModal.lesson_type === 'video' ? '/upload/video' : '/upload/document';
      const { data } = await api.post(endpoint, fileFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLessonModal(prev => ({ ...prev, content_url: data.url }));
      toast.success('Lesson file uploaded!');
    } catch {
      toast.error('Failed to upload file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveLesson = async () => {
    if (saving) return;
    if (!lessonModal.title) return;
    setSaving(true);
    const payload = {
      title: lessonModal.title,
      lesson_type: lessonModal.lesson_type,
      content_url: lessonModal.content_url,
      duration_mins: Number(lessonModal.duration_mins) || 15,
      is_preview: lessonModal.is_preview
    };

    try {
      if (lessonModal.editId) {
        const { data: updated } = await api.put(`/tutors/me/lessons/${lessonModal.editId}`, payload);
        setModules(modules.map(m => {
          if (m.id === lessonModal.moduleId) {
            return {
              ...m,
              course_lessons: m.course_lessons.map(l => l.id === lessonModal.editId ? { ...l, ...updated.data } : l)
            };
          }
          return m;
        }));
        toast.success('Lesson updated!');
      } else {
        const { data: created } = await api.post(`/tutors/me/modules/${lessonModal.moduleId}/lessons`, payload);
        setModules(modules.map(m => {
          if (m.id === lessonModal.moduleId) {
            return {
              ...m,
              course_lessons: [...(m.course_lessons || []), created.data]
            };
          }
          return m;
        }));
        toast.success('Lesson added!');
      }
      setLessonModal({ isOpen: false, editId: null, moduleId: null, title: '', lesson_type: 'video', content_url: '', duration_mins: 15, is_preview: false });
    } catch {
      toast.error('Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/tutors/me/lessons/${lessonId}`);
      setModules(modules.map(m => {
        if (m.id === moduleId) {
          return {
            ...m,
            course_lessons: m.course_lessons.filter(l => l.id !== lessonId)
          };
        }
        return m;
      }));
      toast.success('Lesson deleted.');
    } catch {
      toast.error('Failed to delete lesson.');
    }
  };

  const handleOpenQuizEditor = async (lessonId, lessonTitle) => {
    setUploadingFile(true);
    try {
      const response = await api.get(`/tutors/me/lessons/${lessonId}/quiz`);
      const quiz = response.data.data;
      
      let parsedQuestions = [];
      if (quiz && quiz.questions) {
        parsedQuestions = typeof quiz.questions === 'string' 
          ? JSON.parse(quiz.questions) 
          : quiz.questions;
      }

      setQuizModal({
        isOpen: true,
        lessonId,
        lessonTitle,
        title: quiz?.title || 'Lesson Quiz',
        questions: parsedQuestions.length > 0 ? parsedQuestions : [{ question: '', options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]
      });
    } catch {
      toast.error('Failed to load quiz details.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (saving) return;
    if (!quizModal.title.trim()) {
      toast.error('Quiz title is required.');
      return;
    }
    for (let i = 0; i < quizModal.questions.length; i++) {
      const q = quizModal.questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} text cannot be empty.`);
        return;
      }
      if (q.options.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options.`);
        return;
      }
      const hasCorrect = q.options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        toast.error(`Please select a correct answer for Question ${i + 1}.`);
        return;
      }
      const hasEmptyOpt = q.options.some(opt => !opt.text.trim());
      if (hasEmptyOpt) {
        toast.error(`Option choices for Question ${i + 1} cannot be empty.`);
        return;
      }
    }

    setSaving(true);
    try {
      await api.post(`/tutors/me/lessons/${quizModal.lessonId}/quiz`, {
        title: quizModal.title,
        questions: quizModal.questions,
        pass_percentage: 70
      });
      toast.success('Quiz saved successfully!');
      setQuizModal({ isOpen: false, lessonId: null, lessonTitle: '', title: 'Lesson Quiz', questions: [] });
    } catch {
      toast.error('Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setQuizModal({
      ...quizModal,
      questions: [...quizModal.questions, { question: '', options: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }]
    });
  };

  const handleRemoveQuestion = (idx) => {
    setQuizModal({
      ...quizModal,
      questions: quizModal.questions.filter((_, i) => i !== idx)
    });
  };

  const handleQuestionTextChange = (qIdx, text) => {
    setQuizModal({
      ...quizModal,
      questions: quizModal.questions.map((q, idx) => idx === qIdx ? { ...q, question: text } : q)
    });
  };

  const handleAddOption = (qIdx) => {
    setQuizModal({
      ...quizModal,
      questions: quizModal.questions.map((q, idx) => {
        if (idx === qIdx) {
          return {
            ...q,
            options: [...q.options, { text: '', is_correct: false }]
          };
        }
        return q;
      })
    });
  };

  const handleRemoveOption = (qIdx, oIdx) => {
    setQuizModal({
      ...quizModal,
      questions: quizModal.questions.map((q, idx) => {
        if (idx === qIdx) {
          return {
            ...q,
            options: q.options.filter((_, oi) => oi !== oIdx)
          };
        }
        return q;
      })
    });
  };

  const handleOptionTextChange = (qIdx, oIdx, text) => {
    setQuizModal({
      ...quizModal,
      questions: quizModal.questions.map((q, idx) => {
        if (idx === qIdx) {
          return {
            ...q,
            options: q.options.map((o, oi) => oi === oIdx ? { ...o, text } : o)
          };
        }
        return q;
      })
    });
  };

  const handleOptionCorrectChange = (qIdx, correctOptIdx) => {
    setQuizModal({
      ...quizModal,
      questions: quizModal.questions.map((q, idx) => {
        if (idx === qIdx) {
          return {
            ...q,
            options: q.options.map((o, oi) => ({ ...o, is_correct: oi === correctOptIdx }))
          };
        }
        return q;
      })
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard/tutor/courses" className="flex items-center text-sm text-slate-500 hover:text-brand-500 transition-colors">
          <ChevronLeft className="h-4.5 w-4.5 mr-1" />
          <span>Back to Catalog</span>
        </Link>
        <div className="flex space-x-2 text-xs font-bold">
          <button
            onClick={() => setStep('metadata')}
            className={`px-4 py-2 rounded-xl transition-all ${
              step === 'metadata' ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-darkCard hover:bg-slate-200'
            }`}
          >
            1. Metadata
          </button>
          <button
            onClick={() => {
              if (isCreate) {
                toast.error('Save metadata first before building curriculum.');
              } else {
                setStep('curriculum');
              }
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              step === 'curriculum' ? 'bg-brand-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-darkCard hover:bg-slate-200'
            }`}
          >
            2. Curriculum Syllabus
          </button>
        </div>
      </div>

      {/* Published Course Info Banner */}
      {!isCreate && courseStatus.is_approved && courseStatus.status === 'published' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm">
          <Check className="h-4 w-4 shrink-0" />
          <span>
            <strong>This course is live & approved.</strong>{' '}
            You can freely edit metadata and curriculum — changes save immediately without affecting your published status or requiring re-approval.
          </span>
        </div>
      )}

      {step === 'metadata' ? (
        <form onSubmit={saveMetadata} className="glass-card p-6 space-y-6">
          <h2 className="text-xl font-extrabold">{isCreate ? 'Create New Course Bootcamp' : 'Edit Course Metadata'}</h2>

          {/* Form inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Course Title</label>
                <input
                  type="text"
                  name="title"
                  value={metadata.title}
                  onChange={handleMetadataChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Subtitle / Tagline</label>
                <input
                  type="text"
                  name="subtitle"
                  value={metadata.subtitle}
                  onChange={handleMetadataChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Course Description</label>
                <textarea
                  name="description"
                  value={metadata.description}
                  onChange={handleMetadataChange}
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100 leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Thumbnail upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Course Thumbnail Image</label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 aspect-video bg-slate-100 dark:bg-darkBg rounded-xl border border-slate-200 dark:border-darkBorder overflow-hidden flex items-center justify-center">
                    {metadata.thumbnail_url ? (
                      <img src={metadata.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <label className="cursor-pointer px-4 py-2 border border-slate-200 dark:border-darkBorder rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard text-xs font-bold flex items-center space-x-1.5">
                    <Upload className="h-4.5 w-4.5" />
                    <span>{uploadingFile ? 'Uploading...' : 'Choose Image'}</span>
                    <input type="file" onChange={handleThumbnailUpload} accept="image/*" className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
                  <select
                    name="category_id"
                    value={metadata.category_id}
                    onChange={handleMetadataChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Difficulty</label>
                  <select
                    name="difficulty"
                    value={metadata.difficulty}
                    onChange={handleMetadataChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="pro">Professional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Duration (Hours)</label>
                  <input
                    type="number"
                    name="duration_hours"
                    value={metadata.duration_hours}
                    onChange={handleMetadataChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Language</label>
                  <input
                    type="text"
                    name="language"
                    value={metadata.language}
                    onChange={handleMetadataChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-darkBorder/40">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Learning Outcomes (One per line)</label>
              <textarea
                name="learning_outcomes"
                value={metadata.learning_outcomes}
                onChange={handleMetadataChange}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100 leading-relaxed"
                placeholder="Build a dynamic React SPA&#10;Understand NodeJS Express REST APIs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Requirements / Prerequisites (One per line)</label>
              <textarea
                name="requirements"
                value={metadata.requirements}
                onChange={handleMetadataChange}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100 leading-relaxed"
                placeholder="Basic understanding of HTML & CSS&#10;Laptop with VSCode installed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t dark:border-darkBorder/40 pt-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_free"
                id="is_free"
                checked={metadata.is_free}
                onChange={handleMetadataChange}
                className="h-4 w-4 rounded bg-slate-100 border-slate-350 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="is_free" className="text-sm font-bold text-slate-700 dark:text-slate-300">This is a free course (TechSips Beta)</label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brand-500 text-white font-bold rounded-xl text-sm hover:bg-brand-600 disabled:opacity-60 transition-all shadow-lg"
            >
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save & Continue</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Course Curriculum Modules</h2>
              <p className="text-xs text-slate-400 mt-1">Structure modules, lessons, and assets.</p>
            </div>
            <button
              onClick={() => setModuleModal({ isOpen: true, editId: null, title: '', description: '' })}
              className="inline-flex items-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Plus className="h-4.5 w-4.5 mr-1" /> Add Module
            </button>
          </div>

          {/* Collapsible Modules list */}
          {modules.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400">
              <BookOpen className="h-10 w-10 mx-auto text-slate-500 mb-2 opacity-50" />
              <p>No modules created yet. Add a module to start building syllabus.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((mod, idx) => (
                <div key={mod.id} className="glass-card p-5 space-y-4 border dark:border-darkBorder/40">
                  <div className="flex items-center justify-between border-b dark:border-darkBorder/40 pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        Module {idx + 1}: {mod.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{mod.description || 'No description provided'}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setModuleModal({ isOpen: true, editId: mod.id, title: mod.title, description: mod.description })}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-darkCard dark:hover:bg-darkBg rounded-lg text-slate-500 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setLessonModal({ isOpen: true, editId: null, moduleId: mod.id, title: '', lesson_type: 'video', content_url: '', duration_mins: 15, is_preview: false })}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-brand-500/10 text-brand-500 hover:bg-brand-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Lesson</span>
                      </button>
                    </div>
                  </div>

                  {/* Lessons inside Module */}
                  <div className="space-y-2">
                    {mod.course_lessons && mod.course_lessons.length > 0 ? (
                      mod.course_lessons.map((les) => (
                        <div key={les.id} className="p-3 bg-slate-50 dark:bg-darkCard/50 border dark:border-darkBorder/30 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-darkCard transition-all">
                          <div className="flex items-center space-x-3 truncate">
                            {les.lesson_type === 'video' ? (
                              <Video className="h-4.5 w-4.5 text-brand-500 flex-shrink-0" />
                            ) : les.lesson_type === 'quiz' ? (
                              <HelpCircle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                            ) : les.lesson_type === 'assignment' ? (
                              <Upload className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4.5 w-4.5 text-brand-500 flex-shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="font-bold text-slate-800 dark:text-slate-200">{les.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{les.duration_mins} mins • {les.is_preview ? 'Previewable' : 'Locked'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {les.lesson_type === 'quiz' && (
                              <button
                                onClick={() => handleOpenQuizEditor(les.id, les.title)}
                                className="px-2 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded font-bold transition-all text-[10px]"
                              >
                                Manage Quiz
                              </button>
                            )}
                            {les.content_url && (
                              <a
                                href={normalizeUrl(les.content_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-slate-200 dark:hover:bg-darkBg rounded text-slate-400"
                              >
                                <Play className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => setLessonModal({ isOpen: true, editId: les.id, moduleId: mod.id, title: les.title, lesson_type: les.lesson_type, content_url: les.content_url, duration_mins: les.duration_mins, is_preview: les.is_preview })}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-darkBg rounded text-slate-500"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(mod.id, les.id)}
                              className="p-1 hover:bg-rose-100 rounded text-rose-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic pl-2">No lessons created in this module.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Module Modal */}
      {moduleModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-lg">{moduleModal.editId ? 'Edit Module' : 'Create Module'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Module Title</label>
                <input
                  type="text"
                  value={moduleModal.title}
                  onChange={(e) => setModuleModal({ ...moduleModal, title: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none"
                  placeholder="e.g. Setting up Environment"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Description</label>
                <textarea
                  value={moduleModal.description}
                  onChange={(e) => setModuleModal({ ...moduleModal, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none"
                  placeholder="Summary of what the student will build..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 text-xs font-bold">
              <button
                onClick={() => setModuleModal({ isOpen: false, editId: null, title: '', description: '' })}
                className="px-4 py-2 border dark:border-darkBorder rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModule}
                disabled={saving}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-60"
              >
                Save Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-lg">{lessonModal.editId ? 'Edit Lesson' : 'Create Lesson'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Lesson Title</label>
                <input
                  type="text"
                  value={lessonModal.title}
                  onChange={(e) => setLessonModal({ ...lessonModal, title: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none"
                  placeholder="e.g. Installing React"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Lesson Type</label>
                  <select
                    value={lessonModal.lesson_type}
                    onChange={(e) => setLessonModal({ ...lessonModal, lesson_type: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">Reading / PDF</option>
                    <option value="quiz">Interactive Quiz</option>
                    <option value="assignment">Assignment / Lab</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={lessonModal.duration_mins}
                    onChange={(e) => setLessonModal({ ...lessonModal, duration_mins: Number(e.target.value) })}
                    className="w-full px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Media URL / Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Content URL / File Upload</label>
                <input
                  type="text"
                  value={lessonModal.content_url}
                  onChange={(e) => setLessonModal({ ...lessonModal, content_url: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none text-xs"
                  placeholder="Paste URL or upload below"
                />

                <div className="pt-1.5">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-darkBorder rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard text-xs font-semibold">
                    <Upload className="h-4 w-4" />
                    <span>{uploadingFile ? 'Uploading File...' : 'Upload Lesson Media'}</span>
                    <input
                      type="file"
                      onChange={handleLessonUpload}
                      accept={lessonModal.lesson_type === 'video' ? 'video/*' : 'application/pdf'}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_preview"
                  checked={lessonModal.is_preview}
                  onChange={(e) => setLessonModal({ ...lessonModal, is_preview: e.target.checked })}
                  className="h-4 w-4 rounded bg-slate-100 text-brand-505"
                />
                <label htmlFor="is_preview" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Allow students to preview this lesson for free
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 text-xs font-bold">
              <button
                onClick={() => setLessonModal({ isOpen: false, editId: null, moduleId: null, title: '', lesson_type: 'video', content_url: '', duration_mins: 15, is_preview: false })}
                className="px-4 py-2 border dark:border-darkBorder rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLesson}
                className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-60"
                disabled={saving || uploadingFile}
              >
                Save Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Editor Modal ──────────────────────────────────────────────── */}
      {quizModal.isOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-darkBorder">
              <div>
                <h3 className="font-extrabold text-lg">Quiz Editor</h3>
                <p className="text-xs text-slate-400 mt-0.5">Lesson: {quizModal.lessonTitle}</p>
              </div>
              <button
                onClick={() => setQuizModal({ isOpen: false, lessonId: null, lessonTitle: '', title: 'Lesson Quiz', questions: [] })}
                className="p-2 hover:bg-slate-100 dark:hover:bg-darkCard rounded-xl transition-colors text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Quiz title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Quiz Title</label>
                <input
                  type="text"
                  value={quizModal.title}
                  onChange={(e) => setQuizModal({ ...quizModal, title: e.target.value })}
                  className="w-full px-4 py-2.5 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-all"
                  placeholder="e.g. Module 1 Knowledge Check"
                />
              </div>

              {/* Questions */}
              <div className="space-y-5">
                {quizModal.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-5 border dark:border-darkBorder rounded-2xl space-y-4 bg-slate-50 dark:bg-darkBg/40">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-lg">Q{qIdx + 1}</span>
                      {quizModal.questions.length > 1 && (
                        <button
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-rose-500 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Question</label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        className="w-full px-4 py-2 border dark:border-darkBorder bg-white dark:bg-darkCard rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-all"
                        placeholder="Type your question here..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">Answer Options <span className="text-slate-400 font-normal">(select the correct one)</span></label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            onClick={() => handleOptionCorrectChange(qIdx, oIdx)}
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all ${
                              opt.is_correct
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                            }`}
                            title="Mark as correct answer"
                          >
                            {opt.is_correct && <Check className="h-3 w-3 text-white mx-auto" />}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 border dark:border-darkBorder bg-white dark:bg-darkCard rounded-xl text-xs focus:outline-none focus:border-brand-500 transition-all"
                            placeholder={`Option ${oIdx + 1}`}
                          />
                          {q.options.length > 2 && (
                            <button
                              onClick={() => handleRemoveOption(qIdx, oIdx)}
                              className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {q.options.length < 6 && (
                        <button
                          onClick={() => handleAddOption(qIdx)}
                          className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 mt-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Option
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddQuestion}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 dark:border-darkBorder rounded-2xl text-xs font-bold text-slate-500 hover:border-brand-500 hover:text-brand-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Another Question
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t dark:border-darkBorder text-xs font-bold">
              <button
                onClick={() => setQuizModal({ isOpen: false, lessonId: null, lessonTitle: '', title: 'Lesson Quiz', questions: [] })}
                className="px-4 py-2 border dark:border-darkBorder rounded-xl hover:bg-slate-100 dark:hover:bg-darkCard"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={saving}
                className="px-5 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

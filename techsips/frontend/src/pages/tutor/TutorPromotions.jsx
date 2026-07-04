import React, { useEffect, useState } from 'react';
import { Sparkles, Megaphone, Send, ShieldAlert, Award, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function TutorPromotions() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedCourses();
  }, []);

  const fetchApprovedCourses = async () => {
    try {
      const response = await api.get('/tutors/me/courses');
      // Filter for approved but not sponsored yet
      const list = (response.data.data || []).filter(c => c.is_approved);
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourseId(list[0].id);
      }
    } catch {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setSubmitting(true);

    try {
      await api.post(`/tutors/me/courses/${selectedCourseId}/promote`, { message });
      toast.success('Promotion request submitted successfully!');
      setMessage('');
      fetchApprovedCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit promotion request.');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Premium Promotions</h1>
        <p className="text-sm text-slate-500 mt-1">Submit your approved courses for featured placement across our Landing catalog.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pitch Info panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-5 space-y-3 bg-gradient-to-br from-indigo-900/10 to-brand-900/10 border-brand-500/20">
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 inline-block">
              <Megaphone className="h-5 w-5" />
            </span>
            <h3 className="font-bold text-base">Why Sponsor?</h3>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start">
                <span className="text-brand-500 mr-1.5">•</span>
                <span>Get placed at the very top of search results and explore catalog.</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-500 mr-1.5">•</span>
                <span>Get a shiny violet "Sponsored" badge on your course details.</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-500 mr-1.5">•</span>
                <span>Tutors with sponsored badges receive up to 4x higher cohort enrollment rates.</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-5 space-y-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 inline-block">
              <Award className="h-5 w-5" />
            </span>
            <h3 className="font-bold text-base">Requirements</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To quality for sponsorship, your course must be fully approved by the admin team, contain a complete curriculum syllabus, and maintain at least 4.0 stars avg feedback.
            </p>
          </div>
        </div>

        {/* Submit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center space-x-1.5">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <span>Apply for Sponsored Placement</span>
            </h3>

            {courses.length === 0 ? (
              <div className="p-6 bg-slate-100 dark:bg-darkCard rounded-2xl border dark:border-darkBorder text-center text-sm text-slate-400 space-y-1.5">
                <ShieldAlert className="h-8 w-8 mx-auto text-slate-500" />
                <p>No eligible approved courses found.</p>
                <p className="text-xs text-slate-500">Wait for your draft courses to be verified and published by the administration.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Select Approved Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-4 py-2.5 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                    required
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Promotion Message / pitch for admins</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2.5 border dark:border-darkBorder bg-slate-50 dark:bg-darkBg rounded-xl text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100 leading-relaxed"
                    placeholder="Tell our administrators why this course deserves featured visibility..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-brand-500/10"
                >
                  {submitting ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Submit Sponsorship Request</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

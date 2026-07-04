import React, { useEffect, useState } from 'react';
import {
  Users, ShieldCheck, ShieldX, ExternalLink,
  Clock, Check, X, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AdminTutors() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTutors();
  }, []);

  const fetchPendingTutors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tutors/pending');
      setTutors(data.data || []);
    } catch {
      toast.error('Failed to load tutor applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (tutorId) => {
    try {
      await api.put(`/admin/tutors/${tutorId}/verify`, { status: 'approved' });
      toast.success('Tutor verified and approved!');
      fetchPendingTutors();
    } catch {
      toast.error('Verification failed.');
    }
  };

  const handleSuspend = async (tutorId) => {
    if (!window.confirm('Are you sure you want to suspend this tutor account?')) return;
    try {
      await api.put(`/admin/tutors/${tutorId}/suspend`, { suspend: true, reason: 'Suspended by admin' });
      toast.success('Tutor account suspended.');
      fetchPendingTutors();
    } catch {
      toast.error('Suspension failed.');
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Tutor Verification Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review instructor applications, check qualifications, and approve or suspend tutor access.
        </p>
      </div>

      {tutors.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <GraduationCap className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p className="font-semibold">No pending tutor applications.</p>
          <p className="text-xs mt-1 text-slate-500">All instructor verifications are up to date.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tutors.map((tutor) => (
            <div key={tutor.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {tutor.users?.avatar_url ? (
                  <img
                    src={tutor.users.avatar_url}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-darkBorder"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-extrabold text-xl">
                    {tutor.users?.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{tutor.users?.full_name}</h3>
                  <span className="flex items-center text-xs text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15 font-bold">
                    <Clock className="h-3 w-3 mr-1" />
                    {tutor.verification_status || 'pending'}
                  </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400">{tutor.users?.email}</p>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{tutor.bio}</p>

                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(tutor.skills) ? tutor.skills : []).slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-500 text-[10px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-slate-400 pt-1">
                  <span>{tutor.experience_years} yrs experience</span>
                  {tutor.whatsapp_number && <span>WhatsApp: {tutor.whatsapp_number}</span>}
                  {tutor.portfolio_url && (
                    <a
                      href={tutor.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-brand-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Portfolio
                    </a>
                  )}
                  {tutor.linkedin_url && (
                    <a
                      href={tutor.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-brand-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleVerify(tutor.user_id || tutor.id)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/10"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleSuspend(tutor.user_id || tutor.id)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-200 dark:border-rose-900/30 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  <ShieldX className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

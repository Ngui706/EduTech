import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, ShieldX, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingPromotions();
  }, []);

  const fetchPendingPromotions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/promotions/pending');
      setPromotions(data.data || []);
    } catch {
      toast.error('Failed to load promotion requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (promotionId) => {
    try {
      await api.put(`/admin/promotions/${promotionId}/approve`);
      toast.success('Course promotion approved — now featured!');
      fetchPendingPromotions();
    } catch {
      toast.error('Failed to approve promotion.');
    }
  };

  const handleReject = async (promotionId) => {
    try {
      await api.put(`/admin/promotions/${promotionId}/reject`);
      toast.success('Promotion request rejected.');
      fetchPendingPromotions();
    } catch {
      toast.error('Failed to reject promotion.');
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Promotion Request Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review tutor requests for sponsored/featured course placement on the homepage catalog.
        </p>
      </div>

      {promotions.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Sparkles className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p className="font-semibold">No pending promotion requests.</p>
          <p className="text-xs mt-1 text-slate-500">All sponsorship applications are processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Course Thumbnail */}
              <div className="sm:w-24 sm:h-20 aspect-video sm:aspect-auto bg-slate-100 dark:bg-darkBg rounded-xl overflow-hidden flex-shrink-0">
                {promo.courses?.thumbnail_url ? (
                  <img src={promo.courses.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-500/10 text-brand-500 font-bold text-sm">TS</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {promo.courses?.title}
                  </h3>
                  <span className="flex items-center text-xs text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/15 font-bold">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Submitted by: <span className="font-bold text-slate-700 dark:text-slate-300">
                    {promo.tutors?.users?.full_name || 'Tutor'}
                  </span>
                  {' · '}
                  {new Date(promo.created_at || Date.now()).toLocaleDateString()}
                </p>

                {promo.message && (
                  <div className="flex items-start space-x-2 p-3 bg-slate-50 dark:bg-darkCard rounded-xl border dark:border-darkBorder/30">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">"{promo.message}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(promo.id)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/10"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleReject(promo.id)}
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

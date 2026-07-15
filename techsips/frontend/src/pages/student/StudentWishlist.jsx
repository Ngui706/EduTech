import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function StudentWishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/students/wishlist');
      setWishlist(data.data || []);
    } catch (err) {
      console.warn('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (courseId) => {
    try {
      await api.delete(`/students/wishlist/${courseId}`);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (err) {
      toast.error('Failed to remove course');
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
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Wishlist</h1>
        <p className="text-sm text-slate-500 mt-1">Bootcamps you have saved for later.</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Heart className="h-12 w-12 mx-auto text-slate-500 mb-4 opacity-55" />
          <p>Your wishlist is empty.</p>
          <Link to="/courses" className="mt-4 inline-block px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm">
            Find Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlist.map((item) => (
            <div key={item.id} className="glass-card p-4 flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-16 h-12 bg-slate-100 dark:bg-darkBg rounded-lg overflow-hidden flex-shrink-0">
                  {item.courses?.thumbnail_url ? (
                    <img src={resolveMediaUrl(item.courses.thumbnail_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs">
                      TS
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.courses?.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {item.courses?.subtitle || 'Learn in-demand skills'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link
                  to={`/courses/${item.courses?.id}`}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-darkBg dark:hover:bg-darkCard text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => handleRemove(item.course_id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

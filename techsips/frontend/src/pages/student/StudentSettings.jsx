import React, { useState, useEffect } from 'react';
import { Camera, User, Phone, FileText, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function StudentSettings() {
  const { user, setUser, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    bio: '',
    phone_number: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || '',
        bio: user.students?.bio || '',
        phone_number: user.students?.phone_number || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgFormData = new FormData();
    imgFormData.append('file', file);
    setUploading(true);

    try {
      const response = await api.post('/upload/image', imgFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, avatar_url: response.data.url }));
      toast.success('Profile photo uploaded!');
    } catch (err) {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/students/profile', formData);
      toast.success('Profile updated successfully!');
      await checkAuth(); // Refresh local auth user state
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your personal credentials and public profile information.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        {/* Profile picture */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            {formData.avatar_url ? (
              <img
                src={resolveMediaUrl(formData.avatar_url)}
                alt=""
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200 dark:border-darkBorder"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-bold text-3xl">
                {formData.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-1.5 bg-brand-500 text-white rounded-lg cursor-pointer hover:bg-brand-600 transition-colors shadow-lg">
              <Camera className="h-4 w-4" />
              <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
            </label>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Profile Photo</h3>
            <p className="text-xs text-slate-400 mt-1">Upload a clean headshot (JPEG or PNG, max 5MB).</p>
            {uploading && (
              <div className="flex items-center space-x-2 text-xs text-brand-500 font-medium mt-1">
                <Loader className="h-3.5 w-3.5 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
              <User className="h-3.5 w-3.5 mr-1" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
              <Phone className="h-3.5 w-3.5 mr-1" />
              <span>Phone Number</span>
            </label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
              placeholder="+254 700 000000"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
            <FileText className="h-3.5 w-3.5 mr-1" />
            <span>Short Bio</span>
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100 leading-relaxed"
            placeholder="Tell us about yourself, your career path, and what skills you want to learn..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-brand-500/10"
        >
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

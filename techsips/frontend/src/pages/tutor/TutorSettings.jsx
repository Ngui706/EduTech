import React, { useState, useEffect } from 'react';
import { Camera, User, Phone, FileText, Globe, Linkedin, ShieldCheck, HelpCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import { resolveMediaUrl } from '../../utils/resolveUrl';

export default function TutorSettings() {
  const { user, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: '',
    bio: '',
    skills: '',
    experience_years: 0,
    portfolio_url: '',
    linkedin_url: '',
    whatsapp_number: '',
    phone_number: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || '',
        bio: user.tutors?.bio || '',
        skills: Array.isArray(user.tutors?.skills) ? user.tutors.skills.join(', ') : user.tutors?.skills || '',
        experience_years: user.tutors?.experience_years || 0,
        portfolio_url: user.tutors?.portfolio_url || '',
        linkedin_url: user.tutors?.linkedin_url || '',
        whatsapp_number: user.tutors?.whatsapp_number || '',
        phone_number: user.tutors?.phone_number || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
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
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Format skills string to array
    const skillsArray = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      skills: skillsArray
    };

    try {
      await api.put('/tutors/me/profile', payload);
      toast.success('Instructor profile updated successfully!');
      await checkAuth(); // Sync state
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Instructor Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your public credentials and professional contact channels.</p>
        </div>

        {user?.tutors?.verification_status === 'approved' ? (
          <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center space-x-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Tutor</span>
          </span>
        ) : (
          <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-500/20 flex items-center space-x-1">
            <HelpCircle className="h-4 w-4" />
            <span>Pending Verification</span>
          </span>
        )}
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
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Instructor Photo</h3>
            <p className="text-xs text-slate-400 mt-1">Upload a professional photo (JPEG or PNG, max 5MB).</p>
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
              <span>Contact Phone</span>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
              <Phone className="h-3.5 w-3.5 mr-1" />
              <span>WhatsApp Number</span>
            </label>
            <input
              type="text"
              name="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
              placeholder="+254 700 000000"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Experience (Years)</label>
            <input
              type="number"
              name="experience_years"
              value={formData.experience_years}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Skills & Focus Areas (Comma separated)</label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="React, Node.js, Python, TailwindCSS"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-850 dark:text-slate-100"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
              <Globe className="h-3.5 w-3.5 mr-1" />
              <span>Portfolio / GitHub Link</span>
            </label>
            <input
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              placeholder="https://github.com/myusername"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
              <Linkedin className="h-3.5 w-3.5 mr-1" />
              <span>LinkedIn Profile URL</span>
            </label>
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/myusername"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center">
            <FileText className="h-3.5 w-3.5 mr-1" />
            <span>Professional Bio</span>
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={5}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 transition-all text-slate-800 dark:text-slate-100 leading-relaxed"
            placeholder="Tell us about your teaching style, professional achievements, and core technologies..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full sm:w-auto px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-lg"
        >
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}

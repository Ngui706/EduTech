import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, password });
      toast.success('Password updated successfully! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative dark:bg-darkBg overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-brand-500 blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-indigo-500 blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full glass-card p-8 space-y-6 relative border dark:border-darkBorder/60 shadow-2xl">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2 justify-center mb-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tech<span className="text-brand-500">Sips</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Reset your password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter your email and choose a new secure password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-350"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
            {!loading && <ArrowRight className="h-4.5 w-4.5" />}
          </button>
        </form>

        <div className="text-center pt-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Remembered password? </span>
          <Link to="/login" className="font-bold text-brand-500 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

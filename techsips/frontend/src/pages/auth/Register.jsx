import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, User, Mail, Lock, Eye, EyeOff, CheckCircle, ExternalLink } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData.fullName, formData.email, formData.password, 'student');
      setRegisteredEmail(formData.email);
      setRegistered(true);
      toast.success('Registration successful! Please check your email to verify your account.');
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
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
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2 justify-center mb-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tech<span className="text-brand-500">Sips</span>
            </span>
          </Link>
          {!registered && (
            <>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Join as a Student</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Create an account to master skills, build projects, and earn.
              </p>
            </>
          )}
        </div>

        {registered ? (
          /* ── Email Verification Notice ── */
          <div className="text-center py-4 space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Account Created!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We've sent a verification email to:
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-darkBg px-4 py-2 rounded-xl text-sm">
                {registeredEmail}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Please check your inbox and verify your email address using the link sent by Supabase before logging in.
              </p>
            </div>

            <a
              href="https://edu-tech-virid.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open Verification Portal
            </a>

            <div className="pt-2">
              <Link to="/login" className="text-sm font-bold text-brand-500 hover:underline">
                Already verified? Log in →
              </Link>
            </div>
          </div>
        ) : (
          /* ── Registration Form ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                />
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 disabled:opacity-50"
            >
              <span>{loading ? "Registering..." : "Sign Up"}</span>
              {!loading && <ArrowRight className="h-4.5 w-4.5" />}
            </button>

            <div className="text-center pt-2 text-sm text-slate-500 dark:text-slate-400">
              <span>Already have an account? </span>
              <Link to="/login" className="font-bold text-brand-500 hover:underline">
                Log in here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

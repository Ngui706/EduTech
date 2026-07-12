import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowRight, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const RESET_URL = 'https://edu-tech-virid.vercel.app/';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    // Redirect user to the Vercel app where Supabase password reset is handled
    const resetLink = `${RESET_URL}?email=${encodeURIComponent(email)}`;
    toast.success('Redirecting you to the password reset page…');
    setSubmitted(true);
    setTimeout(() => {
      window.location.href = resetLink;
    }, 1200);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative dark:bg-darkBg overflow-hidden">
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
            Enter your email and we'll redirect you to our secure password reset page.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="h-14 w-14 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto">
              <ExternalLink className="h-7 w-7 text-brand-500" />
            </div>
            <p className="font-bold text-slate-800 dark:text-white">Redirecting…</p>
            <p className="text-sm text-slate-500">You will be redirected to our secure password reset page.</p>
            <a
              href={RESET_URL}
              className="inline-flex items-center gap-2 text-brand-500 hover:underline text-sm font-semibold"
            >
              Click here if not redirected
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
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

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg"
            >
              <span>Reset via Secure Portal</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You'll be redirected to our secure Supabase-powered password reset page at{' '}
                <a href={RESET_URL} className="font-semibold underline" target="_blank" rel="noopener noreferrer">
                  edu-tech-virid.vercel.app
                </a>
              </p>
            </div>
          </form>
        )}

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

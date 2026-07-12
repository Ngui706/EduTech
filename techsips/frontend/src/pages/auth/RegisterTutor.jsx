import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, User, Mail, Lock, Phone, HelpCircle, Briefcase, Plus, X, CheckCircle, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterTutor() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone_number: '',
    whatsapp_number: '',
    bio: '',
    skillsInput: '',
    experience_years: 0,
    portfolio_url: '',
    linkedin_url: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.bio.length < 50) {
      toast.error('Bio must be at least 50 characters long.');
      return;
    }

    setLoading(true);
    try {
      const skillsArray = formData.skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await api.post('/tutors/register', {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number,
        bio: formData.bio,
        skills: skillsArray,
        experience_years: parseInt(formData.experience_years),
        portfolio_url: formData.portfolio_url || null,
        linkedin_url: formData.linkedin_url || null,
      });

      const { user, token, refreshToken } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);

      toast.success('Application submitted! Please verify your email to continue.');
      setRegisteredEmail(formData.email);
      setRegistered(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative dark:bg-darkBg overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-[500px] pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-brand-500 blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-500 blur-[120px]"></div>
      </div>

      <div className="max-w-xl w-full glass-card p-8 space-y-6 relative border dark:border-darkBorder/60 shadow-2xl">
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
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Tutor Application</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {step === 1 ? 'Step 1: Account setup' : 'Step 2: Professional credentials'}
              </p>
            </>
          )}
        </div>

        {registered ? (
          /* Email Verification Notice */
          <div className="text-center py-4 space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-9 w-9 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Application Received!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We've sent a verification email to:
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-darkBg px-4 py-2 rounded-xl text-sm">
                {registeredEmail}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Please check your inbox and verify your email address using the link from Supabase first.
              </p>
              <p className="text-xs text-brand-500 font-semibold italic">
                Once verified, our administrators will review your credentials and approve your tutor access.
              </p>
            </div>

            <a
              href="https://edu-tech-virid.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg text-sm justify-center w-full sm:w-auto"
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
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="space-y-4">
            {step === 1 ? (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Dr. John Doe"
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
                      placeholder="e.g. john@techsips.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                    />
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="phone_number"
                        required
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="e.g. +254 700 000000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                      />
                      <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="whatsapp_number"
                        required
                        value={formData.whatsapp_number}
                        onChange={handleChange}
                        placeholder="e.g. +254 700 000000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                      />
                      <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills (comma-separated)</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="skillsInput"
                      required
                      value={formData.skillsInput}
                      onChange={handleChange}
                      placeholder="React, Node.js, Python, AWS"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                    />
                    <Briefcase className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Years of Experience</label>
                    <input
                      type="number"
                      name="experience_years"
                      required
                      value={formData.experience_years}
                      onChange={handleChange}
                      min={0}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Portfolio URL (Optional)</label>
                    <input
                      type="url"
                      name="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      placeholder="https://myportfolio.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">LinkedIn Profile URL (Optional)</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Biography (min 50 characters)</label>
                  <textarea
                    name="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about your professional background, teaching philosophy, and tech expertise..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500 text-slate-800 dark:text-slate-100"
                  ></textarea>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 border border-slate-200 dark:border-darkBorder hover:bg-slate-50 dark:hover:bg-darkCard rounded-xl font-bold transition-all text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 flex items-center justify-center space-x-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
                  >
                    <span>{loading ? 'Submitting...' : 'Apply Now'}</span>
                    {!loading && <ArrowRight className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="text-center pt-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-brand-500 hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}

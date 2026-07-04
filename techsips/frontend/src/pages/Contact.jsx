import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Your message has been sent successfully!');
    e.target.reset();
  };

  return (
    <div className="min-h-screen dark:bg-darkBg py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">Contact Us</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Have questions about student learning, corporate onboarding, or tutor partnerships? Get in touch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact Details */}
          <div className="space-y-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reach Out Directly</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Our support team answers tickets within 24 hours. Connect with us using the channels below:
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <span className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold">Email Support</div>
                  <div className="text-slate-500 dark:text-slate-400">support@techsips.com</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <span className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold">Call or WhatsApp</div>
                  <div className="text-slate-500 dark:text-slate-400">+254 700 000000</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm">
                <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold">Main Office</div>
                  <div className="text-slate-500 dark:text-slate-400">Nairobi, Kenya</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="glass-card p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your request..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none focus:border-brand-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/10"
              >
                <span>Send Message</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

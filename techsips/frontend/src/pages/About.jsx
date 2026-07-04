import React from 'react';
import { Target, Users, ShieldCheck, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen dark:bg-darkBg py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white">About TechSips</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Connecting aspiring builders with verified technology and digital skill mentors across Africa and Kenya.
          </p>
        </div>

        {/* Brand Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-card p-8 space-y-3">
            <span className="p-3 rounded-2xl bg-brand-500/10 text-brand-500 inline-block">
              <Target className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              To democratize technical and digital education in Africa by providing highly practical, structured, and mentored cohorts. We strive to make vocational technology education accessible, engaging, and directly correlated with local and global job placements.
            </p>
          </div>

          <div className="glass-card p-8 space-y-3">
            <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 inline-block">
              <Users className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              To become the leading platform for technical career acceleration in Africa. We envision a continent where youth can transition seamlessly from learning theoretical frameworks to building practical software solutions that command global earnings.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">Our Core Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 space-y-2 text-center">
              <span className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 inline-block">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h3 className="font-bold text-slate-950 dark:text-slate-100">Verification First</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every tutor is background-checked and credential-audited to ensure premium cohort mentoring.
              </p>
            </div>
            <div className="p-6 space-y-2 text-center">
              <span className="p-3 rounded-full bg-brand-500/10 text-brand-500 inline-block">
                <Target className="h-6 w-6" />
              </span>
              <h3 className="font-bold text-slate-950 dark:text-slate-100">Practical Portfolios</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Course modules require building tangible outputs like apps, scripts, and designs instead of just static tests.
              </p>
            </div>
            <div className="p-6 space-y-2 text-center">
              <span className="p-3 rounded-full bg-rose-500/10 text-rose-500 inline-block">
                <Heart className="h-6 w-6" />
              </span>
              <h3 className="font-bold text-slate-950 dark:text-slate-100">Kenyan & African Focus</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Built specifically to solve access, payment, and mentoring issues unique to the African digital workforce.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

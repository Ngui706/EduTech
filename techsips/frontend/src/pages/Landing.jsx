import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Award, Users, Play, Code, Bot, BarChart, ShieldAlert, Cloud, Smartphone, Palette, Megaphone, Briefcase } from 'lucide-react';
import api from '../api/axios';

const categoryIcons = {
  'Programming': Code,
  'Artificial Intelligence': Bot,
  'Data Science': BarChart,
  'Cybersecurity': ShieldAlert,
  'Cloud Computing': Cloud,
  'Mobile Development': Smartphone,
  'UI/UX Design': Palette,
  'Digital Marketing': Megaphone,
  'Business & Freelancing': Briefcase,
};

export default function Landing() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, catsRes] = await Promise.all([
          api.get('/courses'),
          api.get('/categories')
        ]);
        // Set courses (filter by featured/sponsored if any, fallback to first few)
        setFeatured(featuredRes.data.data.courses || []);
        setCategories(catsRes.data.data || []);
      } catch (err) {
        console.warn('Could not load landing data, using fallbacks');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden dark:bg-darkBg">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 dark:opacity-30">
        <div className="absolute top-[-10%] left-[20%] w-[35%] aspect-square rounded-full bg-brand-500 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] aspect-square rounded-full bg-indigo-500 blur-[100px]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-brand-500/20 bg-brand-500/10 text-brand-500 dark:text-brand-400 text-xs font-semibold tracking-wide uppercase animate-pulse-subtle">
            <span>Learn. Build. Earn.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Master In-Demand Tech Skills <br />
            <span className="text-gradient">From Verified Mentors</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            TechSips connects aspiring builders with seasoned professionals in Africa and Kenya. Join the cohort, compile code, build portfolios, and earn global client commissions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/courses"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-2xl transition-all duration-300 shadow-xl shadow-brand-500/20 hover:shadow-brand-500/35"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register/tutor"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 border border-slate-200 dark:border-darkBorder bg-white/50 dark:bg-darkCard/50 backdrop-blur text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-darkCard font-medium rounded-2xl transition-all duration-300"
            >
              <span>Become a Tutor</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-y border-slate-200/50 dark:border-darkBorder/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">10k+</div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Active Students</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">150+</div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Verified Tutors</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">98%</div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Completion Rate</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">2.5M+ KES</div>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Student Earnings</div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Browse by Category</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Find courses tailored to local and global tech market demands.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length > 0 ? (
            categories.map((cat) => {
              const Icon = categoryIcons[cat.name] || Code;
              return (
                <Link
                  key={cat.id}
                  to={`/courses?category=${cat.id}`}
                  className="glass-card p-6 flex items-start space-x-4 hover:border-brand-500/50"
                >
                  <span className="p-3 rounded-xl bg-brand-500/10 text-brand-500 dark:text-brand-400">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {cat.course_count || 0} active courses
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            [1, 2, 3].map((n) => (
              <div key={n} className="glass-card p-6 h-28 animate-pulse bg-slate-200 dark:bg-darkCard"></div>
            ))
          )}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-slate-100/40 dark:bg-darkCard/20 rounded-3xl mb-20 border border-slate-200/50 dark:border-darkBorder/40">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Popular Courses</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kickstart your career with our top-rated bootcamps.</p>
          </div>
          <Link to="/courses" className="text-sm font-semibold text-brand-500 hover:text-brand-600 flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.length > 0 ? (
            featured.slice(0, 3).map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`} className="glass-card flex flex-col h-full overflow-hidden group">
                <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-darkBg">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-500/10 text-brand-500 font-bold">
                      {course.title.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {course.is_sponsored && (
                    <span className="absolute top-3 left-3 bg-brand-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                      Sponsored
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                      {course.categories?.name || 'Tech'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-darkBg text-slate-600 dark:text-slate-300 capitalize">
                      {course.difficulty}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {course.subtitle || 'Master this skill and build modern applications.'}
                  </p>

                  <div className="flex items-center space-x-2 mt-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="ml-1 font-bold">{course.rating_avg || '5.0'}</span>
                    </div>
                    <span>•</span>
                    <span>{course.duration_hours || '0'} hrs</span>
                    <span>•</span>
                    <span>{course.enrollment_count || '0'} enrolled</span>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-darkBorder/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {course.users?.avatar_url ? (
                        <img src={course.users.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-darkBg flex items-center justify-center font-bold text-[10px]">
                          {course.users?.full_name?.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{course.users?.full_name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {course.is_free ? 'Free' : `${course.price} KES`}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            [1, 2, 3].map((n) => (
              <div key={n} className="glass-card h-80 animate-pulse bg-slate-200 dark:bg-darkCard"></div>
            ))
          )}
        </div>
      </section>

      {/* Highlights / Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="space-y-3">
          <span className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 inline-block">
            <Shield className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verified Local Mentors</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tutors are background-checked and hold industry qualifications before offering courses.
          </p>
        </div>
        <div className="space-y-3">
          <span className="p-3 rounded-2xl bg-brand-500/10 text-brand-500 inline-block">
            <Award className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verifiable Certificates</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Earn distinct verification hashes and shareable PDF credentials on 100% course completions.
          </p>
        </div>
        <div className="space-y-3">
          <span className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 inline-block">
            <Users className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Practical Project Cohorts</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Learn by building portfolios and executing tasks rather than passive listening.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-24">
        <div className="relative rounded-3xl bg-gradient-to-tr from-brand-700 to-indigo-600 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-[45%] aspect-square rounded-full bg-brand-400/20 blur-[90px]"></div>
          <div className="relative max-w-2xl text-left space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Ready to Accelerate Your Career in Tech?
            </h2>
            <p className="text-brand-100 text-sm sm:text-base">
              Create a free account, explore the catalog, find the perfect tutor, and start building software portfolios.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/register"
                className="px-8 py-3.5 bg-white text-brand-600 font-bold rounded-2xl hover:bg-brand-50 transition-colors shadow-lg text-center"
              >
                Sign Up as Student
              </Link>
              <Link
                to="/register/tutor"
                className="px-8 py-3.5 border border-white/40 hover:bg-white/10 text-white font-medium rounded-2xl transition-all text-center"
              >
                Become a Tutor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

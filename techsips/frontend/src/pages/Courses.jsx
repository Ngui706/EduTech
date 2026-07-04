import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import api from '../api/axios';

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
    // Update URL params
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    if (page > 1) params.page = page.toString();
    setSearchParams(params);
  }, [search, category, difficulty, page]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (err) {
      console.warn('Failed to load categories');
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses', {
        params: {
          search,
          category,
          difficulty,
          page,
          limit: 9,
        },
      });
      setCourses(data.data.courses || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.warn('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setDifficulty('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 dark:bg-darkBg min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Explore Courses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upgrade your skills with our industry-led modules.</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-darkBorder bg-white dark:bg-darkCard text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b dark:border-darkBorder">
              <span className="font-bold text-sm flex items-center space-x-1.5">
                <SlidersHorizontal className="h-4 w-4 text-brand-500" />
                <span>Filters</span>
              </span>
              <button onClick={resetFilters} className="text-xs font-semibold text-brand-500 hover:underline">
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-darkBg text-sm focus:outline-none"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="pro">Professional</option>
              </select>
            </div>
          </div>
        </div>

        {/* Courses Listing */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="glass-card h-80 animate-pulse bg-slate-200 dark:bg-darkCard"></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 glass-card">
              <p className="text-slate-400">No courses match your active filters.</p>
              <button onClick={resetFilters} className="mt-4 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold">
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
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
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-10">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-darkBorder hover:bg-slate-50 dark:hover:bg-darkCard disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-darkBorder hover:bg-slate-50 dark:hover:bg-darkCard disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

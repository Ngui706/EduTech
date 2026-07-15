import { supabase } from '../config/supabase.js';
import { sendEmail } from '../config/email.js';
import { parseComment } from './review.controller.js';

// ── Get All Courses (paginated + filtered) ────────────────────────────────────
export const getCourses = async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    difficulty,
    search,
    sort = 'created_at',
    order = 'desc',
    min_rating,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let queryBuilder = supabase
    .from('courses')
    .select(`
      id, title, subtitle, slug, thumbnail_url, difficulty,
      duration_hours, language, is_free, price, rating_avg,
      rating_count, enrollment_count, is_featured, is_sponsored,
      created_at,
      categories(id, name, slug),
      users!tutor_id(
        id,
        full_name,
        avatar_url,
        tutors(
          verification_status
        )
      )
    `, { count: 'exact' })
    .eq('status', 'published')
    .eq('is_approved', true)
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + parseInt(limit) - 1);

  if (category) queryBuilder = queryBuilder.eq('category_id', category);
  if (difficulty) queryBuilder = queryBuilder.eq('difficulty', difficulty);
  if (search) queryBuilder = queryBuilder.ilike('title', `%${search}%`);
  if (min_rating) queryBuilder = queryBuilder.gte('rating_avg', parseFloat(min_rating));

  const { data: courses, error, count } = await queryBuilder;

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch courses' });

  res.json({
    success: true,
    data: {
      courses,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    },
  });
};

// ── Get Single Course ─────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  const { id } = req.params;

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
  *,
  categories(id, name, slug),
  users!tutor_id(
    id,
    full_name,
    avatar_url,
    tutors(
      id,
      bio,
      whatsapp_number,
      linkedin_url,
      portfolio_url,
      verification_status
    )
  ),
  course_modules(
    id,
    title,
    order_index,
    course_lessons(
      id,
      title,
      lesson_type,
      duration_mins,
      is_preview,
      order_index
    )
  )
`)
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error || !course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // If the course is not published or not approved, restrict access to owner tutor or admin
  if (course.status !== 'published' || !course.is_approved) {
    const isOwner = req.user && course.tutor_id === req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
  }

  // Check if requesting user is enrolled
  let isEnrolled = false;
  if (req.user) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', req.user.id)
      .single();
    isEnrolled = !!enrollment;
  }

  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users(id, full_name, avatar_url)')
    .eq('course_id', course.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const formattedReviews = (reviews || []).map((review) => {
    const { category, comment } = parseComment(review.comment);
    return {
      ...review,
      category,
      comment
    };
  });

  res.json({ success: true, data: { ...course, isEnrolled, reviews: formattedReviews } });
};

// ── Get Course Content (enrolled students only) ───────────────────────────────
export const getCourseContent = async (req, res) => {
  const { id } = req.params;

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, progress_percentage, completed_at')
    .eq('course_id', id)
    .eq('student_id', req.user.id)
    .single();

  // Allow tutor and admin to access
  const { data: course } = await supabase
    .from('courses')
    .select('tutor_id')
    .eq('id', id)
    .single();

  if (!enrollment && req.user.role === 'student') {
    return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
  }

  const { data: modules, error } = await supabase
    .from('course_modules')
    .select(`
      id, title, description, order_index,
      course_lessons(
        id, title, lesson_type, content_url, duration_mins, order_index,
        course_resources(id, title, file_url, file_type),
        course_assignments(id, title, description, due_days),
        course_quizzes(id, title, questions)
      )
    `)
    .eq('course_id', id)
    .order('order_index');

  if (error) return res.status(500).json({ success: false, message: 'Failed to load course content' });

  // Get lesson progress for student
  let lessonProgress = [];
  if (enrollment) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, watch_time_secs')
      .eq('enrollment_id', enrollment.id);
    lessonProgress = progress || [];
  }

  res.json({ success: true, data: { modules, enrollment, lessonProgress } });
};

// ── Enroll ────────────────────────────────────────────────────────────────────
export const enrollInCourse = async (req, res) => {
  const { id: course_id } = req.params;
  const student_id = req.user.id;

  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can enroll' });
  }

  // Check course exists and is free (no payments in v1)
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, is_approved, status')
    .eq('id', course_id)
    .eq('status', 'published')
    .eq('is_approved', true)
    .single();

  if (!course) return res.status(404).json({ success: false, message: 'Course not found or not available' });

  // Check already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', course_id)
    .eq('student_id', student_id)
    .single();

  if (existing) return res.status(409).json({ success: false, message: 'Already enrolled in this course' });

  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .insert({ course_id, student_id, progress_percentage: 0 })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: 'Enrollment failed' });

  // Update enrollment count
  await supabase.rpc('increment_enrollment_count', { course_id });

  // Notify tutor
  const { data: courseData } = await supabase
    .from('courses')
    .select('tutor_id, title')
    .eq('id', course_id)
    .single();

  if (courseData) {
    await supabase.from('notifications').insert({
      user_id: courseData.tutor_id,
      title: 'New Enrollment',
      message: `A new student enrolled in "${courseData.title}"`,
      type: 'enrollment',
      link: `/dashboard/tutor/courses`,
    });

    // Send email to tutor about the new enrollment
    const { data: tutorUser } = await supabase.from('users').select('email, full_name').eq('id', courseData.tutor_id).single();
    const { data: studentUser } = await supabase.from('users').select('full_name, email').eq('id', student_id).single();
    if (tutorUser) {
      await sendEmail({
        to: tutorUser.email,
        subject: `🎓 New Student Enrolled – ${courseData.title}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#6366f1;">🎓 New Enrollment!</h2>
            <p>Dear <strong>${tutorUser.full_name}</strong>,</p>
            <p>A new student has enrolled in your course:</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;"><strong>Course:</strong> ${courseData.title}</p>
              ${studentUser ? `<p style="margin:8px 0 0;"><strong>Student:</strong> ${studentUser.full_name} (${studentUser.email})</p>` : ''}
            </div>
            <a href="${process.env.FRONTEND_URL || 'https://edu-tech-virid.vercel.app'}/dashboard/tutor/students"
               style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
              View Your Students
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">TechSips – Empowering Africa's Tech Talent</p>
          </div>`,
      });
    }
  }

  res.status(201).json({ success: true, message: 'Enrolled successfully', data: enrollment });
};

// ── Featured Courses ──────────────────────────────────────────────────────────
export const getFeaturedCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, title, subtitle, thumbnail_url, difficulty, duration_hours,
      rating_avg, rating_count, enrollment_count, is_sponsored,
      categories(id, name),
      users!tutor_id(
        id,
        full_name,
        avatar_url,
        tutors(
          verification_status
        )
      )
    `)
    .eq('status', 'published')
    .eq('is_approved', true)
    .eq('is_featured', true)
    .order('enrollment_count', { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch featured courses' });

  res.json({ success: true, data });
};

// ── Sponsored Courses ─────────────────────────────────────────────────────────
export const getSponsoredCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, title, subtitle, thumbnail_url, difficulty, duration_hours,
      rating_avg, enrollment_count,
      categories(id, name),
      users!tutor_id(
        id,
        full_name,
        avatar_url,
        tutors(
          verification_status
        )
      )
    `)
    .eq('status', 'published')
    .eq('is_approved', true)
    .eq('is_sponsored', true)
    .order('sponsored_at', { ascending: false })
    .limit(6);

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch sponsored courses' });

  res.json({ success: true, data });
};

// ── Search ────────────────────────────────────────────────────────────────────
export const searchCourses = async (req, res) => {
  const { q, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data, error, count } = await supabase
    .from('courses')
    .select(`
      id, title, subtitle, thumbnail_url, difficulty, duration_hours,
      rating_avg, enrollment_count,
      categories(id, name),
      users!tutor_id(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'published')
    .eq('is_approved', true)
    .or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,description.ilike.%${q}%`)
    .order('enrollment_count', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) return res.status(500).json({ success: false, message: 'Search failed' });

  res.json({
    success: true,
    data: {
      courses: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    },
  });
};

// ── Get Categories ────────────────────────────────────────────────────────────
export const getCategories = async (req, res) => {
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description')
    .eq('is_active', true)
    .order('name');

  if (catError) return res.status(500).json({ success: false, message: 'Failed to fetch categories' });

  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('category_id')
    .eq('status', 'published')
    .eq('is_approved', true);

  if (courseError) return res.status(500).json({ success: false, message: 'Failed to fetch course counts' });

  const counts = {};
  if (courses) {
    for (const c of courses) {
      if (c.category_id) {
        counts[c.category_id] = (counts[c.category_id] || 0) + 1;
      }
    }
  }

  const result = categories.map((cat) => ({
    ...cat,
    course_count: counts[cat.id] || 0,
  }));

  res.json({ success: true, data: result });
};

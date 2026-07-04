import { supabase } from '../config/supabase.js';

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const getAdminDashboard = async (req, res) => {
  const [students, tutors, courses, enrollments, pendingTutors, pendingCourses, pendingPromotions] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student'),
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'tutor'),
    supabase.from('courses').select('id', { count: 'exact' }),
    supabase.from('enrollments').select('id', { count: 'exact' }),
    supabase.from('tutors').select('id', { count: 'exact' }).eq('verification_status', 'pending'),
    supabase.from('courses').select('id', { count: 'exact' }).eq('status', 'pending'),
    supabase.from('promotion_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
  ]);

  // Recent enrollments (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentEnrollments } = await supabase
    .from('enrollments').select('id', { count: 'exact' }).gte('enrolled_at', thirtyDaysAgo);

  res.json({
    success: true,
    data: {
      totalStudents: students.count || 0,
      totalTutors: tutors.count || 0,
      totalCourses: courses.count || 0,
      totalEnrollments: enrollments.count || 0,
      pendingTutorApprovals: pendingTutors.count || 0,
      pendingCourseApprovals: pendingCourses.count || 0,
      pendingPromotions: pendingPromotions.count || 0,
      recentEnrollments: recentEnrollments || 0,
    },
  });
};

// ── Tutor Management ──────────────────────────────────────────────────────────
export const getPendingTutors = async (req, res) => {
  const { data, error } = await supabase
    .from('tutors')
    .select(`
      id, user_id, bio, skills, experience_years, linkedin_url, portfolio_url,
      whatsapp_number, phone_number, national_id_url, certificates_urls, created_at, verification_status,
      users!user_id(id, full_name, email, avatar_url, created_at)
    `)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch pending tutors' });
  res.json({ success: true, data });
};

export const verifyTutor = async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
  }

  // Support both tutor row id and user_id — try user_id first, then fall back to row id
  let { data: tutor } = await supabase
    .from('tutors').select('id, user_id').eq('user_id', id).single();

  if (!tutor) {
    // Caller may have passed the tutors table row id instead of user_id
    const { data: tutorByRowId } = await supabase
      .from('tutors').select('id, user_id').eq('id', id).single();
    tutor = tutorByRowId;
  }

  if (!tutor) return res.status(404).json({ success: false, message: 'Tutor not found' });

  const userId = tutor.user_id;

  await supabase.from('tutors').update({ verification_status: status, rejection_reason }).eq('user_id', userId);

  // Notify tutor
  const message = status === 'approved'
    ? '🎉 Congratulations! Your tutor application has been approved. You can now create courses.'
    : `Your tutor application was rejected. Reason: ${rejection_reason || 'Does not meet requirements'}`;

  await supabase.from('notifications').insert({
    user_id: userId,
    title: status === 'approved' ? 'Application Approved!' : 'Application Update',
    message,
    type: 'verification',
    link: '/dashboard/tutor',
  });

  await supabase.from('activity_logs').insert({
    user_id: req.user.id,
    action: `TUTOR_${status.toUpperCase()}`,
    details: { tutor_user_id: userId, rejection_reason },
  });

  res.json({ success: true, message: `Tutor ${status}` });
};

export const suspendTutor = async (req, res) => {
  const { id } = req.params;
  const { suspend, reason } = req.body;

  await supabase.from('users').update({ is_suspended: suspend }).eq('id', id);

  await supabase.from('notifications').insert({
    user_id: id,
    title: suspend ? 'Account Suspended' : 'Account Restored',
    message: suspend
      ? `Your account has been suspended. Reason: ${reason}`
      : 'Your account suspension has been lifted.',
    type: 'account',
  });

  res.json({ success: true, message: `Tutor ${suspend ? 'suspended' : 'restored'}` });
};

// ── Course Management ─────────────────────────────────────────────────────────
export const getPendingCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *, categories(name),
      users!tutor_id(id, full_name, email, avatar_url),
      course_modules(id, title, course_lessons(id))
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch' });
  res.json({ success: true, data });
};

export const approveCourse = async (req, res) => {
  const { id } = req.params;

  const { data: course } = await supabase
    .from('courses').select('tutor_id, title').eq('id', id).single();

  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  await supabase.from('courses').update({ status: 'published', is_approved: true }).eq('id', id);

  await supabase.from('notifications').insert({
    user_id: course.tutor_id,
    title: '✅ Course Approved!',
    message: `Your course "${course.title}" has been approved and is now live.`,
    type: 'course_approved',
    link: `/dashboard/tutor/courses`,
  });

  await supabase.from('activity_logs').insert({
    user_id: req.user.id, action: 'COURSE_APPROVED', details: { course_id: id },
  });

  res.json({ success: true, message: 'Course approved and published' });
};

export const rejectCourse = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const { data: course } = await supabase
    .from('courses').select('tutor_id, title').eq('id', id).single();

  await supabase.from('courses').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);

  await supabase.from('notifications').insert({
    user_id: course.tutor_id,
    title: 'Course Rejected',
    message: `Your course "${course.title}" was rejected. Reason: ${reason}`,
    type: 'course_rejected',
    link: `/dashboard/tutor/courses/${id}`,
  });

  res.json({ success: true, message: 'Course rejected' });
};

export const deleteCourseAdmin = async (req, res) => {
  await supabase.from('courses').delete().eq('id', req.params.id);
  res.json({ success: true, message: 'Course deleted' });
};

export const featureCourse = async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;
  await supabase.from('courses').update({ is_featured: featured }).eq('id', id);
  res.json({ success: true, message: `Course ${featured ? 'featured' : 'unfeatured'}` });
};

// ── Promotion Management ──────────────────────────────────────────────────────
export const getPendingPromotions = async (req, res) => {
  const { data, error } = await supabase
    .from('promotion_requests')
    .select(`
      id, message, status, created_at,
      courses(id, title, thumbnail_url, enrollment_count, rating_avg),
      users!tutor_id(id, full_name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch' });
  res.json({ success: true, data });
};

export const approvePromotion = async (req, res) => {
  const { id } = req.params;

  const { data: promo } = await supabase
    .from('promotion_requests').select('course_id, tutor_id').eq('id', id).single();

  if (!promo) return res.status(404).json({ success: false, message: 'Promotion request not found' });

  await supabase.from('promotion_requests').update({ status: 'approved' }).eq('id', id);
  await supabase.from('courses').update({
    is_sponsored: true, sponsored_at: new Date().toISOString(),
  }).eq('id', promo.course_id);

  await supabase.from('notifications').insert({
    user_id: promo.tutor_id,
    title: '🚀 Course Sponsored!',
    message: 'Your course promotion request was approved. Your course is now featured on the homepage.',
    type: 'promotion_approved',
    link: '/dashboard/tutor/promotions',
  });

  res.json({ success: true, message: 'Promotion approved' });
};

export const rejectPromotion = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const { data: promo } = await supabase
    .from('promotion_requests').select('tutor_id').eq('id', id).single();

  await supabase.from('promotion_requests').update({ status: 'rejected', admin_note: reason }).eq('id', id);

  await supabase.from('notifications').insert({
    user_id: promo.tutor_id,
    title: 'Promotion Request Rejected',
    message: `Your promotion request was rejected. Reason: ${reason}`,
    type: 'promotion_rejected',
    link: '/dashboard/tutor/promotions',
  });

  res.json({ success: true, message: 'Promotion rejected' });
};

// ── User Management ───────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = supabase
    .from('users')
    .select('id, full_name, email, role, is_active, is_suspended, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (role) query = query.eq('role', role);
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch users' });

  res.json({
    success: true,
    data: {
      users: data,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
    },
  });
};

export const deleteUser = async (req, res) => {
  await supabase.from('users').delete().eq('id', req.params.id);
  res.json({ success: true, message: 'User deleted' });
};

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const getActivityLogs = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data, error, count } = await supabase
    .from('activity_logs')
    .select('id, action, details, created_at, users(id, full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  res.json({ success: true, data: { logs: data, pagination: { total: count, page: parseInt(page) } } });
};

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch' });
  res.json({ success: true, data });
};

export const createCategory = async (req, res) => {
  const { name, icon, description } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const { data, error } = await supabase
    .from('categories').insert({ name, slug, icon, description }).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Failed to create category' });
  res.status(201).json({ success: true, data });
};

export const updateCategory = async (req, res) => {
  const { name, icon, description, is_active } = req.body;
  const { data, error } = await supabase
    .from('categories').update({ name, icon, description, is_active }).eq('id', req.params.id).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Update failed' });
  res.json({ success: true, data });
};

export const deleteCategory = async (req, res) => {
  await supabase.from('categories').delete().eq('id', req.params.id);
  res.json({ success: true, message: 'Category deleted' });
};

// ── Platform Settings ─────────────────────────────────────────────────────────
export const getPlatformSettings = async (req, res) => {
  const { data, error } = await supabase.from('platform_settings').select('*');
  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch settings' });

  const settings = Object.fromEntries((data || []).map((s) => [s.key, s.value]));
  res.json({ success: true, data: settings });
};

export const updatePlatformSettings = async (req, res) => {
  const settings = req.body;
  const upserts = Object.entries(settings).map(([key, value]) => ({ key, value }));

  const { error } = await supabase.from('platform_settings').upsert(upserts, { onConflict: 'key' });
  if (error) return res.status(500).json({ success: false, message: 'Failed to update settings' });

  res.json({ success: true, message: 'Settings updated' });
};

// ── All Tutors with Their Courses ─────────────────────────────────────────────
export const getTutorsWithCourses = async (req, res) => {
  // Fetch all approved tutors (users with role = tutor)
  const { data: tutorUsers, error: userErr } = await supabase
    .from('users')
    .select(`
      id, full_name, email, avatar_url, created_at, is_active,
      tutors(
        id, bio, skills, experience_years, verification_status,
        whatsapp_number, linkedin_url, portfolio_url
      )
    `)
    .eq('role', 'tutor')
    .order('created_at', { ascending: false });

  if (userErr) return res.status(500).json({ success: false, message: 'Failed to fetch tutors' });

  // Fetch all courses for these tutors in one query (including enrollment counts)
  const tutorIds = (tutorUsers || []).map((u) => u.id);

  let courses = [];
  if (tutorIds.length > 0) {
    const { data: courseData, error: courseErr } = await supabase
      .from('courses')
      .select(`
        id, title, slug, thumbnail_url, difficulty, status, is_approved,
        is_free, price, rating_avg, rating_count, enrollment_count,
        created_at, tutor_id,
        categories(id, name)
      `)
      .in('tutor_id', tutorIds)
      .order('created_at', { ascending: false });

    if (!courseErr) courses = courseData || [];
  }

  // Group courses by tutor_id
  const coursesByTutor = {};
  for (const c of courses) {
    if (!coursesByTutor[c.tutor_id]) coursesByTutor[c.tutor_id] = [];
    coursesByTutor[c.tutor_id].push(c);
  }

  // Merge into response
  const result = (tutorUsers || []).map((u) => ({
    ...u,
    tutor_profile: u.tutors?.[0] || null,
    courses: coursesByTutor[u.id] || [],
    total_courses: (coursesByTutor[u.id] || []).length,
    published_courses: (coursesByTutor[u.id] || []).filter(
      (c) => c.status === 'published' && c.is_approved
    ).length,
    total_enrollments: (coursesByTutor[u.id] || []).reduce(
      (sum, c) => sum + (c.enrollment_count || 0), 0
    ),
  }));

  res.json({ success: true, data: result });
};

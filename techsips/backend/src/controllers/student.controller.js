import { supabase } from '../config/supabase.js';

export const getStudentDashboard = async (req, res) => {
  const userId = req.user.id;

  const [enrollments, completedCourses, certificates] = await Promise.all([
    supabase.from('enrollments').select('id, progress_percentage, enrolled_at, courses(id, title, thumbnail_url, duration_hours)').eq('student_id', userId).order('enrolled_at', { ascending: false }).limit(5),
    supabase.from('enrollments').select('id', { count: 'exact' }).eq('student_id', userId).not('completed_at', 'is', null),
    supabase.from('certificates').select('id', { count: 'exact' }).eq('student_id', userId),
  ]);

  res.json({
    success: true,
    data: {
      recentEnrollments: enrollments.data || [],
      totalEnrollments: enrollments.count || 0,
      completedCourses: completedCourses.count || 0,
      totalCertificates: certificates.count || 0,
    },
  });
};

export const getStudentEnrollments = async (req, res) => {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id, progress_percentage, enrolled_at, completed_at, courses(id, title, subtitle, thumbnail_url, duration_hours, difficulty, categories(name), users!tutor_id(full_name))')
    .eq('student_id', req.user.id)
    .order('enrolled_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch enrollments' });
  res.json({ success: true, data });
};

export const updateLessonProgress = async (req, res) => {
  const { lesson_id, enrollment_id, completed, watch_time_secs } = req.body;

  const { error } = await supabase
    .from('lesson_progress')
    .upsert({ lesson_id, enrollment_id, completed, watch_time_secs }, { onConflict: 'lesson_id,enrollment_id' });

  if (error) return res.status(500).json({ success: false, message: 'Progress update failed' });

  // Recalculate overall progress
  const { data: enrollment } = await supabase
    .from('enrollments').select('course_id').eq('id', enrollment_id).single();

  if (enrollment) {
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('id, course_modules!inner(course_id)')
      .eq('course_modules.course_id', enrollment.course_id);
    const totalLessons = lessons ? lessons.length : 0;

    const { count: completedLessons } = await supabase
      .from('lesson_progress')
      .select('id', { count: 'exact' })
      .eq('enrollment_id', enrollment_id)
      .eq('completed', true);

    if (totalLessons) {
      const progress = Math.round((completedLessons / totalLessons) * 100);

      await supabase.from('enrollments')
        .update({ progress_percentage: progress })
        .eq('id', enrollment_id);
    }
  }

  res.json({ success: true, message: 'Progress updated' });
};

export const getStudentCertificates = async (req, res) => {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, certificate_code, issued_at, courses(id, title, thumbnail_url, users!tutor_id(full_name)), users!student_id(full_name)')
    .eq('student_id', req.user.id)
    .order('issued_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  res.json({ success: true, data });
};

export const getWishlist = async (req, res) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select('id, created_at, courses(id, title, thumbnail_url, rating_avg, enrollment_count, difficulty, categories(name), users!tutor_id(full_name))')
    .eq('student_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  res.json({ success: true, data });
};

export const addToWishlist = async (req, res) => {
  const { course_id } = req.body;

  const { data: existing } = await supabase
    .from('wishlist').select('id').eq('student_id', req.user.id).eq('course_id', course_id).single();

  if (existing) return res.status(409).json({ success: false, message: 'Already in wishlist' });

  const { data, error } = await supabase
    .from('wishlist').insert({ student_id: req.user.id, course_id }).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  res.status(201).json({ success: true, data });
};

export const removeFromWishlist = async (req, res) => {
  await supabase.from('wishlist')
    .delete().eq('student_id', req.user.id).eq('course_id', req.params.courseId);
  res.json({ success: true, message: 'Removed from wishlist' });
};

export const updateStudentProfile = async (req, res) => {
  const { full_name, avatar_url, bio, phone_number } = req.body;

  await supabase.from('users').update({ full_name, avatar_url }).eq('id', req.user.id);
  await supabase.from('students').update({ bio, phone_number }).eq('user_id', req.user.id);

  res.json({ success: true, message: 'Profile updated' });
};

export const getStudentNotifications = async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  res.json({ success: true, data });
};

export const markNotificationRead = async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ success: true, message: 'Marked as read' });
};

export const completeEnrollment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('id, progress_percentage, course_id, student_id')
    .eq('id', id)
    .single();

  if (error || !enrollment) {
    return res.status(404).json({ success: false, message: 'Enrollment not found' });
  }

  if (enrollment.student_id !== userId) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (enrollment.progress_percentage !== 100) {
    return res.status(400).json({ success: false, message: 'Course progress must be 100% to complete' });
  }

  const completedAt = new Date().toISOString();
  await supabase
    .from('enrollments')
    .update({ completed_at: completedAt })
    .eq('id', id);

  const { data: existingCert } = await supabase
    .from('certificates')
    .select('id')
    .eq('enrollment_id', id)
    .maybeSingle();

  if (!existingCert) {
    const { v4: uuidv4 } = await import('uuid');
    await supabase.from('certificates').insert({
      student_id: userId,
      course_id: enrollment.course_id,
      enrollment_id: id,
      certificate_code: `TSIPS-${uuidv4().substring(0, 8).toUpperCase()}`,
    });
  }

  res.json({ success: true, message: 'Course marked as completed!', completed_at: completedAt });
};

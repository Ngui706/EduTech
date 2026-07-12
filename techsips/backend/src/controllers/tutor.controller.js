import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { generateTokenPair } from '../config/jwt.js';
import { sendEmail, getAdminEmails } from '../config/email.js';

// ── Register Tutor ────────────────────────────────────────────────────────────
export const registerTutor = async (req, res) => {
  const {
    full_name, email, password, phone_number, whatsapp_number,
    bio, skills, experience_years, portfolio_url, linkedin_url,
  } = req.body;

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, 12);
  const userId = uuidv4();

  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({ id: userId, full_name, email, password_hash, role: 'tutor', is_active: true })
    .select('id, full_name, email, role')
    .single();

  if (userError) return res.status(500).json({ success: false, message: 'Registration failed' });

  const { error: tutorError } = await supabase.from('tutors').insert({
    user_id: userId,
    phone_number,
    whatsapp_number,
    bio,
    skills,
    experience_years,
    portfolio_url,
    linkedin_url,
    verification_status: 'pending',
  });

  if (tutorError) {
    await supabase.from('users').delete().eq('id', userId);
    return res.status(500).json({ success: false, message: 'Profile creation failed' });
  }

  // Notify admins (in-app + email)
  const { data: admins } = await supabase.from('users').select('id, email').eq('role', 'admin');
  if (admins && admins.length > 0) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      title: 'New Tutor Application',
      message: `${full_name} has applied to become a tutor. Review their application.`,
      type: 'tutor_application',
      link: '/dashboard/admin/tutors',
    }));
    await supabase.from('notifications').insert(notifications);

    // Send email to each admin
    const adminEmailList = admins.map((a) => a.email).filter(Boolean);
    for (const adminEmail of adminEmailList) {
      await sendEmail({
        to: adminEmail,
        subject: '🆕 New Tutor Application – TechSips',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#6366f1;">New Tutor Application</h2>
            <p>A new tutor has submitted an application on <strong>TechSips</strong> and is pending your review.</p>
            <table style="border-collapse:collapse;width:100%;">
              <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Name</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${full_name}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${email}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;"><strong>Experience</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${experience_years || 'N/A'} years</td></tr>
            </table>
            <br/>
            <a href="${process.env.FRONTEND_URL || 'https://edu-tech-virid.vercel.app'}/dashboard/admin/tutors"
               style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
              Review Application
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">TechSips Admin Notifications</p>
          </div>`,
      });
    }
  }

  await supabase.from('activity_logs').insert({ user_id: userId, action: 'TUTOR_REGISTERED' });

  const tokens = generateTokenPair({ id: user.id, email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    message: 'Application submitted. Awaiting admin verification.',
    data: { user, ...tokens },
  });
};

// ── Get Tutor Profile (public) ────────────────────────────────────────────────
export const getTutorProfile = async (req, res) => {
  const { id } = req.params;

  const { data: tutor, error } = await supabase
    .from('tutors')
    .select(`
      id, bio, skills, experience_years, portfolio_url, linkedin_url,
      whatsapp_number, verification_status, rating_avg, total_students,
      users!user_id(id, full_name, avatar_url, email, created_at),
      courses(
        id, title, thumbnail_url, rating_avg, enrollment_count, difficulty,
        categories(name)
      )
    `)
    .eq('user_id', id)
    .eq('verification_status', 'approved')
    .single();

  if (error || !tutor) return res.status(404).json({ success: false, message: 'Tutor not found' });

  res.json({ success: true, data: tutor });
};

// ── Top Tutors (public) ───────────────────────────────────────────────────────
export const getTopTutors = async (req, res) => {
  const { data, error } = await supabase
    .from('tutors')
    .select(`
      id, bio, skills, rating_avg, total_students,
      users!user_id(id, full_name, avatar_url)
    `)
    .eq('verification_status', 'approved')
    .order('total_students', { ascending: false })
    .limit(8);

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch tutors' });

  res.json({ success: true, data });
};

// ── Update Tutor Profile ──────────────────────────────────────────────────────
export const updateTutorProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    full_name, bio, skills, experience_years, portfolio_url,
    linkedin_url, whatsapp_number, phone_number, avatar_url,
  } = req.body;

  const { error: userError } = await supabase
    .from('users')
    .update({ full_name, avatar_url })
    .eq('id', userId);

  const { error: tutorError } = await supabase
    .from('tutors')
    .update({ bio, skills, experience_years, portfolio_url, linkedin_url, whatsapp_number, phone_number })
    .eq('user_id', userId);

  if (userError || tutorError) {
    return res.status(500).json({ success: false, message: 'Profile update failed' });
  }

  res.json({ success: true, message: 'Profile updated successfully' });
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const getTutorDashboardStats = async (req, res) => {
  const userId = req.user.id;

  const [coursesResult, enrollmentsResult, tutorResult] = await Promise.all([
    supabase.from('courses').select('id, title, enrollment_count, rating_avg, status, is_approved').eq('tutor_id', userId),
    supabase.from('enrollments').select('id, completed_at, courses!course_id(tutor_id)').eq('courses.tutor_id', userId),
    supabase.from('tutors').select('total_students, rating_avg').eq('user_id', userId).single(),
  ]);

  const courses = coursesResult.data || [];
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'published' && c.is_approved).length;
  const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0);
  const avgRating = courses.filter((c) => c.rating_avg).reduce((sum, c, _, arr) => sum + c.rating_avg / arr.length, 0);
  const pendingCourses = courses.filter((c) => c.status === 'pending').length;

  res.json({
    success: true,
    data: {
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      avgRating: avgRating.toFixed(1),
      totalStudents: tutorResult.data?.total_students || 0,
      courses,
    },
  });
};

// ── Get Tutor's Courses ───────────────────────────────────────────────────────
export const getTutorCourses = async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *, categories(id, name),
      course_modules(id, title, course_lessons(id))
    `)
    .eq('tutor_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch courses' });

  res.json({ success: true, data });
};

// ── Get Single Tutor Course (any status, for editing) ─────────────────────────
export const getTutorCourseById = async (req, res) => {
  const { id } = req.params;

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      categories(id, name, slug),
      course_modules(
        id, title, description, order_index,
        course_lessons(id, title, lesson_type, content_url, duration_mins, is_preview, order_index)
      )
    `)
    .eq('id', id)
    .eq('tutor_id', req.user.id)
    .single();

  if (error || !course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  res.json({ success: true, data: course });
};



// ── Create Course ─────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  const {
    title, subtitle, description, category_id, difficulty,
    duration_hours, language = 'English', learning_outcomes,
    requirements, thumbnail_url, banner_url, is_free = true,
  } = req.body;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

  const { data, error } = await supabase
    .from('courses')
    .insert({
      tutor_id: req.user.id,
      title, subtitle, description, category_id, difficulty,
      duration_hours, language, learning_outcomes, requirements,
      thumbnail_url, banner_url, is_free, slug,
      status: 'draft', is_approved: false,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: 'Course creation failed' });

  res.status(201).json({ success: true, message: 'Course created', data });
};

// ── Update Course ─────────────────────────────────────────────────────────────
export const updateCourse = async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: course } = await supabase
    .from('courses')
    .select('tutor_id, status, is_approved')
    .eq('id', id)
    .single();

  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  if (course.tutor_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

  // Allow editing all statuses — explicitly exclude fields that control approval/publication
  // so a tutor edit never resets approval state
  const allowedFields = [
    'title', 'subtitle', 'description', 'category_id', 'difficulty',
    'duration_hours', 'language', 'learning_outcomes', 'requirements',
    'thumbnail_url', 'banner_url', 'is_free',
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowedFields.includes(k))
  );

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }

  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: 'Update failed' });

  res.json({ success: true, message: 'Course updated', data });
};


// ── Delete Course ─────────────────────────────────────────────────────────────
export const deleteCourse = async (req, res) => {
  const { id } = req.params;

  const { data: course } = await supabase
    .from('courses').select('tutor_id').eq('id', id).single();

  if (!course || course.tutor_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  await supabase.from('courses').delete().eq('id', id);
  res.json({ success: true, message: 'Course deleted' });
};

// ── Submit for Approval ───────────────────────────────────────────────────────
export const submitCourseForApproval = async (req, res) => {
  const { id } = req.params;

  const { data: course } = await supabase
    .from('courses').select('tutor_id, status').eq('id', id).single();

  if (!course || course.tutor_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  await supabase.from('courses').update({ status: 'pending' }).eq('id', id);

  // Fetch course title and tutor name for the email
  const { data: courseDetails } = await supabase
    .from('courses').select('title, users!tutor_id(full_name, email)').eq('id', id).single();

  const { data: admins } = await supabase.from('users').select('id, email').eq('role', 'admin');
  if (admins && admins.length > 0) {
    await supabase.from('notifications').insert(
      admins.map((a) => ({
        user_id: a.id,
        title: 'Course Awaiting Approval',
        message: 'A tutor has submitted a course for review.',
        type: 'course_review',
        link: '/dashboard/admin/courses',
      }))
    );

    // Send email to each admin
    for (const admin of admins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: '📚 New Course Submitted for Review – TechSips',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#6366f1;">📚 Course Submission for Review</h2>
              <p>A tutor has submitted a new course for your review on <strong>TechSips</strong>.</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
                <p style="margin:0;"><strong>Course Title:</strong> ${courseDetails?.title || 'New Course'}</p>
                <p style="margin:8px 0 0;"><strong>Tutor:</strong> ${courseDetails?.users?.full_name || 'Unknown'} (${courseDetails?.users?.email || ''})</p>
              </div>
              <a href="${process.env.FRONTEND_URL || 'https://edu-tech-virid.vercel.app'}/dashboard/admin/courses"
                 style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
                Review Course
              </a>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px;">TechSips Admin Notifications</p>
            </div>`,
        });
      }
    }
  }

  res.json({ success: true, message: 'Course submitted for review' });
};

// ── Request Promotion ─────────────────────────────────────────────────────────
export const requestCoursePromotion = async (req, res) => {
  const { id: course_id } = req.params;
  const { message } = req.body;

  const { data: course } = await supabase
    .from('courses')
    .select('tutor_id, is_approved, status')
    .eq('id', course_id)
    .single();

  if (!course || course.tutor_id !== req.user.id)
    return res.status(403).json({ success: false, message: 'Unauthorized' });

  if (!course.is_approved || course.status !== 'published')
    return res.status(400).json({ success: false, message: 'Course must be published and approved first' });

  const { data: existing } = await supabase
    .from('promotion_requests')
    .select('id, status')
    .eq('course_id', course_id)
    .eq('status', 'pending')
    .single();

  if (existing) return res.status(409).json({ success: false, message: 'Promotion request already pending' });

  const { data, error } = await supabase
    .from('promotion_requests')
    .insert({ course_id, tutor_id: req.user.id, message, status: 'pending' })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: 'Failed to submit promotion request' });

  res.status(201).json({ success: true, message: 'Promotion request submitted', data });
};

// ── Get Enrolled Students for a Course ───────────────────────────────────────
export const getEnrolledStudents = async (req, res) => {
  const { courseId } = req.params;

  const { data: course } = await supabase
    .from('courses').select('tutor_id').eq('id', courseId).single();

  if (!course || course.tutor_id !== req.user.id)
    return res.status(403).json({ success: false, message: 'Unauthorized' });

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, enrolled_at, progress_percentage, completed_at, users!student_id(id, full_name, email, avatar_url)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch students' });

  // Fetch last login from activity logs for all enrolled students
  const studentIds = (data || []).map((enroll) => enroll.users?.id).filter(Boolean);
  const lastLogins = {};

  if (studentIds.length > 0) {
    const { data: logs } = await supabase
      .from('activity_logs')
      .select('user_id, created_at')
      .eq('action', 'USER_LOGGED_IN')
      .in('user_id', studentIds)
      .order('created_at', { ascending: false });

    if (logs) {
      for (const log of logs) {
        if (!lastLogins[log.user_id]) {
          lastLogins[log.user_id] = log.created_at;
        }
      }
    }
  }

  const enrichedData = (data || []).map((enroll) => ({
    ...enroll,
    last_login_at: enroll.users?.id ? (lastLogins[enroll.users.id] || null) : null
  }));

  res.json({ success: true, data: enrichedData });
};

// ── Module CRUD ───────────────────────────────────────────────────────────────
export const createModule = async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  const { data: course } = await supabase.from('courses').select('tutor_id').eq('id', courseId).single();
  if (!course || course.tutor_id !== req.user.id)
    return res.status(403).json({ success: false, message: 'Unauthorized' });

  const { data: lastModule } = await supabase
    .from('course_modules').select('order_index').eq('course_id', courseId)
    .order('order_index', { ascending: false }).limit(1).single();

  const order_index = (lastModule?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from('course_modules')
    .insert({ course_id: courseId, title, description, order_index })
    .select().single();

  if (error) return res.status(500).json({ success: false, message: 'Module creation failed' });

  res.status(201).json({ success: true, data });
};

export const updateModule = async (req, res) => {
  const { id } = req.params;
  const { title, description, order_index } = req.body;

  const { data, error } = await supabase
    .from('course_modules').update({ title, description, order_index }).eq('id', id).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Update failed' });

  res.json({ success: true, data });
};

export const deleteModule = async (req, res) => {
  await supabase.from('course_modules').delete().eq('id', req.params.id);
  res.json({ success: true, message: 'Module deleted' });
};

// ── Lesson CRUD ───────────────────────────────────────────────────────────────
export const createLesson = async (req, res) => {
  const { moduleId } = req.params;
  const { title, lesson_type, content_url, duration_mins, is_preview = false } = req.body;

  const { data: lastLesson } = await supabase
    .from('course_lessons').select('order_index').eq('module_id', moduleId)
    .order('order_index', { ascending: false }).limit(1).single();

  const order_index = (lastLesson?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from('course_lessons')
    .insert({ module_id: moduleId, title, lesson_type, content_url, duration_mins, is_preview, order_index })
    .select().single();

  if (error) return res.status(500).json({ success: false, message: 'Lesson creation failed' });

  res.status(201).json({ success: true, data });
};

export const updateLesson = async (req, res) => {
  const { id } = req.params;
  const allowed = ['title', 'lesson_type', 'content_url', 'duration_mins', 'is_preview', 'order_index'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from('course_lessons').update(updates).eq('id', id).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Update failed' });

  res.json({ success: true, data });
};

export const deleteLesson = async (req, res) => {
  await supabase.from('course_lessons').delete().eq('id', req.params.id);
  res.json({ success: true, message: 'Lesson deleted' });
};

// ── Quiz CRUD ────────────────────────────────────────────────────────────────
export const getQuizByLesson = async (req, res) => {
  const { lessonId } = req.params;

  const { data: quiz, error } = await supabase
    .from('course_quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch quiz' });
  }

  res.json({ success: true, data: quiz || null });
};

export const saveQuiz = async (req, res) => {
  const { lessonId } = req.params;
  const { title, questions, pass_percentage = 70 } = req.body;

  // Verify tutor owns the course for this lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('course_lessons')
    .select(`
      id,
      course_modules (
        id,
        courses (
          tutor_id
        )
      )
    `)
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    return res.status(404).json({ success: false, message: 'Lesson not found' });
  }

  const tutorId = lesson.course_modules?.courses?.tutor_id;
  if (tutorId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { data: existing } = await supabase
    .from('course_quizzes')
    .select('id')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('course_quizzes')
      .update({ title, questions, pass_percentage })
      .eq('lesson_id', lessonId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('course_quizzes')
      .insert({ lesson_id: lessonId, title, questions, pass_percentage })
      .select()
      .single();
  }

  if (result.error) {
    return res.status(500).json({ success: false, message: 'Failed to save quiz' });
  }

  res.json({ success: true, message: 'Quiz saved successfully', data: result.data });
};

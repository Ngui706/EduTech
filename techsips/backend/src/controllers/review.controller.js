import { supabase } from '../config/supabase.js';

const ALLOWED_CATEGORIES = [
  'Course Content',
  'Instructor Quality',
  'Pacing & Structure',
  'Exercises & Quizzes',
  'Overall Experience'
];

// Helper to format category and comment into database format
const formatComment = (category, comment) => {
  const cleanCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'Overall Experience';
  return `[${cleanCategory}] ${comment}`;
};

// Helper to parse database format into category and clean comment
export const parseComment = (rawComment) => {
  if (rawComment && rawComment.startsWith('[')) {
    const closeBracketIndex = rawComment.indexOf(']');
    if (closeBracketIndex > 1) {
      const category = rawComment.substring(1, closeBracketIndex);
      if (ALLOWED_CATEGORIES.includes(category)) {
        const comment = rawComment.substring(closeBracketIndex + 1).trim();
        return { category, comment };
      }
    }
  }
  return { category: 'Overall Experience', comment: rawComment || '' };
};

export const getCourseReviews = async (req, res) => {
  const { courseId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data, error, count } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users(id, full_name, avatar_url)', { count: 'exact' })
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });

  const formattedReviews = (data || []).map((review) => {
    const { category, comment } = parseComment(review.comment);
    return {
      ...review,
      category,
      comment
    };
  });

  res.json({ success: true, data: { reviews: formattedReviews, pagination: { total: count, page: parseInt(page) } } });
};

export const createReview = async (req, res) => {
  const { course_id, rating, comment, category } = req.body;
  const student_id = req.user.id;

  // Must be enrolled
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('course_id', course_id).eq('student_id', student_id).single();

  if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in the course to leave a review' });

  const { data: existing } = await supabase
    .from('reviews').select('id').eq('course_id', course_id).eq('student_id', student_id).single();

  if (existing) return res.status(409).json({ success: false, message: 'You already reviewed this course' });

  const dbComment = formatComment(category, comment);

  const { data, error } = await supabase
    .from('reviews').insert({ course_id, student_id, rating, comment: dbComment }).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Failed to submit review' });

  // Recalculate avg rating
  const { data: allRatings } = await supabase
    .from('reviews').select('rating').eq('course_id', course_id);

  if (allRatings?.length) {
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await supabase.from('courses').update({ rating_avg: avg.toFixed(1), rating_count: allRatings.length }).eq('id', course_id);
  }

  const parsed = parseComment(data.comment);
  res.status(201).json({
    success: true,
    data: {
      ...data,
      category: parsed.category,
      comment: parsed.comment
    }
  });
};

export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment, category } = req.body;

  const { data: review } = await supabase.from('reviews').select('student_id').eq('id', id).single();
  if (!review || review.student_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const dbComment = formatComment(category, comment);

  const { data, error } = await supabase.from('reviews').update({ rating, comment: dbComment }).eq('id', id).select().single();
  if (error) return res.status(500).json({ success: false, message: 'Update failed' });

  const parsed = parseComment(data.comment);
  res.json({
    success: true,
    data: {
      ...data,
      category: parsed.category,
      comment: parsed.comment
    }
  });
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;
  const { data: review } = await supabase.from('reviews').select('student_id').eq('id', id).single();

  if (!review || (review.student_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  await supabase.from('reviews').delete().eq('id', id);
  res.json({ success: true, message: 'Review deleted' });
};

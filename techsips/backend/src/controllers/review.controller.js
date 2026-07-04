import { supabase } from '../config/supabase.js';

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

  res.json({ success: true, data: { reviews: data, pagination: { total: count, page: parseInt(page) } } });
};

export const createReview = async (req, res) => {
  const { course_id, rating, comment } = req.body;
  const student_id = req.user.id;

  // Must be enrolled
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('course_id', course_id).eq('student_id', student_id).single();

  if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in the course to leave a review' });

  const { data: existing } = await supabase
    .from('reviews').select('id').eq('course_id', course_id).eq('student_id', student_id).single();

  if (existing) return res.status(409).json({ success: false, message: 'You already reviewed this course' });

  const { data, error } = await supabase
    .from('reviews').insert({ course_id, student_id, rating, comment }).select().single();

  if (error) return res.status(500).json({ success: false, message: 'Failed to submit review' });

  // Recalculate avg rating
  const { data: allRatings } = await supabase
    .from('reviews').select('rating').eq('course_id', course_id);

  if (allRatings?.length) {
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await supabase.from('courses').update({ rating_avg: avg.toFixed(1), rating_count: allRatings.length }).eq('id', course_id);
  }

  res.status(201).json({ success: true, data });
};

export const updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const { data: review } = await supabase.from('reviews').select('student_id').eq('id', id).single();
  if (!review || review.student_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { data, error } = await supabase.from('reviews').update({ rating, comment }).eq('id', id).select().single();
  if (error) return res.status(500).json({ success: false, message: 'Update failed' });

  res.json({ success: true, data });
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

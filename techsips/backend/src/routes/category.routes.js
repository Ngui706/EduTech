import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/categories
router.get('/', async (req, res) => {
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
});

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/categories
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, description, course_count')
    .eq('is_active', true)
    .order('name');
  if (error) return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  res.json({ success: true, data });
});

export default router;

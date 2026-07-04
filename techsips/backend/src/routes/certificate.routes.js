import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = Router();
router.use(authenticate);

// GET /api/certificates/:code/verify (public)
router.get('/verify/:code', async (req, res) => {
  const { data, error } = await supabase
    .from('certificates')
    .select('id, certificate_code, issued_at, courses(id, title, users!tutor_id(full_name)), users!student_id(full_name)')
    .eq('certificate_code', req.params.code)
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Certificate not found' });
  res.json({ success: true, data });
});

export default router;

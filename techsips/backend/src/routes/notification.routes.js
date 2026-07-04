import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { data } = await supabase
    .from('notifications').select('*').eq('user_id', req.user.id)
    .order('created_at', { ascending: false }).limit(50);
  res.json({ success: true, data });
});

router.put('/:id/read', async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ success: true });
});

router.put('/read-all', async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id);
  res.json({ success: true });
});

export default router;

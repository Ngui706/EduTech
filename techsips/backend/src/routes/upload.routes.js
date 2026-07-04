import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabase } from '../config/supabase.js';

const router = Router();
router.use(authenticate);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// ── Helpers ───────────────────────────────────────────────────────────────────
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Check if Supabase Storage is likely configured
const hasSupabaseStorage = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    && !process.env.SUPABASE_URL.includes('your_supabase'));
};

// In-memory storage (upload to Supabase) or disk fallback
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// ── Local disk save helper ────────────────────────────────────────────────────
const saveLocally = (buffer, subDir, filename, req) => {
  const dir = path.join(UPLOADS_DIR, subDir);
  ensureDir(dir);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${subDir}/${filename}`;
};

// ── POST /api/upload/image ────────────────────────────────────────────────────
router.post('/image', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const filename = `${req.user.id}-${Date.now()}.${ext}`;

  // Try Supabase Storage first
  if (hasSupabaseStorage()) {
    const storagePath = `${req.user.id}/${filename}`;
    const { error } = await supabase.storage
      .from('images')
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(storagePath);
      return res.json({ success: true, url: urlData.publicUrl, path: storagePath });
    }
    console.warn('[upload] Supabase Storage error, falling back to local disk:', error.message);
  }

  // Fallback: save to local disk
  try {
    const url = saveLocally(req.file.buffer, 'images', filename, req);
    return res.json({ success: true, url, path: `images/${filename}` });
  } catch (err) {
    console.error('[upload] Local save failed:', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

// ── POST /api/upload/video ────────────────────────────────────────────────────
router.post('/video', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const filename = `${req.user.id}-${Date.now()}.${ext}`;

  if (hasSupabaseStorage()) {
    const storagePath = `${req.user.id}/${filename}`;
    const { error } = await supabase.storage
      .from('videos')
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

    if (!error) {
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(storagePath);
      return res.json({ success: true, url: urlData.publicUrl, path: storagePath });
    }
    console.warn('[upload] Supabase Storage error, falling back to local disk:', error.message);
  }

  try {
    const url = saveLocally(req.file.buffer, 'videos', filename, req);
    return res.json({ success: true, url, path: `videos/${filename}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

// ── POST /api/upload/document ─────────────────────────────────────────────────
router.post('/document', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const filename = `${req.user.id}-${Date.now()}.${ext}`;

  if (hasSupabaseStorage()) {
    const storagePath = `${req.user.id}/${filename}`;
    const { error } = await supabase.storage
      .from('documents')
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

    if (!error) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);
      return res.json({ success: true, url: urlData.publicUrl, path: storagePath });
    }
    console.warn('[upload] Supabase Storage error, falling back to local disk:', error.message);
  }

  try {
    const url = saveLocally(req.file.buffer, 'documents', filename, req);
    return res.json({ success: true, url, path: `documents/${filename}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

export default router;

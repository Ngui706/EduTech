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

// Get the base URL for this server (used to build absolute fallback URLs)
const getServerBaseUrl = (req) => {
  // Prefer explicit env var (set on Render)
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL.replace(/\/$/, '');
  // Derive from request host
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}`;
};

// Check if Supabase Storage is likely configured
const hasSupabaseStorage = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    && !process.env.SUPABASE_URL.includes('your_supabase'));
};

// Auto-create a Supabase Storage bucket if it doesn't exist
const ensureSupabaseBucket = async (bucketName) => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === bucketName);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(bucketName, { public: true });
    if (error && !error.message?.includes('already exists')) {
      console.warn(`[upload] Could not create bucket "${bucketName}":`, error.message);
      return false;
    }
  }
  return true;
};

// Upload to Supabase Storage — returns public URL or null on failure
const uploadToSupabase = async (bucketName, storagePath, buffer, mimetype) => {
  try {
    await ensureSupabaseBucket(bucketName);
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

    if (error) {
      console.warn(`[upload] Supabase Storage upload error (${bucketName}):`, error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('[upload] Supabase Storage unexpected error:', err.message);
    return null;
  }
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

// ── Local disk save helper — returns ABSOLUTE URL ────────────────────────────
const saveLocally = (buffer, subDir, filename, req) => {
  const dir = path.join(UPLOADS_DIR, subDir);
  ensureDir(dir);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, buffer);
  const baseUrl = getServerBaseUrl(req);
  return `${baseUrl}/uploads/${subDir}/${filename}`;
};

// ── POST /api/upload/image ────────────────────────────────────────────────────
router.post('/image', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  const filename = `${req.user.id}-${Date.now()}.${ext}`;

  // Try Supabase Storage first (preferred — persistent across deploys)
  if (hasSupabaseStorage()) {
    const storagePath = `${req.user.id}/${filename}`;
    const publicUrl = await uploadToSupabase('images', storagePath, req.file.buffer, req.file.mimetype);
    if (publicUrl) {
      return res.json({ success: true, url: publicUrl, path: storagePath });
    }
    console.warn('[upload] Falling back to local disk for image.');
  }

  // Fallback: save to local disk (returns absolute URL)
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
    const publicUrl = await uploadToSupabase('videos', storagePath, req.file.buffer, req.file.mimetype);
    if (publicUrl) {
      return res.json({ success: true, url: publicUrl, path: storagePath });
    }
    console.warn('[upload] Falling back to local disk for video.');
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
    const publicUrl = await uploadToSupabase('documents', storagePath, req.file.buffer, req.file.mimetype);
    if (publicUrl) {
      return res.json({ success: true, url: publicUrl, path: storagePath });
    }
    console.warn('[upload] Falling back to local disk for document.');
  }

  try {
    const url = saveLocally(req.file.buffer, 'documents', filename, req);
    return res.json({ success: true, url, path: `documents/${filename}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
});

export default router;

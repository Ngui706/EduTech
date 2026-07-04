import { verifyAccessToken } from '../config/jwt.js';
import { supabase } from '../config/supabase.js';

// ── Authenticate JWT ──────────────────────────────────────────────────────────
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch fresh user from DB
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, is_active, is_suspended')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── Role Guards ───────────────────────────────────────────────────────────────
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireTutor = requireRole('tutor');
export const requireStudent = requireRole('student');
export const requireTutorOrAdmin = requireRole('tutor', 'admin');
export const requireStudentOrAdmin = requireRole('student', 'admin');

// ── Optional Auth (for public routes that show extra info when logged in) ─────
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const { data: user } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.id)
      .single();
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
};

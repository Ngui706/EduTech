import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/supabase.js';
import { generateTokenPair, verifyRefreshToken } from '../config/jwt.js';

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { full_name, email, password, role = 'student' } = req.body;

  // Check duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ id: uuidv4(), full_name, email, password_hash, role, is_active: true })
    .select('id, full_name, email, role, created_at')
    .single();

  if (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }

  // Create role-specific profile
  if (role === 'student') {
    await supabase.from('students').insert({ user_id: user.id });
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'USER_REGISTERED',
    details: { role },
  });

  const tokens = generateTokenPair({ id: user.id, email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, ...tokens },
  });
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, password_hash, role, is_active, is_suspended, avatar_url')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.is_active) {
    return res.status(401).json({ success: false, message: 'Account is deactivated' });
  }

  if (user.is_suspended) {
    return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Store refresh token in DB
  const tokens = generateTokenPair({ id: user.id, email: user.email, role: user.role });
  await supabase.from('refresh_tokens').insert({
    user_id: user.id,
    token: tokens.refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Log
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'USER_LOGGED_IN',
    details: { ip: req.ip },
  });

  const { password_hash: _, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: { user: safeUser, ...tokens },
  });
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Refresh token required' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }

  // Verify token exists in DB (prevents reuse after logout)
  const { data: stored } = await supabase
    .from('refresh_tokens')
    .select('id, is_revoked')
    .eq('token', token)
    .single();

  if (!stored || stored.is_revoked) {
    return res.status(401).json({ success: false, message: 'Refresh token revoked or not found' });
  }

  // Revoke old, issue new pair
  await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('token', token);

  const tokens = generateTokenPair({ id: decoded.id, email: decoded.email, role: decoded.role });
  await supabase.from('refresh_tokens').insert({
    user_id: decoded.id,
    token: tokens.refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  res.json({ success: true, data: tokens });
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (token) {
    await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('token', token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const { data: user } = await supabase.from('users').select('id, full_name').eq('email', email).single();

  // Always return success (prevents email enumeration)
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await supabase.from('password_resets').insert({
    user_id: user.id,
    token: resetToken,
    expires_at: expiresAt.toISOString(),
  });

  // TODO: Send email with resetToken (configure SMTP)
  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
};

// ── Reset Password ────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const { data: reset } = await supabase
    .from('password_resets')
    .select('user_id, expires_at, is_used')
    .eq('token', token)
    .single();

  if (!reset || reset.is_used || new Date(reset.expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  await supabase.from('users').update({ password_hash }).eq('id', reset.user_id);
  await supabase.from('password_resets').update({ is_used: true }).eq('token', token);
  // Revoke all refresh tokens for security
  await supabase.from('refresh_tokens').update({ is_revoked: true }).eq('user_id', reset.user_id);

  res.json({ success: true, message: 'Password reset successful' });
};

// ── Get Me ────────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, avatar_url, is_active, created_at')
    .eq('id', req.user.id)
    .single();

  if (error || !user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, data: user });
};

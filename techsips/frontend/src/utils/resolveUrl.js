/**
 * Resolves a potentially relative upload URL to an absolute URL.
 *
 * When the backend falls back to local disk storage, it returns URLs like
 * `/uploads/images/file.jpg`. In production, this must be prefixed with the
 * API server's base URL so browsers can load the asset.
 *
 * Supabase Storage URLs (https://...supabase.co/...) are returned as-is.
 * Already-absolute URLs (http:// or https://) are returned as-is.
 *
 * @param {string|null|undefined} url - The URL to resolve.
 * @returns {string} - A fully-qualified absolute URL, or empty string if input is falsy.
 */
export function resolveMediaUrl(url) {
  if (!url) return '';

  // Already absolute — Supabase, external CDN, etc.
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // Relative path — prepend the API base URL
  const apiBase = (import.meta.env.VITE_API_URL || '')
    .replace(/\/api\/?$/, '') // strip trailing /api
    .replace(/\/$/, '');       // strip trailing slash

  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

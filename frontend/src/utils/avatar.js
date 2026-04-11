export function getAvatarUrl(avatar, apiBase) {
  if (!avatar) return null;

  const base =
    apiBase ??
    // Prefer VITE_API_URL (set in your frontend .env). Fallback to localhost.
    (import.meta.env.VITE_API_URL || 'http://localhost:3000');

  const b = String(base).replace(/\/$/, '');
  const value = String(avatar).trim();
  if (!value) return null;

  // Already an absolute URL
  if (/^https?:\/\//i.test(value)) return value;

  // Common backend formats:
  // - "/uploads/<file>"
  // - "uploads/<file>" (rare)
  // - "<file>" (filename only)
  if (value.startsWith('/')) return `${b}${value}`;
  if (value.startsWith('uploads/')) return `${b}/${value}`;
  return `${b}/uploads/${value}`;
}

export function getInitials(firstName, lastName) {
  const fn = (firstName || '').toString().trim();
  const ln = (lastName || '').toString().trim();
  const a = fn[0] || '';
  const b = ln[0] || '';
  return (a + b).toUpperCase() || 'U';
}


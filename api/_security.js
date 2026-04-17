// Shared security helpers for B2B API endpoints.
//
// ALLOWED_ORIGINS env var (set in Vercel dashboard):
//   Comma-separated list of additional allowed origins, e.g.:
//   "https://example.com,https://www.example.com"
//   The main Vercel domain + all preview deploys are always allowed automatically.

const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Always allowed: the production deploy + any preview deploy of this project.
const VERCEL_PREVIEW_RE = /^https:\/\/hydration-concierge-b2[a-z0-9-]*\.vercel\.app$/;
const ALWAYS_ALLOWED = ['https://hydration-concierge-b2-b.vercel.app'];

export function isOriginAllowed(origin) {
  if (!origin) return false; // block direct API calls without Origin header (e.g. curl)
  if (ALWAYS_ALLOWED.includes(origin)) return true;
  if (VERCEL_PREVIEW_RE.test(origin)) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  return false;
}

/**
 * Sets CORS headers for an allowed origin and returns true.
 * Returns false (and sends 403) if the origin is not allowed.
 */
export function applyCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers.origin;

  if (!isOriginAllowed(origin)) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  return true;
}

/**
 * Shared CORS origin check for Express + Socket.IO.
 *
 * Render env:
 *   FRONTEND_URL=https://your-app.vercel.app
 *   (comma-separate multiple origins for previews)
 *
 * If FRONTEND_URL points at *.vercel.app, all *.vercel.app preview URLs are allowed.
 */
export function createOriginChecker() {
  const configuredOrigins = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowVercelPreviews = configuredOrigins.some((o) => o.includes('.vercel.app'));
  const isDev = process.env.NODE_ENV !== 'production';

  return function isOriginAllowed(origin) {
    if (!origin) return true;
    if (configuredOrigins.includes(origin)) return true;

    if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i.test(origin)) {
      return true;
    }

    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(:\d+)?$/i.test(origin)) {
      return true;
    }

    return false;
  };
}

export function corsCallback(isOriginAllowed) {
  return (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

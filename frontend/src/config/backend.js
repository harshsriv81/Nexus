/**
 * Backend URL resolution for local dev vs production (Vercel + Render).
 *
 * LOCAL DEV (Vite proxy):
 *   Leave VITE_API_URL empty — requests go to same origin and Vite proxies to :5000.
 *
 * PRODUCTION (Vercel frontend + Render backend):
 *   Vercel env (required, then redeploy):
 *     VITE_API_URL=https://YOUR-SERVICE.onrender.com
 *     VITE_SOCKET_URL=https://YOUR-SERVICE.onrender.com
 *
 *   Render env (required):
 *     FRONTEND_URL=https://YOUR-APP.vercel.app
 *     NODE_ENV=production
 */

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.replace(/\/$/, '');
};

const isLocalHostname = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1';

const isLocalhostUrl = (url) =>
  /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);

/** True when VITE_* env vars were baked in at build time. */
export function isBackendConfigured() {
  return Boolean(
    normalizeBaseUrl(import.meta.env.VITE_API_URL || '') ||
    normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL || '')
  );
}

/**
 * Resolve REST API base URL.
 * - Production: MUST use VITE_API_URL (your Render URL).
 * - Local dev: same-origin via Vite proxy, or http://localhost:5000.
 */
export function resolveApiBaseUrl() {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_URL || '');

  if (configured) {
    if (
      typeof window !== 'undefined' &&
      isLocalHostname(window.location.hostname) &&
      isLocalhostUrl(configured)
    ) {
      return window.location.origin;
    }
    return configured;
  }

  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:5000';
  }

  return '';
}

/** Resolve Socket.IO server URL (usually same host as API on Render). */
export function resolveSocketUrl() {
  const socketEnv = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL || '');
  const apiEnv = normalizeBaseUrl(import.meta.env.VITE_API_URL || '');
  const configured = socketEnv || apiEnv;

  if (configured) {
    if (
      typeof window !== 'undefined' &&
      isLocalHostname(window.location.hostname) &&
      isLocalhostUrl(configured)
    ) {
      return window.location.origin;
    }
    return configured;
  }

  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:5000';
  }

  return '';
}

export function getBackendConfigError() {
  if (import.meta.env.DEV) return null;
  if (isBackendConfigured()) return null;
  return (
    'Backend URL is not configured. In Vercel → Settings → Environment Variables, set ' +
    'VITE_API_URL and VITE_SOCKET_URL to your Render service URL (e.g. https://your-app.onrender.com), then redeploy.'
  );
}

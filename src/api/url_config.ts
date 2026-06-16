
// API Base URLs
// In dev mode: use empty string → Vite proxy routes /api → staging-api.farmaze.com
// In production: use env var or fall back to production URL
export const API__BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://api.farmaze.com');

export const ANLYTICS_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_ANALYTICS_API_URL || 'https://analytics.farmaze.com');
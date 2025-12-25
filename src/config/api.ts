import { env } from './env';

/**
 * Determine if a hostname represents localhost.
 */
function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Parse VITE_API_URL into a URL object if possible.
 */
function getEnvApiUrl(): URL | null {
  const raw = env.VITE_API_URL;
  if (!raw || typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    return url;
  } catch (error) {
    // Invalid URL format - will fall back to default
    if (typeof window !== 'undefined' && window.console) {
      console.warn('[API Config] Invalid VITE_API_URL value:', raw, error);
    }
    return null;
  }
}

/**
 * Compute the effective API root (including `/api`) for the current environment.
 * This function centralizes all logic for localhost, LAN IPs, and production domains.
 *
 * Examples:
 * - Local dev: http://localhost:3000/api
 * - LAN dev:   http://10.x.x.x:3000/api
 * - Prod:      https://api.example.com (if VITE_API_URL is set accordingly)
 */
export function getApiRoot(): string {
  const envUrl = getEnvApiUrl();

  // Browser-aware logic
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;

    const browserIsLocalhost = isLocalhostHost(hostname);
    const envIsValid = !!envUrl;
    const envIsLocalhost = envIsValid && envUrl && isLocalhostHost(envUrl.hostname);

    // Browser on localhost (developer machine)
    if (browserIsLocalhost) {
      // Always use localhost with backend port when browser is on localhost
      // This ensures local development works regardless of VITE_API_URL setting
      const backendPort = typeof process !== 'undefined' && process.env?.PORT 
        ? process.env.PORT 
        : typeof process !== 'undefined' && process.env?.BACKEND_PORT
        ? process.env.BACKEND_PORT
        : '3000';
      return `${protocol}//localhost:${backendPort}/api`;
    }

    // Browser on LAN IP or real domain
    if (envIsValid && envUrl && !envIsLocalhost) {
      // If VITE_API_URL points to a non-localhost host (e.g. production API),
      // trust it even when accessed via LAN.
      return envUrl.toString().replace(/\/$/, '');
    }

    // VITE_API_URL is missing or points to localhost, but browser is on a LAN IP.
    // Derive API root from the current host and the backend port from environment.
    const backendPort = typeof process !== 'undefined' && process.env?.PORT 
      ? process.env.PORT 
      : typeof process !== 'undefined' && process.env?.BACKEND_PORT
      ? process.env.BACKEND_PORT
      : '3000';
    const derivedRoot = `${protocol}//${hostname}:${backendPort}/api`;
    return derivedRoot.replace(/\/$/, '');
  }

  // Non-browser / SSR fallback – use env when possible
  if (envUrl) {
    return envUrl.toString().replace(/\/$/, '');
  }

  // Last-resort default - use environment variable or fallback to 3000
  const backendPort = typeof process !== 'undefined' && process.env?.PORT 
    ? process.env.PORT 
    : typeof process !== 'undefined' && process.env?.BACKEND_PORT
    ? process.env.BACKEND_PORT
    : '3000';
  return `http://localhost:${backendPort}/api`;
}

/**
 * Get the API base URL without the `/api` suffix.
 * Useful for code that manually appends `/api/...`.
 */
export function getApiBaseUrl(): string {
  const root = getApiRoot();
  return root.replace(/\/api\/?$/, '');
}


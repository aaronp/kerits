/**
 * Global application configuration
 */

/**
 * Base path for all routes in the application.
 * Change this to deploy the app under a different path (e.g., "/kerits", "/app", etc.)
 */
export const BASE_PATH = '/kerits';

/**
 * Helper function to create a route path with the base path prefix
 */
export function route(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Avoid double slashes
  return `${BASE_PATH}${normalizedPath}`.replace(/\/+/g, '/');
}

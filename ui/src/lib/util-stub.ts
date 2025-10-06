/**
 * Stub for Node.js 'util' module
 *
 * Browser environments don't have util.promisify.
 * This stub prevents bundling errors when DiskKv is imported
 * (even though it's never used in the browser).
 */

export function promisify<T>(fn: (...args: any[]) => any): (...args: any[]) => Promise<T> {
  throw new Error('util.promisify is not available in browser environment. Use IndexedDBKv instead of DiskKv.');
}

export default {
  promisify,
};

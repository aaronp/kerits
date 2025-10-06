/**
 * Stub for Node.js 'path' module
 *
 * Browser environments don't need path manipulation.
 * This stub prevents bundling errors.
 */

export function join(...paths: string[]): string {
  return paths.join('/');
}

export function resolve(...paths: string[]): string {
  return paths.join('/');
}

export function dirname(p: string): string {
  return p.split('/').slice(0, -1).join('/');
}

export function basename(p: string): string {
  return p.split('/').pop() || '';
}

export const sep = '/';

export default {
  join,
  resolve,
  dirname,
  basename,
  sep,
};

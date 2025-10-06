/**
 * Stub for Node.js 'fs' module
 *
 * Browser environments don't have filesystem access.
 * This stub prevents bundling errors.
 */

export const promises = {
  readFile: async () => {
    throw new Error('fs is not available in browser environment');
  },
  writeFile: async () => {
    throw new Error('fs is not available in browser environment');
  },
  mkdir: async () => {
    throw new Error('fs is not available in browser environment');
  },
  readdir: async () => {
    throw new Error('fs is not available in browser environment');
  },
  unlink: async () => {
    throw new Error('fs is not available in browser environment');
  },
};

export default {
  promises,
};

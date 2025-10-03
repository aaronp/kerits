import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// Production build config for GitHub Pages
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  base: '/kerits',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kerits': path.resolve(__dirname, '../src'),
      '@noble/ed25519': path.resolve(__dirname, './node_modules/@noble/ed25519'),
      '@noble/hashes/blake3.js': path.resolve(__dirname, './node_modules/@noble/hashes/blake3.js'),
      '@noble/hashes/blake3': path.resolve(__dirname, './node_modules/@noble/hashes/blake3.js'),
      '@noble/hashes/sha2.js': path.resolve(__dirname, './node_modules/@noble/hashes/sha2.js'),
      '@noble/hashes/sha2': path.resolve(__dirname, './node_modules/@noble/hashes/sha2.js'),
      '@noble/hashes/sha512.js': path.resolve(__dirname, './node_modules/@noble/hashes/sha2.js'),
      '@noble/hashes/sha512': path.resolve(__dirname, './node_modules/@noble/hashes/sha2.js'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    include: [
      '@noble/ed25519',
      '@noble/hashes/blake3',
      '@noble/hashes/sha2',
      '@noble/hashes/sha512',
      'buffer',
      'bip39'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
})

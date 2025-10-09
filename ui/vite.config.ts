import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  base: process.env.NODE_ENV === 'production' ? '/kerits' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kerits': path.resolve(__dirname, '../src'),
      // Stub out Node.js modules that aren't used in browser
      'fs': path.resolve(__dirname, './src/lib/fs-stub.ts'),
      'path': path.resolve(__dirname, './src/lib/path-stub.ts'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      '@noble/ed25519',
      '@noble/hashes/blake3.js',
      '@noble/hashes/sha2.js',
      '@noble/hashes/sha3.js',
      '@noble/hashes/blake2.js',
      'bip39'
    ],
  },
})

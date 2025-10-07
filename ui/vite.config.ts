import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/kerits',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kerits': path.resolve(__dirname, '../src'),
      'node:crypto': path.resolve(__dirname, './src/lib/crypto-polyfill.ts'),
      'crypto': path.resolve(__dirname, './src/lib/crypto-polyfill.ts'),
      'buffer': 'buffer',
      // Stub out Node.js modules that aren't used in browser
      'util': path.resolve(__dirname, './src/lib/util-stub.ts'),
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
    'Buffer': ['buffer', 'Buffer'],
  },
})

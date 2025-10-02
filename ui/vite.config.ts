import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/kerits/', // Update this to match your GitHub repo name
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@kerits': path.resolve(__dirname, '../src'),
      'node:crypto': path.resolve(__dirname, './src/lib/crypto-polyfill.ts'),
      'crypto': path.resolve(__dirname, './src/lib/crypto-polyfill.ts'),
      'buffer': 'buffer',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['@noble/ed25519', '@noble/hashes/blake3.js', '@noble/hashes/sha2.js', 'buffer', 'bip39'],
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

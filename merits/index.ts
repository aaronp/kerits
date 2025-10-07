/**
 * MERITS - KERI Credential API Server
 *
 * Elysia-based REST API for KERITS credential operations
 * Uses Eden/Treaty for type-safe client generation
 */

import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/', () => ({
    message: 'MERITS API Server',
    version: '0.1.0',
    status: 'running'
  }))
  .get('/hello', () => ({
    message: 'Hello from MERITS!',
    timestamp: new Date().toISOString()
  }))
  .get('/hello/:name', ({ params: { name } }) => ({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString()
  }))
  .listen(3000);

console.log(
  `🦊 MERITS API Server is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;

/**
 * MERITS - KERI Credential API Server
 *
 * Elysia-based REST API for KERITS credential operations
 * Uses Eden/Treaty for type-safe client generation
 */

import { Elysia } from 'elysia';


const PORT = Number(process.env.PORT) || 3002;

apiApp.listen(PORT)
console.log(`🚀 Server running at http://localhost:${PORT}`);

export type App = typeof app;

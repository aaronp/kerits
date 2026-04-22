#!/usr/bin/env bun
/**
 * serve-static.ts
 *
 * Tiny static server for the Next.js static export in `out/`.
 * Handles clean URLs (`/docs/foo` → `out/docs/foo.html`) and trailing
 * slashes (`/docs/` → `out/docs/index.html` → `out/docs.html`).
 *
 * Used by `make serve` / `make serve-core`. No external deps — Bun's
 * built-in server is sufficient, and vendoring `serve` for a one-command
 * preview is overkill.
 */

import { existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const OUT_DIR = resolve(import.meta.dir, '..', 'out');
const PORT = Number(process.env.PORT ?? 4000);

function resolvePath(pathname: string): string | undefined {
  // Strip leading slash; empty → index.html
  const rel = pathname.replace(/^\/+/, '') || 'index.html';

  // Candidates, in priority order.
  const candidates = [
    join(OUT_DIR, rel),
    join(OUT_DIR, `${rel}.html`),
    join(OUT_DIR, rel, 'index.html'),
  ];

  for (const candidate of candidates) {
    // Prevent escape from OUT_DIR (symlinks / traversal).
    if (!candidate.startsWith(OUT_DIR)) continue;
    if (!existsSync(candidate)) continue;
    if (!statSync(candidate).isFile()) continue;
    return candidate;
  }
  return undefined;
}

if (!existsSync(OUT_DIR)) {
  console.error(`[serve-static] ${OUT_DIR} not found — run 'make -C packages/core docs-build' first.`);
  process.exit(1);
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const filePath = resolvePath(decodeURIComponent(url.pathname));
    if (!filePath) {
      // Fall back to out/404.html if present.
      const notFound = join(OUT_DIR, '404.html');
      if (existsSync(notFound)) {
        return new Response(Bun.file(notFound), { status: 404 });
      }
      return new Response('404 Not Found', { status: 404 });
    }
    return new Response(Bun.file(filePath));
  },
});

console.log(`[serve-static] serving ${OUT_DIR} at http://localhost:${PORT}`);

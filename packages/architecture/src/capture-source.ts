/**
 * Source-capture helper for scenario() — parses Error.stack to find the
 * call site of the nearest frame outside the internal scenario/capture/
 * evidence-paths implementation files.
 *
 * Test files living alongside those implementations (e.g. scenario.test.ts)
 * are NOT filtered — they are legitimate call-sites.
 *
 * Kept pure: takes the stack string as input, returns a plain object.
 * The scenario() runtime passes in `new Error().stack`.
 */

export interface SourceLocation {
  readonly sourceFile: string;
  readonly sourceLine: number;
}

// Files whose frames should be skipped — these are the implementation of the
// scenario mechanism itself, never a user call-site.
//
// Two sets of suffixes cover both historic layout and the standalone package:
//   - packages/core/src/architecture/*.ts  → ends with /architecture/<name>.ts
//   - packages/architecture/src/*.ts       → ends with /architecture/src/<name>.ts
const INTERNAL_FILE_BASENAMES: readonly string[] = [
  '/architecture/scenario.ts',
  '/architecture/capture-source.ts',
  '/architecture/evidence-paths.ts',
  '/architecture/src/scenario.ts',
  '/architecture/src/capture-source.ts',
  '/architecture/src/evidence-paths.ts',
];

function isInternalFrame(sourceFile: string): boolean {
  return INTERNAL_FILE_BASENAMES.some((suffix) => sourceFile.endsWith(suffix));
}

// Matches "(file:line:col)" or bare "file:line:col" tails. Unix-style
// absolute paths only in Phase 1 (the kerits monorepo uses Unix paths in
// tests and CI). Windows support can be added when needed.
const FRAME_PAREN = /\(([^()]+):(\d+):(\d+)\)\s*$/;
const FRAME_BARE = /\s(\/[^\s()]+):(\d+):(\d+)\s*$/;

export function parseStackLine(line: string): SourceLocation | undefined {
  const paren = FRAME_PAREN.exec(line);
  if (paren) {
    return { sourceFile: paren[1]!, sourceLine: Number(paren[2]) };
  }
  const bare = FRAME_BARE.exec(line);
  if (bare) {
    return { sourceFile: bare[1]!, sourceLine: Number(bare[2]) };
  }
  return undefined;
}

export function captureSource(
  stack: string | undefined,
  /**
   * Monorepo root to strip from the captured `sourceFile`. Empty string is
   * treated as "not provided" — absolute path returned unchanged.
   */
  repoRoot?: string,
): Partial<SourceLocation> {
  if (!stack) return {};
  const lines = stack.split('\n');
  for (const line of lines) {
    const parsed = parseStackLine(line);
    if (!parsed) continue;
    if (isInternalFrame(parsed.sourceFile)) continue;
    return stripRepoRoot(parsed, repoRoot);
  }
  return {};
}

function stripRepoRoot(loc: SourceLocation, repoRoot: string | undefined): SourceLocation {
  if (!repoRoot) return loc;
  const prefix = repoRoot.endsWith('/') ? repoRoot : `${repoRoot}/`;
  if (!loc.sourceFile.startsWith(prefix)) return loc;
  return { sourceFile: loc.sourceFile.slice(prefix.length), sourceLine: loc.sourceLine };
}

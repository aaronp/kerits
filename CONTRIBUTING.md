# Contributing to @kerits/core

This package is in the kerits monorepo. To contribute:

1. Clone the kerits monorepo.
2. `bun install` from the repo root.
3. Make changes under `packages/core/`.
4. Run `bun test`, `bun run typecheck`, `bun run lint` from `packages/core/`.
5. Open a PR.

**Boundary rule:** files under `packages/core/src/` may only import from `@kerits/codex` and external npm packages. Nothing else workspace-internal. The lint at `scripts/check-core-boundary.sh` enforces this.

This file is a placeholder. A full contributor guide will be added when the package is published to public npm.

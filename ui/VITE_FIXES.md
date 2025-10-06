# Vite Browser Compatibility Fixes

## Issue

Error: `Module "util" has been externalized for browser compatibility`

This occurred because Vite tried to bundle Node.js-specific modules (`util`, `fs`, `path`) that are used in the `DiskKv` adapter.

## Solution

### 1. Direct Imports (Primary Fix)

Changed imports in `ui/src/lib/dsl.ts` to import directly from specific files instead of using the barrel export:

**Before:**
```typescript
import {
  createKerStore,
  IndexedDBKv,
} from '../../../src/storage';
```

**After:**
```typescript
import { createKerStore } from '../../../src/storage/core';
import { IndexedDBKv } from '../../../src/storage/adapters/indexeddb';
```

This avoids triggering the re-export of `DiskKv` from `storage/index.ts`, which prevented the Node.js modules from being bundled.

### 2. Node.js Module Stubs (Safety Net)

Created stub files for Node.js modules in case they're referenced elsewhere:

- `ui/src/lib/util-stub.ts` - Stubs `util.promisify`
- `ui/src/lib/fs-stub.ts` - Stubs `fs.promises.*`
- `ui/src/lib/path-stub.ts` - Stubs `path.*` utilities

### 3. Vite Configuration

Updated `vite.config.ts` to alias Node.js modules to the stubs:

```typescript
resolve: {
  alias: {
    // ... existing aliases
    'util': path.resolve(__dirname, './src/lib/util-stub.ts'),
    'fs': path.resolve(__dirname, './src/lib/fs-stub.ts'),
    'path': path.resolve(__dirname, './src/lib/path-stub.ts'),
  },
}
```

## Why This Works

### The Problem

Vite uses ES modules and runs in the browser. When it encounters Node.js-specific imports like:

```typescript
import { promisify } from 'util';
```

It tries to polyfill them but fails because these modules fundamentally don't exist in browsers.

### The Solution

1. **Direct imports** prevent the bundler from even seeing the Node.js code
2. **Stubs** provide no-op implementations if anything slips through
3. **Vite aliases** ensure the stubs are used instead of trying to polyfill

## Tree Shaking

Vite's tree-shaking should normally exclude unused exports, but it's not always perfect with:
- Barrel exports (index.ts files that re-export everything)
- Side effects in imported modules
- Dynamic imports or circular dependencies

Direct imports bypass these issues entirely.

## Testing

To verify the fix works:

1. Clear build cache: `rm -rf node_modules/.vite`
2. Restart dev server: `bun run dev`
3. Open browser console - no "externalized module" errors
4. Check network tab - no requests for Node.js polyfills

## Future Considerations

### Option 1: Keep Direct Imports (Current)
- ✅ Simple and explicit
- ✅ No bundling issues
- ❌ More verbose imports

### Option 2: Separate Browser Entry Point
Create `src/browser.ts` that only exports browser-compatible modules:

```typescript
// src/browser.ts
export { createKerStore } from './storage/core';
export { IndexedDBKv } from './storage/adapters/indexeddb';
export * from './app/dsl';
```

Then import from:
```typescript
import { createKerStore, IndexedDBKv } from '../../../src/browser';
```

### Option 3: Conditional Exports (package.json)
Use `exports` field to provide different entry points:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./browser": "./src/browser.ts"
  }
}
```

## Related Issues

- Vite Browser Compatibility: https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility
- ES Module Interop: https://vite.dev/guide/dep-pre-bundling.html

## Files Modified

- `ui/vite.config.ts` - Added Node.js module aliases
- `ui/src/lib/dsl.ts` - Changed to direct imports
- `ui/src/lib/util-stub.ts` - Created
- `ui/src/lib/fs-stub.ts` - Created
- `ui/src/lib/path-stub.ts` - Created

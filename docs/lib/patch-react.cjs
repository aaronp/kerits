/**
 * React module patch for Next.js 15 + fumadocs-ui@16 compatibility.
 *
 * Loaded via NODE_OPTIONS=--require before next build.
 *
 * Problem:
 * - fumadocs-ui@16 client components call useEffectEvent (stable in React 19.2.5)
 * - Next.js 15's canary React (19.2.0-canary) does NOT export useEffectEvent
 * - During static pre-rendering, client components execute in SSR context using
 *   Next.js's vendored SSR React (next/dist/server/route-modules/app-page/vendored/ssr/react)
 *   which also lacks useEffectEvent
 * - This causes: TypeError: (0, d.useEffectEvent) is not a function
 *
 * Solution:
 * 1. Intercept require() for module.compiled.js (which provides vendored/ssr/react)
 *    and polyfill useEffectEvent on the react-ssr React object.
 * 2. Redirect compiled/react/* to external React 19.2.5 (which has __CLIENT_INTERNALS)
 *    to prevent stale module references during build tooling.
 */
'use strict';

const Module = require('module');
const path = require('path');
const fs = require('fs');

const orig = Module._resolveFilename.bind(Module);
const origLoad = Module._load.bind(Module);

// Find the docs directory (one level up from lib/)
const docsDir = path.resolve(__dirname, '..');

// Resolve external React 19.2.5 path
let externalReactMainFile;
try {
  externalReactMainFile = orig('react', null, false, { paths: [docsDir] });
} catch (e) {
  process.stderr.write('[patch-react] Cannot resolve external React: ' + e.message + '\n');
  return;
}

process.stderr.write('[patch-react] External React: ' + externalReactMainFile + '\n');

const externalReactDir = path.dirname(externalReactMainFile);

// Patch _resolveFilename to redirect Next.js compiled React to external React.
// This prevents multiple React instances during build tooling.
Module._resolveFilename = function(id, parent, isMain, opts) {
  let resolved;
  try {
    resolved = orig(id, parent, isMain, opts);
  } catch (e) {
    throw e;
  }

  // Redirect next/dist/compiled/react to external React 19.2.5
  if (
    resolved.includes('compiled/react') &&
    !resolved.includes('react-dom') &&
    !resolved.includes('react-is') &&
    !resolved.includes('react-refresh') &&
    !resolved.includes('react-server-dom')
  ) {
    // Map sub-paths
    if (resolved.includes('react.react-server')) {
      const serverFile = path.join(externalReactDir, 'react.react-server.js');
      if (fs.existsSync(serverFile)) return serverFile;
    } else if (resolved.includes('jsx-runtime')) {
      const jxFile = path.join(externalReactDir, 'jsx-runtime.js');
      if (fs.existsSync(jxFile)) return jxFile;
    } else if (resolved.includes('jsx-dev-runtime')) {
      const jdxFile = path.join(externalReactDir, 'jsx-dev-runtime.js');
      if (fs.existsSync(jdxFile)) return jdxFile;
    } else if (resolved.includes('compiler-runtime')) {
      const crFile = path.join(externalReactDir, 'compiler-runtime.js');
      if (fs.existsSync(crFile)) return crFile;
    } else if (resolved.endsWith('/react') || (resolved.endsWith('.js') && !resolved.includes('/cjs/'))) {
      return externalReactMainFile;
    }
  }

  return resolved;
};

// Patch Module._load to intercept module.compiled.js and inject useEffectEvent
// into the vendored SSR React. This is the React used by client components during
// server-side rendering (SSR layer), which fumadocs-ui@16 requires useEffectEvent from.
const origModuleLoad = Module._load;
Module._load = function(request, parent, isMain) {
  const result = origModuleLoad.apply(this, arguments);

  // Intercept module.compiled.js after it loads
  if (
    typeof request === 'string' &&
    request.includes('module.compiled') &&
    result &&
    result.vendored &&
    result.vendored['react-ssr'] &&
    result.vendored['react-ssr'].React
  ) {
    const ssrReact = result.vendored['react-ssr'].React;
    if (!ssrReact.useEffectEvent) {
      process.stderr.write('[patch-react] Polyfilling useEffectEvent on vendored react-ssr\n');
      ssrReact.useEffectEvent = function useEffectEvent(callback) {
        const ref = ssrReact.useRef(callback);
        ssrReact.useInsertionEffect(function() {
          ref.current = callback;
        });
        return function() {
          return ref.current.apply(this, arguments);
        };
      };
    }
  }

  return result;
};

process.stderr.write('[patch-react] React module resolution patched\n');

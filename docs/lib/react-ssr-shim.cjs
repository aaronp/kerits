'use strict';
/**
 * SSR React shim for fumadocs-ui@16 + Next.js 15 compatibility.
 *
 * Next.js 15's canary React (19.2.0-canary) lacks useEffectEvent.
 * fumadocs-ui@16 requires useEffectEvent in its client components,
 * which are executed server-side during SSR pre-rendering.
 *
 * This shim wraps the vendored SSR react (which has __CLIENT_INTERNALS
 * and all the standard hooks) and adds a useEffectEvent polyfill that
 * delegates through the normal dispatcher path via useInsertionEffect.
 */

// Load the actual vendored SSR react (has __CLIENT_INTERNALS, needed for SSR hooks)
const React = require('next/dist/server/route-modules/app-page/vendored/ssr/react');

// Re-export everything from the SSR react
Object.assign(module.exports, React);

// Polyfill useEffectEvent — the stable React 19.2.5 implementation uses
// useInsertionEffect to keep the ref current, then returns a stable wrapper.
// During SSR, hooks like useInsertionEffect are no-ops, so the returned
// function just calls the latest callback directly.
if (!module.exports.useEffectEvent) {
  module.exports.useEffectEvent = function useEffectEvent(callback) {
    const ref = React.useRef(callback);
    React.useInsertionEffect(function () {
      ref.current = callback;
    });
    return function () {
      return ref.current.apply(this, arguments);
    };
  };
}

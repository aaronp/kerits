'use strict';
/**
 * React compatibility shim for the server webpack bundle.
 * Wraps Next.js's compiled React and adds useEffectEvent.
 * This ensures a single React instance (sharing the same ReactSharedInternals)
 * across all server-side rendered components, preventing null dispatcher errors.
 */

// Use Next.js's compiled React — same instance used by the RSC renderer
const React = require('next/dist/compiled/react');

// Re-export all of React's exports
Object.assign(module.exports, React);

// Add useEffectEvent if not present (missing from Next.js 15's canary React)
if (!module.exports.useEffectEvent) {
  const { useRef, useInsertionEffect } = React;
  module.exports.useEffectEvent = function useEffectEvent(fn) {
    const ref = useRef(fn);
    useInsertionEffect(() => {
      ref.current = fn;
    });
    return function () {
      return ref.current.apply(this, arguments);
    };
  };
}

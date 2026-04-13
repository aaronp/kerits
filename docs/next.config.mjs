import { createMDX } from 'fumadocs-mdx/next';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
// Use Next.js's bundled webpack — webpack is not a direct dependency
const { default: webpack } = await import('next/dist/compiled/webpack/webpack-lib.js');

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const externalReactDir = path.dirname(require.resolve('react/package.json'));
const externalReactDomDir = path.dirname(
  require.resolve('react-dom/package.json'),
);

// Path to the vendored SSR react that Next.js uses for client components during SSR.
// Next.js 15's canary React lacks useEffectEvent; our shim adds it.
const vendoredSsrReactPath = require.resolve(
  'next/dist/server/route-modules/app-page/vendored/ssr/react',
);
const ssrShimPath = path.join(__dirname, 'lib/react-ssr-shim.cjs');

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  // No serverExternalPackages: fumadocs is bundled by webpack.
  // Webpack applies the react-server export condition for RSC bundles,
  // so server components (e.g. DocsLayout) get React from react.react-server.js
  // which uses __SERVER_INTERNALS — compatible with the RSC renderer dispatcher.
  webpack(cfg, { isServer }) {
    if (isServer) {
      // Replace vendored/ssr/react with our shim that adds useEffectEvent.
      // fumadocs-ui@16 client components call useEffectEvent during SSR;
      // the shim polyfills it on top of the canary React that has __CLIENT_INTERNALS.
      cfg.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /next[\\/]dist[\\/]server[\\/]route-modules[\\/]app-page[\\/]vendored[\\/]ssr[\\/]react$/,
          ssrShimPath,
        ),
      );
    } else {
      // Client bundle: alias React to external 19.2.5 (has useEffectEvent natively).
      cfg.resolve.alias = {
        ...cfg.resolve.alias,
        react: externalReactDir,
        'react-dom': externalReactDomDir,
      };
    }
    return cfg;
  },
};

const withMDX = createMDX();

export default withMDX(config);

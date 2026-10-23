import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy. Everything is self-hosted (fonts, model, HDRI,
 * Draco decoder), so nothing is allowed from other origins.
 * - script 'unsafe-inline': Next.js streams inline bootstrap scripts, and the
 *   pages are statically prerendered, so per-request nonces aren't available.
 * - 'wasm-unsafe-eval': the Draco geometry decoder is WebAssembly.
 * - blob:/data: — GLTFLoader decodes embedded textures through blob/data URLs,
 *   and the Draco decoder runs in a Web Worker created from a blob URL.
 * Production only: `next dev` needs eval for fast refresh.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Don't advertise the framework in an `X-Powered-By` header.
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      // r3f-perf (dev only) ships a source map pointing at a binary font file,
      // which makes `next dev` panic. See scripts/strip-sourcemap-loader.cjs.
      "roboto.woff.mjs": {
        loaders: ["./scripts/strip-sourcemap-loader.cjs"],
        as: "*.js",
      },
      "roboto.woff.js": {
        loaders: ["./scripts/strip-sourcemap-loader.cjs"],
        as: "*.js",
      },
      // GLSL shaders are imported as plain strings.
      "*.glsl": {
        type: "raw",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Filenames are not content-hashed, so cache for a day and revalidate in the
        // background rather than marking them immutable.
        source: "/:dir(models|fallback|hdri|draco)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;

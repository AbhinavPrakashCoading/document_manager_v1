import withBundleAnalyzer from "@next/bundle-analyzer"
import { type NextConfig } from "next"

import { env } from "./env.mjs"

const config: NextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  rewrites: async () => [
    { source: "/healthz", destination: "/api/health" },
    { source: "/api/healthz", destination: "/api/health" },
    { source: "/health", destination: "/api/health" },
    { source: "/ping", destination: "/api/health" },
  ],
  webpack: (config, { isServer }) => {
    // Fix for Node.js modules being bundled on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        dns: false,
        module: false,
        'node:assert': false,
        'node:child_process': false,
        'node:crypto': false,
        'node:fs': false,
        'node:net': false,
        'node:tls': false,
        'node:dns': false,
        'node:module': false,
        puppeteer: false,
        playwright: false,
        '@tensorflow/tfjs-node': false,
        'brain.js': false,
        'ml-matrix': false,
        'simple-statistics': false,
      }
      
      // Add module rules to ignore problematic imports
      config.module.rules.push({
        test: /autonomous|puppeteer|playwright|brain\.js|ml-matrix|simple-statistics|@tensorflow\/tfjs-node/,
        use: 'null-loader'
      })
    }
    
    return config
  },
}

export default env.ANALYZE ? withBundleAnalyzer({ enabled: env.ANALYZE })(config) : config

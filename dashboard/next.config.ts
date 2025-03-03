import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Allow import.meta in CommonJS modules
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false
      }
    });

    // Handle fallbacks for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: require.resolve('browserify-fs'),
        module: false,
      };
    }

    return config;
  },
};

export default nextConfig;
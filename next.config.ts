import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "node-pty"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Monaco Editor worker chunks from breaking webpack
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    // node-pty is a native module — exclude from bundling entirely
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("node-pty");
      }
    }
    return config;
  },
};

export default nextConfig;

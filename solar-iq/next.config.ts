import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // API Routes configuration
  async headers() {
    return [
      {
        // Security headers for all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Experimental features (Next.js 15)
  experimental: {
    // Enable if needed for performance
  },

  // Disable powered-by header
  poweredByHeader: false,

  // Enable trailing slash for API consistency
  trailingSlash: false,
};

export default nextConfig;

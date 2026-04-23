import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images: allow the production API domain as a remote pattern for Next.js Image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.stayhubindia.com",
        pathname: "/**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Firebase popup auth needs the opener page to allow popups across origins.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

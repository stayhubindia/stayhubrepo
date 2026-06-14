import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images: allow the production API domain as a remote pattern for Next.js Image
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.stayhub.com",
        pathname: "/**",
      },
    ],
  },

  // Permanent redirects for dead/duplicate pages
  async redirects() {
    return [
      { source: "/properties/create", destination: "/my-ads/new",    permanent: true },
      { source: "/messages",          destination: "/chats",          permanent: true },
      { source: "/signup",            destination: "/",               permanent: true },
      { source: "/owner-signup",      destination: "/",               permanent: true },
      { source: "/bookings",          destination: "/my-bookings",    permanent: true },
    ];
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

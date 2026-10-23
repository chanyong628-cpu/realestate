import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pptx-automizer"],
  outputFileTracingIncludes: {
    "/api/admin/customer-blocks/*/proposal": [
      "./templates/cy-rental-proposal.pptx",
    ],
    "/api/admin/properties/*/proposal": ["./templates/cy-rental-proposal.pptx"],
    "/api/admin/properties/proposal": ["./templates/cy-rental-proposal.pptx"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gsaljmqpbpzkhzuxnhei.supabase.co",
        pathname: "/storage/v1/object/public/property-images/**",
      },
    ],
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600],
    imageSizes: [64, 96, 128, 256, 384],
    formats: ["image/webp"],
  qualities: [75],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "cy-realestate.vercel.app",
          },
        ],
        destination: "https://cy-office.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'; upgrade-insecure-requests",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;

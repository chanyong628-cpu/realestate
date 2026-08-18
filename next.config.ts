import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pptx-automizer"],
  outputFileTracingIncludes: {
    "/api/admin/customer-blocks/*/proposal": [
      "./templates/cy-rental-proposal.pptx",
    ],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
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
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

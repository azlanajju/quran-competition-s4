import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase body size limit for video uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "1gb",
    },
  },
  // Note: For API routes, body size limits are typically controlled by:
  // 1. Hosting platform (Vercel, etc.) - check platform settings
  // 2. Reverse proxy (nginx) - check client_max_body_size
  // 3. Next.js doesn't have a built-in API route body size limit config
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  // invoice.ts reads the logo from public/ at runtime; make sure it ships in the serverless bundle
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/WWY-LOGO_White.png"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;

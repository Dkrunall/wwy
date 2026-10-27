import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wildwildyeast.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/oms", "/api/", "/order", "/pay/", "/baker/", "/coming-soon"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

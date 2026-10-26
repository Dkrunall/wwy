import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wildwildyeast.com";

const PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/shop", priority: 0.9 },
  { path: "/story", priority: 0.7 },
  { path: "/gifting", priority: 0.7 },
  { path: "/contact", priority: 0.5 },
  { path: "/delivery", priority: 0.4 },
  { path: "/refund", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, lastModified, priority }));
}

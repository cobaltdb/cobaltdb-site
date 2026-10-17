import type { MetadataRoute } from "next";
import { docPages } from "@/lib/site";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/docs/",
    "/brand/",
    ...docPages.map((p) => `/docs/${p.slug}/`),
  ].map((path) => ({
    url: `https://cobaltdb.dev${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}

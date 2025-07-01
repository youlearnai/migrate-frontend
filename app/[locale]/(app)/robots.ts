import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/static/", "/_next/", "/profile/", "/history/"],
    },
    sitemap: `${getAppBaseUrl()}/en/sitemap.xml`,
  };
}

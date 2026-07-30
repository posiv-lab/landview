import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/map"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/reviews"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/data-sources"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/info-disclaimer"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/privacy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/terms"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

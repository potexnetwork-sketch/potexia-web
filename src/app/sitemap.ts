import type { MetadataRoute } from "next";

const siteUrl = "https://potexia.my.id";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
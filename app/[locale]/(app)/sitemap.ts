import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/domains";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppBaseUrl();
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/verify`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/reset-password`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/personal-form`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/add`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // {
    //     url: `${baseUrl}/affiliate`,
    //     lastModified,
    //     changeFrequency: 'monthly',
    //     priority: 0.6,
    // },
    // {
    //   url: `${baseUrl}/affiliate`,
    //   lastModified,
    //   changeFrequency: "monthly",
    //   priority: 0.6,
    // },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/discord`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/history`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}

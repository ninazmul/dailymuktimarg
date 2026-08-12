import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com";

  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/news/",
          "/category/",
          "/gallery/",
          "/todays-news",
          "/pages/",
          "/search",
          "/assets/",
          "/favicon.",
          "/manifest",
          "/feed.xml",
        ],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/assets/images/", "/favicon."],
        disallow: [],
      },
      {
        userAgent: "Googlebot-News",
        allow: ["/", "/news/", "/category/", "/gallery/", "/todays-news"],
        disallow: ["/dashboard/"],
      },
      {
        userAgent: "Googlebot-Video",
        allow: ["/news/", "/gallery/"],
        disallow: ["/dashboard/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "YandexBot",
        allow: ["/"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "Baiduspider",
        allow: ["/"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "facebookexternalhit",
        allow: ["/"],
        disallow: [],
      },
      {
        userAgent: "Facebot",
        allow: ["/"],
        disallow: [],
      },
      {
        userAgent: "Twitterbot",
        allow: ["/"],
        disallow: [],
      },
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/sign-in/",
          "/sign-up/",
          "/maintenance/",
        ],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
    host: baseUrl,
  };
}

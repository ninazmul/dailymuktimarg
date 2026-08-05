import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com";

  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: ["/", "/assets/", "/favicon.", "/manifest"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/assets/images/", "/favicon."],
        disallow: [],
      },
      {
        userAgent: "Googlebot-News",
        allow: ["/", "/news/", "/category/", "/gallery/"],
        disallow: ["/dashboard/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: ["/dashboard/", "/api/"],
      },
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/dashboard/", "/api/", "/sign-in/", "/sign-up/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

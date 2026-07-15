import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dailymuktimarg.com";
  const siteName = "Daily Muktimarg";

  const articles = await News.find({ status: "published" })
    .select("title slug summary publishDate")
    .sort({ publishDate: -1 })
    .limit(20)
    .lean<any[]>();

  const rssItems = articles
    .map((item) => {
      const link = `${baseUrl}/news/${item.slug}`;
      return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${item.publishDate ? new Date(item.publishDate).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${item.summary || ""}]]></description>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}</link>
    <description>Latest news from ${siteName}</description>
    <language>bn</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}

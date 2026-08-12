import { connectToDatabase } from "@/lib/database";
import News from "@/lib/database/models/news.model";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectToDatabase();

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com";

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const articles = await News.find({
    status: "published",
    publishDate: { $gte: twoDaysAgo },
  })
    .select("slug publishDate title seoTitle keywords categoryId")
    .populate("categoryId", "name")
    .sort({ publishDate: -1 })
    .limit(1000)
    .lean<any[]>();

  const xmlItems = articles
    .map((article) => {
      const articleUrl = `${baseUrl}/news/${article.slug}`;
      const pubDate = new Date(article.publishDate).toISOString();
      const title = (article.seoTitle || article.title || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
      const keywords =
        Array.isArray(article.keywords) && article.keywords.length
          ? article.keywords.join(", ")
          : article.categoryId?.name || "";
      const safeKeywords = keywords
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `  <url>
    <loc>${articleUrl}</loc>
    <lastmod>${pubDate}</lastmod>
    <news:news xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      <news:publication>
        <news:name>দৈনিক মুক্তিমার্গ</news:name>
        <news:language>bn</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
      <news:keywords>${safeKeywords}</news:keywords>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlItems}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

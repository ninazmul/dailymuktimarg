import { connectToDatabase } from "@/lib/database";
import HomepageLayout from "@/lib/database/models/homepageLayout.model";
import News from "@/lib/database/models/news.model";
import { getActivePoll } from "@/lib/actions/poll.actions";
import { getAds } from "@/lib/actions/ad.actions";
import HomepageSection from "@/components/shared/HomepageSection";
import PollWidget from "@/components/shared/PollWidget";
import Ad from "@/components/shared/Ad";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 60;

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId publishDate views leadPosition";

export default async function HomePage() {
  await connectToDatabase();

  // Fetch active ads
  const activeAds = await getAds({ status: "active" });
  const headerAd = activeAds.find((ad) => ad.placement === "header");
  const sidebarAd = activeAds.find((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");

  // Fetch all enabled homepage sections
  const sections = await HomepageLayout.find({ enabled: true })
    .populate("categoryId", "name slug")
    .sort({ order: 1 })
    .select("sectionName sectionType categoryId postsCount layoutType order enabled isPinned")
    .lean();

  // Fetch lead articles for the hero
  const leadArticles = await News.find({
    lead: true,
    status: "published",
  })
    .select(`${ARTICLE_CARD_FIELDS} lead`)
    .populate("categoryId", "name slug")
    .sort({ leadPosition: 1 })
    .limit(6)
    .lean();

  // Pre-fetch articles for each section
  const sectionData = await Promise.all(
    sections.map(async (section: any) => {
      const query: any = { status: "published" };

      if (section.sectionType === "trending") {
        // Trending = most views
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ views: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.categoryId) {
        query.categoryId = section.categoryId._id || section.categoryId;
      }

      const articles = await News.find(query)
        .select(ARTICLE_CARD_FIELDS)
        .populate("categoryId", "name slug")
        .sort({ publishDate: -1 })
        .limit(section.postsCount || 6)
        .lean();

      return {
        section: JSON.parse(JSON.stringify(section)),
        articles: JSON.parse(JSON.stringify(articles)),
      };
    }),
  );

  const safeLeads = JSON.parse(JSON.stringify(leadArticles));
  const activePoll = await getActivePoll();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-8">
          {/* Lead Stories Hero */}
          {safeLeads.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Lead */}
              {safeLeads[0] && (
                <div className="md:col-span-2 md:row-span-2">
                  <Link
                    href={`/news/${safeLeads[0].slug}`}
                    className="group block relative rounded-xl overflow-hidden aspect-[16/10] bg-gray-200"
                  >
                    <Image
                      src={safeLeads[0].featuredImage}
                      alt={safeLeads[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {safeLeads[0].categoryId?.name && (
                        <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded mb-2 inline-block">
                          {safeLeads[0].categoryId.name}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight group-hover:underline">
                        {safeLeads[0].title}
                      </h2>
                      {safeLeads[0].summary && (
                        <p className="text-sm text-gray-200 mt-2 line-clamp-2">
                          {safeLeads[0].summary}
                        </p>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Secondary Leads */}
              <div className="flex flex-col gap-4">
                {safeLeads.slice(1, 3).map((article: any) => (
                  <Link
                    key={article._id}
                    href={`/news/${article.slug}`}
                    className="group block relative rounded-xl overflow-hidden aspect-[16/9] bg-gray-200"
                  >
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-base font-bold text-white leading-snug group-hover:underline line-clamp-2">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Header Ad After Hero */}
          {headerAd && <Ad ad={headerAd} className="max-w-4xl mx-auto" />}

          {/* Secondary Lead Row */}
          {safeLeads.length > 3 && (
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {safeLeads.slice(3, 6).map((article: any) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    {article.categoryId?.name && (
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {article.categoryId.name}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-gray-800 mt-1 line-clamp-2 group-hover:text-primary transition">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {/* Dynamic Sections */}
          {sectionData.map(({ section, articles }, index) => (
            <>
              <HomepageSection
                key={section._id}
                section={section}
                articles={articles}
              />
              {index === 1 && inlineAds[0] && (
                <Ad ad={inlineAds[0]} className="max-w-4xl mx-auto" />
              )}
            </>
          ))}

          {/* Poll Widget */}
          {activePoll && (
            <section className="max-w-md mx-auto">
              <PollWidget poll={activePoll} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        {sidebarAd && (
          <div className="w-full lg:w-80 flex-shrink-0">
            <Ad ad={sidebarAd} />
          </div>
        )}
      </div>
    </div>
  );
}

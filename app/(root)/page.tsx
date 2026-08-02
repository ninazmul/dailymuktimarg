import { connectToDatabase } from "@/lib/database";
import HomepageLayout from "@/lib/database/models/homepageLayout.model";
import News from "@/lib/database/models/news.model";
import { getActivePoll } from "@/lib/actions/poll.actions";
import { getAds } from "@/lib/actions/ad.actions";
import { getGalleries } from "@/lib/actions/gallery.actions";
import HomepageSection from "@/components/shared/HomepageSection";
import HomepageGallerySection from "@/components/shared/HomepageGallerySection";
import PollWidget from "@/components/shared/PollWidget";
import Ad from "@/components/shared/Ad";
import AdCarousel from "@/components/shared/AdCarousel";
import Link from "next/link";
import Image from "next/image";


export const revalidate = 60;

const ARTICLE_CARD_FIELDS =
  "title slug summary featuredImage categoryId publishDate views leadPosition gallery video featured trending breaking";

export default async function HomePage() {
  await connectToDatabase();

  // Fetch active ads
  const activeAds = await getAds({ status: "active" });
  const headerAds = activeAds.filter((ad) => ad.placement === "header");
  const sidebarAds = activeAds.filter((ad) => ad.placement === "sidebar");
  const inlineAds = activeAds.filter((ad) => ad.placement === "inline");
  const popupAds = activeAds.filter((ad) => ad.placement === "popup");
  const stickyAds = activeAds.filter((ad) => ad.placement === "sticky");
  const mobileAds = activeAds.filter((ad) => ad.placement === "mobile");

  // Fetch all enabled homepage sections
  const sections = await HomepageLayout.find({ enabled: true })
    .populate("categoryId", "name slug")
    .sort({ order: 1 })
    .lean();

  // Fetch lead articles for the hero
  const leadArticles = await News.find({
    lead: true,
    status: "published",
  })
    .select(`${ARTICLE_CARD_FIELDS} lead`)
    .populate("categoryId", "name slug")
    .sort({ leadPosition: 1 })
    .limit(12)
    .lean();

  // Fetch Latest Articles for homepage sidebar
  const latestArticles = await News.find({
    status: "published",
  })
    .select(ARTICLE_CARD_FIELDS)
    .populate("categoryId", "name slug")
    .sort({ publishDate: -1 })
    .limit(6)
    .lean();

  // Fetch Most Viewed Articles for homepage sidebar
  const mostViewedArticles = await News.find({
    status: "published",
  })
    .select(ARTICLE_CARD_FIELDS)
    .populate("categoryId", "name slug")
    .sort({ views: -1 })
    .limit(5)
    .lean();



  // Pre-fetch articles for each section
  const sectionData = await Promise.all(
    sections.map(async (section: any) => {
      const query: any = { status: "published" };

      // Apply filters
      if (section.filters) {
        if (section.filters.featured) query.featured = true;
        if (section.filters.trending) query.trending = true;
        if (section.filters.breaking) query.breaking = true;
        if (section.filters.hasVideo)
          query.video = { $exists: true, $nin: [null, ""] };
      }

      if (section.sectionType === "lead" || section.sectionType === "hero") {
        query.lead = true;
        const articles = await News.find(query)
          .select(ARTICLE_CARD_FIELDS)
          .populate("categoryId", "name slug")
          .sort({ leadPosition: 1, publishDate: -1 })
          .limit(section.postsCount || 6)
          .lean();
        return {
          section: JSON.parse(JSON.stringify(section)),
          articles: JSON.parse(JSON.stringify(articles)),
        };
      }

      if (section.sectionType === "trending") {
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

      if (section.sectionType === "breaking") {
        query.breaking = true;
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
      }

      if (section.sectionType === "featured") {
        query.featured = true;
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
      }

      if (section.sectionType === "videoGallery") {
        query.video = { $exists: true, $nin: [null, ""] };
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
      }

      if (section.sectionType === "photoGallery") {
        query.gallery = { $ne: [] };
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
  const safeLatest = JSON.parse(JSON.stringify(latestArticles));
  const safeMostViewed = JSON.parse(JSON.stringify(mostViewedArticles));
  const activePoll = await getActivePoll();
  const galleryResult = await getGalleries({ status: "published", limit: 6 });
  const safeGalleries = JSON.parse(JSON.stringify(galleryResult.items));

  const mainSectionData = sectionData.filter(
    (item) => item.section.layoutType !== "sidebar"
  );
  const sidebarSectionData = sectionData.filter(
    (item) => item.section.layoutType === "sidebar"
  );

  // Function to find an ad for a specific section's adPlacement
  const getAdForPlacement = (placement: string | undefined) => {
    if (!placement) return undefined;
    return activeAds.find((ad) => ad.placement === placement);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8 min-w-0 items-start">
        {/* Main Content — All sections stacked, fills left side */}
        <div className="flex-1 min-w-0 space-y-8">
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {safeLeads[0].categoryId?.name && (
                          <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded inline-block">
                            {safeLeads[0].categoryId.name}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight group-hover:underline line-clamp-2">
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
          {headerAds.length > 0 && (
            <AdCarousel ads={headerAds} className="max-w-4xl mx-auto" />
          )}

          {/* Secondary Leads — Compact Hero Cards in 3 Columns */}
          {safeLeads.length > 3 && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeLeads.slice(3, 12).map((article: any, idx: number) => (
                <Link
                  key={article._id}
                  href={`/news/${article.slug}`}
                  className="group flex gap-4 bg-white rounded-2xl border border-gray-200/80 p-3 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  {/* Larger Thumbnail */}
                  <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    {article.categoryId?.name && (
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        {article.categoryId.name}
                      </span>
                    )}
                    <h4 className="text-sm font-extrabold text-gray-900 line-clamp-2 group-hover:text-primary transition leading-snug">
                      {article.title}
                    </h4>
                    {article.publishDate && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(article.publishDate).toLocaleDateString("bn-BD")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </section>
          )}




          {/* Dynamic Main Sections */}
          {mainSectionData.map(({ section, articles }, index) => (
            <div
              key={section._id}
              className="space-y-4"
              style={
                section.backgroundColor
                  ? { backgroundColor: section.backgroundColor }
                  : {}
              }
            >
              {section.adPlacement === "top" && (
                <Ad
                  ad={activeAds.find((a) => a.placement === "inline")!}
                  className="max-w-4xl mx-auto"
                />
              )}
              <HomepageSection section={section} articles={articles} />
              {(section.adPlacement === "bottom" ||
                section.adPlacement === "inline") && (
                <Ad
                  ad={activeAds.find((a) => a.placement === "inline")!}
                  className="max-w-4xl mx-auto"
                />
              )}
            </div>
          ))}

          {/* Homepage Photos / Gallery Section */}
          <HomepageGallerySection galleries={safeGalleries} />

          {/* Poll Widget */}
          {activePoll && (
            <section className="max-w-md mx-auto">
              <PollWidget poll={activePoll} />
            </section>
          )}
        </div>

        {/* Sidebar — h-fit so it only takes as much height as content needs */}
        {(sidebarAds.length > 0 || sidebarSectionData.length > 0 || safeLatest.length > 0 || safeMostViewed.length > 0) && (
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6 h-fit">
            {/* Advertisements */}
            {sidebarAds.map((ad) => (
              <Ad key={ad._id.toString()} ad={ad} />
            ))}

            {/* Latest News Widget */}
            {safeLatest.length > 0 && (
              <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                <h2 className="text-lg font-black text-gray-800 border-l-4 border-blue-600 pl-3">
                  Latest News
                </h2>
                <div className="flex flex-col gap-3">
                  {safeLatest.map((item: any) => (
                    <Link
                      key={item._id}
                      href={`/news/${item.slug}`}
                      className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition"
                    >
                      <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={item.featuredImage || "/assets/images/logo.png"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {item.categoryId?.name && (
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                            {item.categoryId.name}
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Most Viewed Articles Widget */}
            {safeMostViewed.length > 0 && (
              <div className="space-y-4 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-sm">
                <h2 className="text-lg font-black text-gray-800 border-l-4 border-amber-500 pl-3">
                  Most Read Articles
                </h2>
                <div className="flex flex-col gap-3">
                  {safeMostViewed.map((item: any, idx: number) => (
                    <Link
                      key={item._id}
                      href={`/news/${item.slug}`}
                      className="group flex gap-3 bg-white rounded-xl border p-2.5 hover:shadow-md transition items-center"
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="relative w-16 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                        <Image
                          src={item.featuredImage || "/assets/images/logo.png"}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-primary transition">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          {item.views || 0} views
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Sidebar Sections (from builder) */}
            {sidebarSectionData.map(({ section, articles }) => (
              <div
                key={section._id}
                className="space-y-4"
                style={
                  section.backgroundColor
                    ? { backgroundColor: section.backgroundColor }
                    : {}
                }
              >
                <HomepageSection section={section} articles={articles} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global ads */}
      {popupAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
      {stickyAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
      {mobileAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
    </div>
  );
}

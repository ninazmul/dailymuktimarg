import { getGalleries } from "@/lib/actions/gallery.actions";
import Link from "next/link";
import Image from "next/image";
import { Camera, Images, Calendar, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import {
  SEO_DEFAULTS,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoInfo();
  const pageTitle = "ক্লিকস্মৃতি ও চিত্র অ্যালবাম";
  const pageSubtitle = "ফটো গ্যালারি";
  const desc =
    "সংবাদ ও সাম্প্রতিক ঘটনাবলীর সেরা সব আলোকচিত্র, ইভেন্ট গ্যালারি এবং ফটো অ্যালবাম।";
  const absoluteOg = toAbsoluteUrl(seo.ogImage, seo.canonicalUrlBase);
  return {
    title: pageSubtitle,
    description: desc,
    alternates: {
      canonical: "/gallery",
    },
    robots: buildRobots(),
    openGraph: {
      title: `${pageTitle} | ${seo.siteBrand}`,
      description: desc,
      url: `${seo.canonicalUrlBase}/gallery`,
      siteName: seo.siteBrand,
      locale: "bn_BD",
      type: "website",
      images: absoluteOg
        ? [{ url: absoluteOg, width: 1200, height: 630, alt: pageTitle }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | ${seo.siteBrand}`,
      description: desc,
      images: seo.twitterCardImage
        ? ([toAbsoluteUrl(seo.twitterCardImage, seo.canonicalUrlBase)].filter(
            Boolean,
          ) as string[])
        : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

export default async function GalleryListPage() {
  const result = await getGalleries({ status: "published", limit: 30 });
  const galleries = result.items;

  const canonicalBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    SEO_DEFAULTS.canonicalUrlBase;
  const brand = SEO_DEFAULTS.siteBrand;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalBase}/gallery#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: brand, item: canonicalBase },
      {
        "@type": "ListItem",
        position: 2,
        name: "ফটো গ্যালারি",
        item: `${canonicalBase}/gallery`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Breadcrumb Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary/80 uppercase tracking-wider mb-2">
            <Link href="/" className="hover:underline text-gray-300">
              {brand}
            </Link>
            <span>/</span>
            <span className="text-primary">ফটো গ্যালারি</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Camera className="w-8 h-8 text-primary" />
            ক্লিকস্মৃতি ও চিত্র অ্যালবাম
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl">
            সংবাদ ও সাম্প্রতিক ঘটনাবলীর সেরা সব আলোকচিত্র এবং ফটো অ্যালবামগুলো
            একসাথে দেখুন।
          </p>
        </div>

        {/* Gallery Items Grid */}
        {galleries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 border">
            <Images className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">
              কোনো ফটো গ্যালারি পাওয়া যায়নি
            </h3>
            <p className="text-sm mt-1">
              শীঘ্রই নতুন ফটো অ্যালবাম প্রকাশিত হবে।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((album) => {
              const totalCount =
                (album.secondaryPhotos?.length || 0) +
                (album.mainImage ? 1 : 0);

              return (
                <Link
                  key={album._id.toString()}
                  href={`/gallery/${album.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image */}
                    <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                      {album.mainImage ? (
                        <Image
                          src={album.mainImage}
                          alt={album.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Images className="w-10 h-10" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                        <Images className="w-3.5 h-3.5 text-amber-400" />
                        <span>{totalCount} Photos</span>
                      </div>
                    </div>

                    {/* Album Info */}
                    <div className="p-5 space-y-2">
                      <h2 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {album.title}
                      </h2>
                      {album.subtitle && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {album.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 mt-2">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      গ্যালারি দেখুন <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    {album.createdAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(album.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

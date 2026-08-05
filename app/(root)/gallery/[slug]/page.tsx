import { getGalleryBySlug } from "@/lib/actions/gallery.actions";
import { notFound } from "next/navigation";
import GalleryDetailClient from "./GalleryDetailClient";
import type { Metadata } from "next";
import {
  SEO_DEFAULTS,
  buildPageTitle,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ slug }, seo] = await Promise.all([params, getSeoInfo()]);
  const gallery = await getGalleryBySlug(slug);

  if (!gallery) {
    return {
      title: buildPageTitle("গ্যালারি পাওয়া যায়নি", seo.siteBrand),
      robots: buildRobots({ index: false }),
    };
  }

  const desc = gallery.subtitle || gallery.title;
  const absoluteCover = toAbsoluteUrl(gallery.mainImage, seo.canonicalUrlBase);
  const galleryUrl = `${seo.canonicalUrlBase}/gallery/${gallery.slug}`;

  return {
    title: gallery.title,
    description: desc,
    alternates: {
      canonical: `/gallery/${gallery.slug}`,
    },
    robots: buildRobots(),
    openGraph: {
      title: buildPageTitle(gallery.title, seo.siteBrand),
      description: desc,
      url: galleryUrl,
      siteName: seo.siteBrand,
      locale: "bn_BD",
      type: "article",
      images: absoluteCover
        ? [{ url: absoluteCover, width: 1200, height: 750, alt: gallery.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: buildPageTitle(gallery.title, seo.siteBrand),
      description: desc,
      images: absoluteCover ? [absoluteCover] : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);

  if (!gallery) {
    notFound();
  }

  const canonicalBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    SEO_DEFAULTS.canonicalUrlBase;
  const brand = SEO_DEFAULTS.siteBrand;
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalBase}/gallery/${gallery.slug}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: brand, item: canonicalBase },
      {
        "@type": "ListItem",
        position: 2,
        name: "ফটো গ্যালারি",
        item: `${canonicalBase}/gallery`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: gallery.title,
        item: `${canonicalBase}/gallery/${gallery.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <GalleryDetailClient gallery={gallery} />
    </>
  );
}

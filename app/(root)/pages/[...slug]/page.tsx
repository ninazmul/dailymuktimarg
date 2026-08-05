import { connectToDatabase } from "@/lib/database";
import PageModel from "@/lib/database/models/page.model";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageSectionRenderer } from "@/components/shared/PageSectionRenderer";
import {
  SEO_DEFAULTS,
  buildPageTitle,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function resolvePage(slugSegments: string[]) {
  await connectToDatabase();

  if (slugSegments.length === 1) {
    return PageModel.findOne({
      slug: slugSegments[0],
      parentId: null,
      status: "published",
    }).lean<any>();
  }

  if (slugSegments.length === 2) {
    const [parentSlug, childSlug] = slugSegments;
    const parent = await PageModel.findOne({
      slug: parentSlug,
      parentId: null,
    }).lean<any>();
    if (!parent) return null;
    return PageModel.findOne({
      slug: childSlug,
      parentId: parent._id,
      status: "published",
    }).lean<any>();
  }

  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const [{ slug }, seo] = await Promise.all([params, getSeoInfo()]);
  const pageDoc = await resolvePage(slug);
  if (!pageDoc) {
    return {
      title: buildPageTitle("পেজ পাওয়া যায়নি", seo.siteBrand),
      robots: buildRobots({ index: false }),
    };
  }
  const seoTitle = pageDoc.seo?.title;
  const seoDesc = pageDoc.seo?.description;
  const pageTitle = seoTitle || pageDoc.title;
  const desc = seoDesc || pageDoc.summary || pageDoc.title;
  const slugPath = slug.join("/");
  const absoluteOg = toAbsoluteUrl(
    pageDoc.seo?.image || seo.ogImage,
    seo.canonicalUrlBase,
  );
  return {
    title: seoTitle || pageTitle,
    description: desc,
    alternates: {
      canonical: `/pages/${slugPath}`,
    },
    robots: buildRobots(),
    openGraph: {
      title: buildPageTitle(pageTitle, seo.siteBrand),
      description: desc,
      url: `${seo.canonicalUrlBase}/pages/${slugPath}`,
      siteName: seo.siteBrand,
      locale: "bn_BD",
      type: "article",
      images: absoluteOg
        ? [{ url: absoluteOg, width: 1200, height: 630, alt: pageTitle }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: buildPageTitle(pageTitle, seo.siteBrand),
      description: desc,
      images: absoluteOg ? [absoluteOg] : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const pageDoc = await resolvePage(slug);
  if (!pageDoc) notFound();

  const canonicalBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    SEO_DEFAULTS.canonicalUrlBase;
  const brand = SEO_DEFAULTS.siteBrand;
  const slugPath = slug.join("/");
  const pageUrl = `${canonicalBase}/pages/${slugPath}`;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: brand, item: canonicalBase },
      {
        "@type": "ListItem",
        position: slug.length + 1,
        name: pageDoc.title,
        item: pageUrl,
      },
    ],
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: pageDoc.title,
    description: pageDoc.summary || pageDoc.title,
    inLanguage: "bn-BD",
    datePublished: pageDoc.createdAt
      ? new Date(pageDoc.createdAt).toISOString()
      : undefined,
    dateModified: pageDoc.updatedAt
      ? new Date(pageDoc.updatedAt).toISOString()
      : undefined,
    author: { "@type": "Organization", name: brand },
    publisher: { "@id": `${canonicalBase}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    isPartOf: { "@id": `${canonicalBase}/#website` },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        {pageDoc.title}
      </h1>

      <PageSectionRenderer
        sections={pageDoc.sections}
        fallbackContent={pageDoc.content}
      />
    </div>
  );
}

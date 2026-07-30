import { connectToDatabase } from "@/lib/database";
import PageModel from "@/lib/database/models/page.model";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function resolvePage(slugSegments: string[]) {
  await connectToDatabase();

  if (slugSegments.length === 1) {
    // Top-level page: /pages/about
    return PageModel.findOne({
      slug: slugSegments[0],
      parentId: null,
      status: "published",
    }).lean<any>();
  }

  if (slugSegments.length === 2) {
    // Sub-page: /pages/about/overview
    const [parentSlug, childSlug] = slugSegments;

    // Find parent first
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pageDoc = await resolvePage(slug);
  if (!pageDoc) return { title: "Page Not Found" };
  return {
    title: pageDoc.seo?.title || `${pageDoc.title} | Daily Muktimarg`,
    description: pageDoc.seo?.description || `Read our ${pageDoc.title} page.`,
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const pageDoc = await resolvePage(slug);
  if (!pageDoc) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 leading-tight mb-6 pb-4 border-b">
        {pageDoc.title}
      </h1>
      <article
        className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: pageDoc.content }}
      />
    </div>
  );
}

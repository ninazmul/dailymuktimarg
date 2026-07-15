
import { connectToDatabase } from "@/lib/database";
import PageModel from "@/lib/database/models/page.model";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const pageDoc = await PageModel.findOne({ slug, status: "published" }).lean<any>();
  if (!pageDoc) return { title: "Page Not Found" };
  return {
    title: pageDoc.seo?.title || `${pageDoc.title} | Daily Muktimarg`,
    description: pageDoc.seo?.description || `Read our ${pageDoc.title} page.`,
  };
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  await connectToDatabase();

  const pageDoc = await PageModel.findOne({ slug, status: "published" }).lean<any>();
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

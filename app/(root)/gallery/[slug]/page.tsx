import { getGalleryBySlug } from "@/lib/actions/gallery.actions";
import { notFound } from "next/navigation";
import GalleryDetailClient from "./GalleryDetailClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);

  if (!gallery) {
    return {
      title: "Gallery Not Found | Daily Muktimarg",
    };
  }

  return {
    title: `${gallery.title} | Photo Gallery - Daily Muktimarg`,
    description: gallery.subtitle || `View photos from ${gallery.title} on Daily Muktimarg`,
    openGraph: {
      title: gallery.title,
      description: gallery.subtitle || gallery.title,
      images: gallery.mainImage ? [{ url: gallery.mainImage }] : [],
    },
  };
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const gallery = await getGalleryBySlug(slug);

  if (!gallery) {
    notFound();
  }

  return <GalleryDetailClient gallery={gallery} />;
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Share2,
  ArrowLeft,
  Images,
} from "lucide-react";
import { IGallery } from "@/lib/database/models/gallery.model";

interface PhotoItem {
  url: string;
  caption?: string;
  isMain?: boolean;
}

export default function GalleryDetailClient({ gallery }: { gallery: IGallery }) {
  // Combine mainImage and secondaryPhotos into a single array for Lightbox navigation
  const allPhotos: PhotoItem[] = [
    { url: gallery.mainImage, caption: gallery.subtitle || gallery.title, isMain: true },
    ...(gallery.secondaryPhotos?.map((p) => ({
      url: p.url,
      caption: p.caption,
      isMain: false,
    })) || []),
  ].filter((p) => Boolean(p.url));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const nextPhoto = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + allPhotos.length) % allPhotos.length);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: gallery.title,
          text: gallery.subtitle,
          url: window.location.href,
        });
      } catch (e) {
        // Ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Page URL copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-gray-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/gallery" className="hover:text-primary transition">
              Gallery
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-xs">{gallery.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-primary bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Gallery
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-primary bg-white border border-gray-300 px-3 py-1.5 rounded-lg shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Gallery Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
            <Camera className="w-4 h-4" />
            Photo Story / ফটো গ্যালারি
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight">
            {gallery.title}
          </h1>

          {gallery.subtitle && (
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              {gallery.subtitle}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
            {gallery.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                Published on {new Date(gallery.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium text-gray-700">
              <Images className="w-4 h-4 text-primary" />
              {allPhotos.length} Total Photos
            </span>
          </div>
        </div>

        {/* Main Cover Photo Showcase */}
        {gallery.mainImage && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-l-4 border-primary pl-2">
              Main Cover Photo / প্রচ্ছদ ছবি
            </h2>

            <div
              onClick={() => openLightbox(0)}
              className="group relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-gray-900 shadow-lg cursor-pointer border border-gray-200"
            >
              <Image
                src={gallery.mainImage}
                alt={gallery.title}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="text-white space-y-1">
                  <span className="text-xs bg-primary px-2 py-0.5 rounded font-bold">Cover Photo</span>
                  {gallery.subtitle && (
                    <p className="text-xs sm:text-sm text-gray-200 line-clamp-1">{gallery.subtitle}</p>
                  )}
                </div>
                <div className="bg-black/60 backdrop-blur-md text-white p-2 rounded-lg group-hover:bg-primary transition">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Photos Section */}
        {gallery.secondaryPhotos && gallery.secondaryPhotos.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                Secondary Photos & Captions ({gallery.secondaryPhotos.length})
              </h2>
              <span className="text-xs text-gray-500">Click any image to view full screen</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gallery.secondaryPhotos.map((photo, index) => {
                const globalIndex = index + 1; // 0 is mainImage
                return (
                  <div
                    key={index}
                    onClick={() => openLightbox(globalIndex)}
                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      <Image
                        src={photo.url}
                        alt={photo.caption || `Photo ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-black/70 text-white p-2 rounded-full transition-opacity">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="p-4 flex-1 bg-white">
                      {photo.caption ? (
                        <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                          {photo.caption}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No caption provided</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
            {/* Top Bar */}
            <div className="flex justify-between items-center text-white z-10">
              <div className="text-xs sm:text-sm font-semibold text-gray-300">
                Photo {selectedIndex + 1} of {allPhotos.length}
              </div>
              <button
                onClick={closeLightbox}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Image Container */}
            <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden">
              <button
                onClick={prevPhoto}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-primary text-white transition border border-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="relative w-full h-full max-w-5xl max-h-[80vh] flex items-center justify-center">
                <Image
                  src={allPhotos[selectedIndex].url}
                  alt={allPhotos[selectedIndex].caption || gallery.title}
                  fill
                  className="object-contain"
                />
              </div>

              <button
                onClick={nextPhoto}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-primary text-white transition border border-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 text-center max-w-3xl mx-auto w-full z-10 text-white space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {gallery.title}
              </h3>
              {allPhotos[selectedIndex].caption && (
                <p className="text-xs sm:text-sm text-gray-300">
                  {allPhotos[selectedIndex].caption}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

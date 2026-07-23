import Link from "next/link";
import Image from "next/image";
import { Camera, Images, ArrowRight } from "lucide-react";
import { IGallery } from "@/lib/database/models/gallery.model";

interface HomepageGallerySectionProps {
  galleries: IGallery[];
}

export default function HomepageGallerySection({ galleries }: HomepageGallerySectionProps) {
  if (!galleries || galleries.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl my-8 overflow-hidden relative">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl -z-0 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 border border-primary/40 rounded-xl text-primary flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                ফটো গ্যালারি <span className="text-primary font-medium text-lg">/ Photo Gallery</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Explore our curated visual stories and photo albums
              </p>
            </div>
          </div>

          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold bg-white/10 hover:bg-primary hover:text-white text-gray-200 px-4 py-2 rounded-lg transition-all duration-300 self-start sm:self-auto border border-white/10"
          >
            <span>সকল অ্যালবামের চিত্র</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleries.map((album) => {
            const totalPhotosCount = (album.secondaryPhotos?.length || 0) + (album.mainImage ? 1 : 0);

            return (
              <Link
                key={album._id.toString()}
                href={`/gallery/${album.slug}`}
                className="group flex flex-col bg-gray-800/80 border border-gray-700/60 rounded-xl overflow-hidden hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Photo Cover Image Container */}
                <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden">
                  {album.mainImage ? (
                    <Image
                      src={album.mainImage}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                      <Images className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Photo Count Badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                    <Images className="w-3.5 h-3.5 text-amber-400" />
                    <span>{totalPhotosCount} Photos</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {album.title}
                    </h3>
                    {album.subtitle && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {album.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-700/40">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      গ্যালারি দেখুন <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    {album.createdAt && (
                      <span className="text-[11px] text-gray-500">
                        {new Date(album.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

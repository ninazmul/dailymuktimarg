import { getGalleries } from "@/lib/actions/gallery.actions";
import Link from "next/link";
import Image from "next/image";
import { Camera, Images, Calendar, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ফটো গ্যালারি | Gallery - Daily Muktimarg",
  description: "Browse latest photo stories, event galleries, and photo albums on Daily Muktimarg.",
};

export default async function GalleryListPage() {
  const result = await getGalleries({ status: "published", limit: 30 });
  const galleries = result.items;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Breadcrumb Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-gray-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary/80 uppercase tracking-wider mb-2">
            <Link href="/" className="hover:underline text-gray-300">
              Home
            </Link>
            <span>/</span>
            <span className="text-primary">Gallery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Camera className="w-8 h-8 text-primary" />
            ফটো গ্যালারি ও চিত্র অ্যালবাম
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2 max-w-2xl">
            সংবাদ ও সাম্প্রতিক ঘটনাবলীর সেরা সব আলোকচিত্র এবং ফটো অ্যালবামগুলো একসাথে দেখুন।
          </p>
        </div>

        {/* Gallery Items Grid */}
        {galleries.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 border">
            <Images className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">কোনো ফটো গ্যালারি পাওয়া যায়নি</h3>
            <p className="text-sm mt-1">শীঘ্রই নতুন ফটো অ্যালবাম প্রকাশিত হবে।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((album) => {
              const totalCount = (album.secondaryPhotos?.length || 0) + (album.mainImage ? 1 : 0);

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
                        <p className="text-sm text-gray-600 line-clamp-2">{album.subtitle}</p>
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

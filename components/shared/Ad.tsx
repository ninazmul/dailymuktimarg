"use client";

import { IAd } from "@/lib/database/models/ad.model";
import Image from "next/image";

interface AdProps {
  ad: IAd;
  className?: string;
}

export default function Ad({ ad, className = "" }: AdProps) {
  if (!ad) return null;

  const renderContent = () => {
    if (ad.htmlCode) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: ad.htmlCode }}
          className="w-full"
        />
      );
    }

    if (ad.imageUrl) {
      const image = (
        <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden">
          <Image
            src={ad.imageUrl}
            alt={ad.client || "Advertisement"}
            width={800}
            height={400}
            className="w-full h-auto"
          />
        </div>
      );

      if (ad.targetUrl) {
        return (
          <a
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {image}
          </a>
        );
      }

      return image;
    }

    // Fallback ad placeholder
    return (
      <div className="w-full h-24 sm:h-32 md:h-40 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 font-medium">
            {ad.client ? `${ad.client} Ad` : "Advertisement"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`ad-container ${className}`}>
      <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
      {renderContent()}
    </div>
  );
}

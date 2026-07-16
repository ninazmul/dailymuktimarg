"use client";

import { IAd } from "@/lib/database/models/ad.model";
import Image from "next/image";
import { useState, useEffect } from "react";

interface AdProps {
  ad: IAd;
  className?: string;
}

export default function Ad({ ad, className = "" }: AdProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (ad.placement === "popup") {
      // Show popup after a short delay
      const timer = setTimeout(() => setShowPopup(true), 1500);
      return () => clearTimeout(timer);
    }

    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [ad.placement]);

  if (!ad) return null;

  // Skip non-mobile placements on mobile if we have a mobile ad, and vice versa
  if (isMobile && ad.placement !== "mobile" && ad.placement !== "popup" && ad.placement !== "sticky") return null;
  if (!isMobile && ad.placement === "mobile") return null;

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

  // Handle popup ad
  if (ad.placement === "popup") {
    if (!showPopup) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative max-w-lg w-full mx-4">
          <button
            onClick={() => setShowPopup(false)}
            className="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
          <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
            <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-b">Advertisement</p>
            {renderContent()}
          </div>
        </div>
      </div>
    );
  }

  // Handle sticky ad
  if (ad.placement === "sticky") {
    return (
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl ${className}`}>
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-b">Advertisement</p>
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
      {renderContent()}
    </div>
  );
}

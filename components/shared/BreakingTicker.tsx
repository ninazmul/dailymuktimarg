"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

interface BreakingTickerProps {
  items: { _id: string; title: string; slug: string }[];
}

export default function BreakingTicker({ items }: BreakingTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-[#226B3A] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-9">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-white mr-4">
          <Zap className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Breaking</span>
        </div>
        <div className="overflow-hidden flex-1 relative">
          <div ref={scrollRef} className="flex gap-12 animate-marquee whitespace-nowrap">
            {items.concat(items).map((item, idx) => (
              <Link
                key={`${item._id}-${idx}`}
                href={`/news/${item.slug}`}
                className="text-sm font-medium hover:underline shrink-0"
              >
                ● {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

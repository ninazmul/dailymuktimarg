"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Calendar, Newspaper, Share2, ChevronDown } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  categories: { _id: string; name: string; slug: string }[];
  socialLinks: Record<string, string>;
}

function toBengaliNumerals(num: number | string): string {
  const bnNums = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().replace(/\d/g, (digit) => bnNums[parseInt(digit, 10)]);
}

function getBanglaEraDate(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  let banglaYear = month > 3 || (month === 3 && day >= 14) ? year - 593 : year - 594;

  let banglaMonth = "";
  let banglaDay = 1;

  if ((month === 3 && day >= 14) || (month === 4 && day <= 14)) {
    banglaMonth = "বৈশাখ";
    banglaDay = month === 3 ? day - 13 : day + 17;
  } else if ((month === 4 && day >= 15) || (month === 5 && day <= 14)) {
    banglaMonth = "জ্যৈষ্ঠ";
    banglaDay = month === 4 ? day - 14 : day + 17;
  } else if ((month === 5 && day >= 15) || (month === 6 && day <= 15)) {
    banglaMonth = "আষাঢ়";
    banglaDay = month === 5 ? day - 14 : day + 16;
  } else if ((month === 6 && day >= 16) || (month === 7 && day <= 16)) {
    banglaMonth = "শ্রাবণ";
    banglaDay = month === 6 ? day - 15 : day + 16;
  } else if ((month === 7 && day >= 17) || (month === 8 && day <= 16)) {
    banglaMonth = "ভাদ্র";
    banglaDay = month === 7 ? day - 16 : day + 15;
  } else if ((month === 8 && day >= 17) || (month === 9 && day <= 16)) {
    banglaMonth = "আশ্বিন";
    banglaDay = month === 8 ? day - 16 : day + 14;
  } else if ((month === 9 && day >= 17) || (month === 10 && day <= 15)) {
    banglaMonth = "কার্তিক";
    banglaDay = month === 9 ? day - 16 : day + 15;
  } else if ((month === 10 && day >= 16) || (month === 11 && day <= 15)) {
    banglaMonth = "অগ্রহায়ণ";
    banglaDay = month === 10 ? day - 15 : day + 15;
  } else if ((month === 11 && day >= 16) || (month === 0 && day <= 14)) {
    banglaMonth = "পৌষ";
    banglaDay = month === 11 ? day - 15 : day + 16;
  } else if ((month === 0 && day >= 15) || (month === 1 && day <= 13)) {
    banglaMonth = "মাঘ";
    banglaDay = month === 0 ? day - 14 : day + 17;
  } else if ((month === 1 && day >= 14) || (month === 2 && day <= 15)) {
    banglaMonth = "ফাল্গুন";
    banglaDay = month === 1 ? day - 13 : day + (isLeap ? 16 : 15);
  } else {
    banglaMonth = "চৈত্র";
    banglaDay = month === 2 ? day - 15 : day + 16;
  }

  return { day: banglaDay, month: banglaMonth, year: banglaYear };
}

function getBengaliDateString(date = new Date()): string {
  const days = [
    "রবিবার",
    "সোমবার",
    "মঙ্গলবার",
    "বুধবার",
    "বৃহস্পতিবার",
    "শুক্রবার",
    "শনিবার",
  ];
  const gregMonths = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];

  const dayName = days[date.getDay()];
  const gregDay = toBengaliNumerals(date.getDate());
  const gregMonth = gregMonths[date.getMonth()];
  const gregYear = toBengaliNumerals(date.getFullYear());

  const banglaDate = getBanglaEraDate(date);
  const banglaDayStr = toBengaliNumerals(banglaDate.day);
  const banglaMonthStr = banglaDate.month;
  const banglaYearStr = toBengaliNumerals(banglaDate.year);

  return `${dayName}, ${gregDay} ${gregMonth} ${gregYear}, ${banglaDayStr} ${banglaMonthStr} ${banglaYearStr}`;
}

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("facebook")) {
    return (
      <svg className="w-3.5 h-3.5 fill-blue-600 flex-shrink-0" viewBox="0 0 24 24">
        <path d="M9 8H7v3h2v9h3v-9h3.6l.4-3H12V6c0-.5.5-1 1-1h2V2h-3C9.7 2 8 3.7 8 6v2H9z" />
      </svg>
    );
  }
  if (p.includes("twitter") || p === "x") {
    return (
      <svg className="w-3.5 h-3.5 fill-gray-900 flex-shrink-0" viewBox="0 0 24 24">
        <path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L11 15.8l-6 6.5H1.8l7.6-8.7L1.3 2.4h6.9l4.7 6.2 5.3-6.2zm-1.2 17.6h1.8L7.1 4H5.2L17 20z" />
      </svg>
    );
  }
  if (p.includes("youtube")) {
    return (
      <svg className="w-3.5 h-3.5 fill-red-600 flex-shrink-0" viewBox="0 0 24 24">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.5A3 3 0 0 0 .5 6.1C0 7.9 0 11.7 0 11.7s0 3.8.5 5.6a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-5.6.5-5.6s0-3.8-.5-5.6zM9.5 15V8.5l6.5 3.25L9.5 15z" />
      </svg>
    );
  }
  if (p.includes("instagram")) {
    return (
      <svg className="w-3.5 h-3.5 fill-pink-600 flex-shrink-0" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  if (p.includes("linkedin")) {
    return (
      <svg className="w-3.5 h-3.5 fill-blue-700 flex-shrink-0" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    );
  }
  if (p.includes("whatsapp")) {
    return (
      <svg className="w-3.5 h-3.5 fill-green-600 flex-shrink-0" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 fill-primary flex-shrink-0" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

export default function Header({ categories, socialLinks }: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [bengaliDate, setBengaliDate] = useState("");
  const lastScrollY = useRef(0);

  useEffect(() => {
    setBengaliDate(getBengaliDateString(new Date()));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isMobileOpen) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobileOpen]);

  const socialEntries = Object.entries(socialLinks || {}).filter(([_, url]) => Boolean(url));

  return (
    <header
      className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      {/* Top Logo Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            src="/assets/images/logo.png"
            alt="Logo"
            width={250}
            height={50}
            className="w-auto h-20 md:h-24 lg:h-28"
          />
        </Link>

        <Link
          href="https://hormuzanfoundation.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center flex-shrink-0"
        >
          <Image
            src="/assets/images/hormuzan.webp"
            alt="Hormuzan"
            width={200}
            height={40}
            className="w-auto h-8 md:h-10 lg:h-12"
          />
        </Link>

        {/* 2-Line Date & Social Section (Hidden on small screens, visible on md+) */}
        <div className="hidden md:flex flex-col items-center justify-center text-center space-y-1.5 px-2">
          {/* Line 1: Bengali Date */}
          <div className="text-xs lg:text-sm font-semibold text-gray-700 flex items-center justify-center gap-1.5 whitespace-nowrap bg-gray-50 px-3 py-1 rounded-full border border-gray-200/80">
            <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>{bengaliDate || "বৃহস্পতিবার, ২৩ জুলাই ২০২৬, ৭ শ্রাবণ ১৪৩৩"}</span>
          </div>

          {/* Line 2: Today's Paper & Social Media Dropdown */}
          <div className="flex items-center justify-center gap-3 text-xs lg:text-sm font-bold whitespace-nowrap">
            <Link
              href="/todays-news"
              className="text-gray-800 hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <Newspaper className="w-4 h-4 text-primary flex-shrink-0" />
              <span>আজকের পত্রিকা</span>
            </Link>

            <span className="text-gray-300">|</span>

            {/* Social Media Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-800 hover:text-primary transition-colors py-0.5">
                <Share2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span>সোশ্যাল মিডিয়া</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:rotate-180 transition-transform" />
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50 w-48 shadow-xl animate-fadeIn">
                <div className="bg-white rounded-xl border border-gray-200 py-1.5 shadow-lg space-y-0.5">
                  {socialEntries.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400 font-normal">কোনো সোশ্যাল লিংক নেই</div>
                  ) : (
                    socialEntries.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-primary/10 hover:text-primary transition capitalize"
                      >
                        <SocialIcon platform={platform} />
                        <span className="truncate">{platform}</span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-between gap-1 py-2">
            <Link
              href="/"
              className="px-4 py-2 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition"
            >
              হোম
            </Link>

            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                className="px-4 py-2 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition"
              >
                {cat.name}
              </Link>
            ))}

            <Link
              href="/search"
              className="px-4 py-2 font-semibold text-gray-500 hover:text-primary transition"
            >
              🔍
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4">
          <div className="flex flex-col gap-1 pt-2">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-primary/5 rounded-md"
            >
              হোম
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                onClick={() => setIsMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-primary/5 rounded-md"
              >
                {cat.name}
              </Link>
            ))}

            <Link
              href="/search"
              onClick={() => setIsMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-primary/5 rounded-md"
            >
              🔍 Search
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
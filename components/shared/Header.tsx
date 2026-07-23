"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  categories: { _id: string; name: string; slug: string }[];
  socialLinks: Record<string, string>;
}

export default function Header({
  categories,
  socialLinks,
}: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

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

  return (
    <header
      className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      {/* Top Logo Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/images/logo.png"
            alt="Logo"
            width={250}
            height={50}
            className="w-auto h-20 md:h-32 lg:h-40"
          />
        </Link>

        <Link href="https://hormuzanfoundation.org/" target="_blank" rel="noopener noreferrer" className="flex items-center">
          <Image
            src="/assets/images/hormuzan.webp"
            alt="Hormuzan"
            width={200}
            height={50}
            className="w-auto h-8 md:h-16 lg:h-20"
          />
        </Link>

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
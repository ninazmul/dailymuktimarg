"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  categories: { _id: string; name: string; slug: string }[];
  socialLinks: Record<string, string>;
}

export default function Header({ categories, socialLinks }: HeaderProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const today = new Date().toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-8 text-xs">
          <span>{today}</span>
          <div className="flex items-center gap-3">
            {socialLinks?.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80 transition"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H7v3h2v9h3v-9h3.6l.4-3H12V6c0-.5.5-1 1-1h2V2h-3C9.7 2 8 3.7 8 6v2H9z" />
                </svg>
              </a>
            )}
            {socialLinks?.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80 transition"
                aria-label="Twitter"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L11 15.8l-6 6.5H1.8l7.6-8.7L1.3 2.4h6.9l4.7 6.2 5.3-6.2zm-1.2 17.6h1.8L7.1 4H5.2L17 20z" />
                </svg>
              </a>
            )}
            {socialLinks?.youtube && (
              <a
                href={socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white/80 transition"
                aria-label="YouTube"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.5A3 3 0 0 0 .5 6.1C0 7.9 0 11.7 0 11.7s0 3.8.5 5.6a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.8.5-5.6.5-5.6s0-3.8-.5-5.6zM9.5 15V8.5l6.5 3.25L9.5 15z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-primary tracking-tight">
            Daily Muktimarg
          </h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition"
          >
            হোম
          </Link>
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat._id}
              href={`/category/${cat.slug}`}
              className="px-3 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 rounded-md transition"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/search"
            className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-primary transition"
          >
            🔍
          </Link>
        </nav>

        {/* Mobile Toggle */}
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

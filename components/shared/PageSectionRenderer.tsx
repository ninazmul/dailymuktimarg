"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IPageSection } from "@/lib/database/models/page.model";
import {
  ChevronDown,
  ExternalLink,
  ArrowRight,
  User,
  Sparkles,
  HelpCircle,
  Mail,
} from "lucide-react";

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3Z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.65 13.75 5.65c1.08 0 2.2.19 2.2.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 3h-2.33v6.8c4.56-.93 8-4.96 8-9.8z" />
    </svg>
  );
}

interface PageSectionRendererProps {
  sections?: IPageSection[];
  fallbackContent?: string;
}

export function PageSectionRenderer({
  sections = [],
  fallbackContent = "",
}: PageSectionRendererProps) {
  const activeSections = (sections || [])
    .filter((sec) => sec.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (activeSections.length === 0) {
    if (!fallbackContent) return null;
    return (
      <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: fallbackContent }} />
      </div>
    );
  }

  return (
    <div className="space-y-16 py-4">
      {activeSections.map((section) => (
        <section
          key={section.id || Math.random().toString()}
          className={`rounded-2xl transition-all duration-300 ${getBgClass(
            section.backgroundColor,
          )}`}
        >
          {/* Section Header */}
          {(section.title || section.subtitle) && (
            <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
              {section.title && (
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  {section.title}
                </h2>
              )}
              {section.subtitle && (
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  {section.subtitle}
                </p>
              )}
              <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-2" />
            </div>
          )}

          {/* Section Body based on Type */}
          {renderSectionContent(section)}
        </section>
      ))}
    </div>
  );
}

function getBgClass(bgColor?: string) {
  switch (bgColor) {
    case "muted":
      return "bg-gray-50 dark:bg-gray-800/60 p-8 border border-gray-100 dark:border-gray-800";
    case "primary":
      return "bg-gradient-to-br from-primary to-emerald-800 text-white p-8 md:p-12 shadow-xl";
    case "dark":
      return "bg-gray-900 text-white p-8 md:p-12 border border-gray-800 shadow-2xl";
    default:
      return "";
  }
}

function renderSectionContent(section: IPageSection) {
  switch (section.type) {
    case "founders":
      return <FoundersSection founders={section.founders || []} />;
    case "featureCards":
      return <FeatureCardsSection cards={section.featureCards || []} />;
    case "imageBanner":
      return <ImageBannerSection banner={section.imageBanner} />;
    case "cta":
      return <CTASection cta={section.cta} />;
    case "faq":
      return <FAQSection faqs={section.faqs || []} />;
    case "embed":
      return <EmbedSection embed={section.embed} />;
    case "richText":
    default:
      return section.content ? (
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: section.content }} />
        </div>
      ) : null;
  }
}

/* ==================== FOUNDERS / TEAM SECTION ==================== */
function FoundersSection({ founders }: { founders: IPageSection["founders"] }) {
  if (!founders || founders.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {founders.map((founder, idx) => (
        <div
          key={idx}
          className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
        >
          <div>
            {/* Portrait Image Container */}
            <div className="relative w-full h-72 md:h-80 rounded-2xl overflow-hidden shadow-md bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 mb-4">
              {founder.image ? (
                <Image
                  src={founder.image}
                  alt={founder.name}
                  fill
                  className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <User className="w-20 h-20 stroke-[1.5]" />
                </div>
              )}

              {/* Bottom Gradient Overlay for High Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Name & Role overlay on image bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left text-white space-y-1">
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-primary text-white rounded-full shadow-sm">
                  {founder.role || "Founder & Team"}
                </span>
                <h3 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-sm">
                  {founder.name}
                </h3>
              </div>
            </div>

            {/* Bio Description */}
            {founder.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4 px-1">
                {founder.bio}
              </p>
            )}
          </div>

          {/* Social Links Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 w-full mt-auto px-1">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Connect
            </span>
            <div className="flex items-center gap-1.5">
              {founder.linkedin && (
                <a
                  href={founder.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full transition-colors"
                  title="LinkedIn"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
              {founder.twitter && (
                <a
                  href={founder.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 rounded-full transition-colors"
                  title="Twitter / X"
                >
                  <TwitterIcon className="w-4 h-4" />
                </a>
              )}
              {founder.facebook && (
                <a
                  href={founder.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full transition-colors"
                  title="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {founder.email && (
                <a
                  href={`mailto:${founder.email}`}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-colors"
                  title="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== FEATURE CARDS SECTION ==================== */
function FeatureCardsSection({
  cards,
}: {
  cards: IPageSection["featureCards"];
}) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            {/* Card Image / Header */}
            {card.image && (
              <div className="relative w-full h-44 mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {card.title}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {card.description}
            </p>
          </div>

          {card.linkUrl && (
            <Link
              href={card.linkUrl}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-2"
            >
              {card.linkText || "Learn More"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

/* ==================== IMAGE BANNER SECTION ==================== */
function ImageBannerSection({
  banner,
}: {
  banner: IPageSection["imageBanner"];
}) {
  if (!banner || !banner.imageUrl) return null;

  const isSplit = banner.layout === "split-left" || banner.layout === "split-right";

  if (isSplit) {
    return (
      <div
        className={`flex flex-col lg:flex-row items-center gap-8 bg-gray-50 dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 ${
          banner.layout === "split-right" ? "lg:flex-row-reverse" : ""
        }`}
      >
        <div className="w-full lg:w-1/2 relative h-64 md:h-80 rounded-xl overflow-hidden shadow-md">
          <Image
            src={banner.imageUrl}
            alt={banner.alt || "Banner image"}
            fill
            className="object-cover"
          />
        </div>
        <div className="w-full lg:w-1/2 space-y-4 text-left">
          {banner.caption && (
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {banner.caption}
            </p>
          )}
          {banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow transition-colors"
            >
              {banner.linkText || "Explore"}
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-md bg-gray-100 dark:bg-gray-800">
        <Image
          src={banner.imageUrl}
          alt={banner.alt || "Banner image"}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      {banner.caption && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 italic">
          {banner.caption}
        </p>
      )}
      {banner.linkUrl && (
        <div className="text-center mt-2">
          <Link
            href={banner.linkUrl}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white font-medium text-sm rounded-lg transition-colors"
          >
            {banner.linkText || "View Details"}
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ==================== CTA SECTION ==================== */
function CTASection({ cta }: { cta: IPageSection["cta"] }) {
  if (!cta || !cta.heading) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-emerald-700 to-emerald-800 text-white p-8 md:p-12 text-center shadow-xl">
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        <h3 className="text-2xl md:text-3xl font-black tracking-tight">
          {cta.heading}
        </h3>
        {cta.subheading && (
          <p className="text-base md:text-lg text-emerald-100 leading-relaxed font-medium">
            {cta.subheading}
          </p>
        )}
        {cta.buttonUrl && (
          <div className="pt-2">
            <Link
              href={cta.buttonUrl}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary hover:bg-gray-100 font-bold text-base rounded-xl shadow-lg transition-transform duration-200 transform hover:scale-105"
            >
              {cta.buttonText || "Get Started"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>

      {/* Background Glow Overlay */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}

/* ==================== FAQ ACCORDION SECTION ==================== */
function FAQSection({ faqs }: { faqs: IPageSection["faqs"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-base text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                {faq.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isOpen ? "transform rotate-180 text-primary" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-6 pb-5 pt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/60">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ==================== EMBED SECTION ==================== */
function EmbedSection({ embed }: { embed: IPageSection["embed"] }) {
  if (!embed || !embed.code) return null;

  return (
    <div className="space-y-2 max-w-4xl mx-auto">
      <div
        className="w-full overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
        dangerouslySetInnerHTML={{ __html: embed.code }}
      />
      {embed.caption && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          {embed.caption}
        </p>
      )}
    </div>
  );
}

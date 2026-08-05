import "server-only";
import type { Metadata } from "next";
import { getSetting } from "@/lib/actions/setting.actions";

export const SEO_DEFAULTS = {
  siteTitle: "দৈনিক মুক্তিমার্গ। ন্যায়ের পথে মুক্তির আলো",
  siteBrand: "দৈনিক মুক্তিমার্গ",
  siteDescription:
    "বাংলাদেশের অন্যতম প্রতিনিধিত্বশীল অনলাইন সংবাদ মাধ্যম দৈনিক মুক্তিমার্গ। সর্বশেষ সংবাদ, বিশ্লেষণ, মতামত, রাজনীতি, অর্থনীতি, ক্রীড়া, বিনোদন, আইন ও ন্যায়বিচারসহ সব খবর ন্যায়ের পথে।",
  siteKeywords: [
    "দৈনিক মুক্তিমার্গ",
    "মুক্তিমার্গ",
    "অনলাইন খবর",
    "বাংলাদেশ খবর",
    "আজকের খবর",
    "সংবাদ",
    "ন্যায়বিচার",
    "রাজনীতি",
    "অর্থনীতি",
    "ক্রীড়া",
    "বিনোদন",
    "Daily Muktimarg",
    "Muktimarg",
  ],
  canonicalUrlBase:
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com",
  ogImage: "/assets/images/og-default.webp",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterImage: "/assets/images/og-default.webp",
  locale: "bn_BD",
  siteName: "দৈনিক মুক্তিমার্গ",
  authors: [{ name: "দৈনিক মুক্তিমার্গ" }],
  publisher: "দৈনিক মুক্তিমার্গ",
  category: "News",
} as const;

export interface ResolvedSeo {
  siteTitle: string;
  siteBrand: string;
  siteDescription: string;
  siteKeywords: string[];
  canonicalUrlBase: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCardTitle: string;
  twitterCardDescription: string;
  twitterCardImage: string;
  googleAnalyticsId?: string;
  googleSearchConsoleVerification?: string;
}

export async function getSeoInfo(): Promise<ResolvedSeo> {
  try {
    const setting = await getSetting();
    const seo = setting?.seo || {};
    const canonicalUrlBase = (
      seo.canonicalUrlBase || SEO_DEFAULTS.canonicalUrlBase
    ).replace(/\/$/, "");
    return {
      siteTitle: seo.siteTitle || SEO_DEFAULTS.siteTitle,
      siteBrand: extractBrand(seo.siteTitle) || SEO_DEFAULTS.siteBrand,
      siteDescription: seo.siteMetaDescription || SEO_DEFAULTS.siteDescription,
      siteKeywords:
        Array.isArray(seo.siteKeywords) && seo.siteKeywords.length > 0
          ? [...seo.siteKeywords]
          : [...SEO_DEFAULTS.siteKeywords],
      canonicalUrlBase,
      ogTitle: seo.ogTitle || seo.siteTitle || SEO_DEFAULTS.siteTitle,
      ogDescription:
        seo.ogDescription ||
        seo.siteMetaDescription ||
        SEO_DEFAULTS.siteDescription,
      ogImage: seo.ogImage || SEO_DEFAULTS.ogImage,
      twitterCardTitle:
        seo.twitterCardTitle ||
        seo.ogTitle ||
        seo.siteTitle ||
        SEO_DEFAULTS.siteTitle,
      twitterCardDescription:
        seo.twitterCardDescription ||
        seo.ogDescription ||
        seo.siteMetaDescription ||
        SEO_DEFAULTS.siteDescription,
      twitterCardImage: seo.twitterCardImage || SEO_DEFAULTS.twitterImage,
      googleAnalyticsId: seo.googleAnalyticsId,
      googleSearchConsoleVerification: seo.googleSearchConsoleVerification,
    };
  } catch {
    return {
      siteTitle: SEO_DEFAULTS.siteTitle,
      siteBrand: SEO_DEFAULTS.siteBrand,
      siteDescription: SEO_DEFAULTS.siteDescription,
      siteKeywords: [...SEO_DEFAULTS.siteKeywords],
      canonicalUrlBase: SEO_DEFAULTS.canonicalUrlBase,
      ogTitle: SEO_DEFAULTS.siteTitle,
      ogDescription: SEO_DEFAULTS.siteDescription,
      ogImage: SEO_DEFAULTS.ogImage,
      twitterCardTitle: SEO_DEFAULTS.siteTitle,
      twitterCardDescription: SEO_DEFAULTS.siteDescription,
      twitterCardImage: SEO_DEFAULTS.twitterImage,
    };
  }
}

function extractBrand(siteTitle?: string): string | undefined {
  if (!siteTitle) return undefined;
  const parts = siteTitle.split(/[।|—–\-]+/).map((p) => p.trim());
  const first = parts[0];
  if (first && /মুক্তিমার্গ|Muktimarg/i.test(first)) return first;
  if (parts.length >= 2 && /মুক্তিমার্গ|Muktimarg/i.test(siteTitle)) {
    return "দৈনিক মুক্তিমার্গ";
  }
  return undefined;
}

export function buildPageTitle(
  pageTitle: string | undefined | null,
  brand: string,
): string {
  if (!pageTitle) return brand;
  const t = pageTitle.trim();
  if (!t) return brand;
  if (t.length + brand.length + 3 > 70) {
    const maxLen = 70 - brand.length - 3;
    const truncated =
      t.length > maxLen ? t.slice(0, maxLen).trimEnd() + "…" : t;
    return `${truncated} | ${brand}`;
  }
  return `${t} | ${brand}`;
}

export function toAbsoluteUrl(
  urlOrPath: string | undefined | null,
  base: string,
): string | undefined {
  if (!urlOrPath) return undefined;
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return `${cleanBase}${cleanPath}`;
}

export function buildRobots(
  options: { index?: boolean; follow?: boolean } = {},
): Metadata["robots"] {
  const { index = true, follow = true } = options;
  return {
    index,
    follow,
    googleBot: {
      index,
      follow,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  };
}

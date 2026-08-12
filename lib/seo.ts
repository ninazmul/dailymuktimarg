import "server-only";
import type { Metadata } from "next";
import { getSetting } from "@/lib/actions/setting.actions";

import { SEO_DEFAULTS } from "@/constants/seo";
export { SEO_DEFAULTS };

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

    // Merge DB keywords with English core keywords so bilingual Google
    // ranking signals are always present regardless of admin DB content.
    const dbKeywords =
      Array.isArray(seo.siteKeywords) && seo.siteKeywords.length > 0
        ? [...seo.siteKeywords]
        : [...SEO_DEFAULTS.siteKeywordsBn];
    const siteKeywords = Array.from(
      new Set([...dbKeywords, ...SEO_DEFAULTS.siteKeywordsEn]),
    );

    return {
      siteTitle: seo.siteTitle || SEO_DEFAULTS.siteTitle,
      siteBrand: extractBrand(seo.siteTitle) || SEO_DEFAULTS.siteBrand,
      siteDescription: seo.siteMetaDescription || SEO_DEFAULTS.siteDescription,
      siteKeywords,
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
      googleAnalyticsId: seo.googleAnalyticsId || SEO_DEFAULTS.googleAnalyticsId,
      googleSearchConsoleVerification:
        seo.googleSearchConsoleVerification || undefined,
    };
  } catch {
    return {
      siteTitle: SEO_DEFAULTS.siteTitle,
      siteBrand: SEO_DEFAULTS.siteBrand,
      siteDescription: SEO_DEFAULTS.siteDescription,
      siteKeywords: SEO_DEFAULTS.siteKeywords,
      canonicalUrlBase: SEO_DEFAULTS.canonicalUrlBase,
      ogTitle: SEO_DEFAULTS.siteTitle,
      ogDescription: SEO_DEFAULTS.siteDescription,
      ogImage: SEO_DEFAULTS.ogImage,
      twitterCardTitle: SEO_DEFAULTS.siteTitle,
      twitterCardDescription: SEO_DEFAULTS.siteDescription,
      twitterCardImage: SEO_DEFAULTS.twitterImage,
      googleAnalyticsId: SEO_DEFAULTS.googleAnalyticsId,
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

import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import {
  SEO_DEFAULTS,
  buildRobots,
  getSeoInfo,
  toAbsoluteUrl,
} from "@/lib/seo";

import "./globals.css";

// Revalidate root layout metadata every 30 seconds so admin SEO changes
// appear quickly without needing a redeploy.
export const revalidate = 30;

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

const solaimanLipi = localFont({
  src: [
    {
      path: "../public/fonts/SolaimanLipi.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-bengali",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoInfo();
  const base = seo.canonicalUrlBase;
  const metadataBase = new URL(base);

  // Resolve all image URLs to absolute — required for social crawlers.
  const absoluteOg = toAbsoluteUrl(seo.ogImage, base);
  const absoluteTwitter = toAbsoluteUrl(seo.twitterCardImage, base);

  // Icon assets — Google favicon rules:
  // 1. Must be explicitly declared as <link rel="icon"> with PNG/JPG/GIF
  // 2. Minimum recommended size is 48×48 pixels; 16x32x48 standard set
  // 3. favicon.ico must be complemented by PNG variants
  // 4. Avoid SVG for search favicon (Google falls back to site if SVG)
  const faviconIco = "/favicon.ico";
  const logoPng16 = `${base}/assets/images/logo.png`;
  const logoPng32 = `${base}/assets/images/logo.png`;
  const logoPng48 = `${base}/assets/images/logo.png`;
  const logoPng192 = `${base}/assets/images/logo.png`;
  const logoPng512 = `${base}/assets/images/logo.png`;
  const logoPngAppletouch = `${base}/assets/images/logo.png`;

  return {
    metadataBase,

    // ─── Title — Bengali-first, exact brand match ──────────────────────────
    title: {
      default: seo.siteTitle,
      template: `%s | ${seo.siteBrand}`,
      absolute: seo.siteTitle,
    },

    // ─── Basic meta — Bengali language signals only (no English confusion) ─
    description: seo.siteDescription,
    keywords: seo.siteKeywords,
    applicationName: SEO_DEFAULTS.siteName,
    authors: [...SEO_DEFAULTS.authors],
    creator: SEO_DEFAULTS.siteName,
    publisher: SEO_DEFAULTS.publisher,
    category: SEO_DEFAULTS.category,

    // ─── Canonical + single-language hreflang + feed discovery ─────────────
    // NOTE: Since site is *only* Bengali (no real English pages), we remove
    // the fake "en" hreflang — Google penalises fake multilingual signals
    // because they cause auto-translate override and wrong title language.
    alternates: {
      canonical: "/",
      languages: {
        "x-default": `${base}/`,
        "bn-BD": `${base}/`,
      },
      types: {
        "application/rss+xml": [
          { url: `${base}/feed.xml`, title: "দৈনিক মুক্তিমার্গ — RSS Feed" },
        ],
        "application/atom+xml": [
          { url: `${base}/feed.xml`, title: "দৈনিক মুক্তিমার্গ" },
        ],
      },
    },

    // ─── Favicon & PWA icons (Google favicon spec compliant) ───────────────
    // https://developers.google.com/search/docs/appearance/favicon-in-search
    icons: {
      // icon[] = <link rel="icon"> — Google scans these FIRST for favicon
      icon: [
        // Google's favicon requirement: 48x48 is minimum for SERP display.
        { url: logoPng48, sizes: "48x48", type: "image/png" },
        { url: logoPng32, sizes: "32x32", type: "image/png" },
        { url: logoPng16, sizes: "16x16", type: "image/png" },
        { url: logoPng192, sizes: "192x192", type: "image/png" },
        { url: logoPng512, sizes: "512x512", type: "image/png" },
        // ICO fallback after PNGs so Google sees PNG first
        { url: faviconIco, sizes: "any", type: "image/x-icon" },
      ],
      // <link rel="shortcut icon"> — legacy browsers
      shortcut: faviconIco,
      // <link rel="apple-touch-icon"> — iOS, also Google signal
      apple: [{ url: logoPngAppletouch, sizes: "180x180", type: "image/png" }],
      other: [
        { rel: "apple-touch-icon-precomposed", url: logoPngAppletouch },
        // <link rel="image_src"> — legacy preview icon
        ...(absoluteOg ? [{ rel: "image_src", url: absoluteOg }] : []),
        // <link rel="mask-icon"> (Safari pinned tab; SVG file we have)
        {
          rel: "mask-icon",
          url: "/assets/icons/apple-touch-icon.svg",
          color: "#226B3A",
        },
      ],
    },

    manifest: "/manifest.webmanifest",
    robots: buildRobots(),

    // ─── Google Search Console / Bing verification ─────────────────────────
    verification: seo.googleSearchConsoleVerification
      ? {
          google: seo.googleSearchConsoleVerification,
          yandex: undefined,
        }
      : undefined,

    // Prevent mobile auto-linking of numbers/email in SERP preview
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },

    // ─── Open Graph (Facebook / LinkedIn / WhatsApp) ───────────────────────
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: base,
      siteName: SEO_DEFAULTS.siteName,
      locale: SEO_DEFAULTS.locale,
      type: "website",
      images: absoluteOg
        ? [
            {
              url: absoluteOg,
              width: SEO_DEFAULTS.ogImageWidth,
              height: SEO_DEFAULTS.ogImageHeight,
              alt: seo.siteBrand,
              type: "image/webp",
              secureUrl: absoluteOg,
            },
          ]
        : undefined,
    },

    // ─── Twitter / X Card ──────────────────────────────────────────────────
    twitter: {
      card: "summary_large_image",
      title: seo.twitterCardTitle,
      description: seo.twitterCardDescription,
      images: absoluteTwitter ? [absoluteTwitter] : undefined,
      creator: "@dailymuktimarg",
      site: "@dailymuktimarg",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Bengali stays the DEFAULT language for SERP because:
    //   1. lang="bn" on html (primary signal)
    //   2. No fake "en" hreflang pointing to same URL (prevents Google from
    //      thinking an English canonical exists and translating over Bengali)
    //   3. Schema.org uses Bengali for name+legalName, English only as alternateName
    // Users can still click "Translate this page" — just won't happen by default.
    <html lang="bn" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${dmSerif.variable} ${solaimanLipi.variable} font-sans`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}

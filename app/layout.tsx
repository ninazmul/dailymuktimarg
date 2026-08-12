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

  // Icon assets — logo.png & logo.webp exist in /public/assets/images/
  const logoPng = `${base}/assets/images/logo.png`;

  return {
    metadataBase,

    // ─── Title ────────────────────────────────────────────────────────────
    title: {
      default: seo.siteTitle,
      template: `%s | ${seo.siteBrand}`,
      absolute: seo.siteTitle,
    },

    // ─── Basic meta ────────────────────────────────────────────────────────
    description: seo.siteDescription,
    keywords: seo.siteKeywords, // Bengali + English merged in getSeoInfo()
    applicationName: SEO_DEFAULTS.siteName,
    authors: [...SEO_DEFAULTS.authors],
    creator: SEO_DEFAULTS.siteName,
    publisher: SEO_DEFAULTS.publisher,
    category: SEO_DEFAULTS.category,

    // ─── Canonical + bilingual hreflang ────────────────────────────────────
    // x-default: catch-all URL when no language variant matches.
    // en: signals English content exists (for bilingual ranking).
    // bn-BD: primary Bengali audience.
    alternates: {
      canonical: "/",
      languages: {
        "x-default": `${base}/`,
        "en": `${base}/`,
        "bn-BD": `${base}/`,
      },
    },

    // ─── Favicon & PWA icons ───────────────────────────────────────────────
    // Google Search picks the best favicon from these declarations.
    // Prefer PNG with explicit pixel sizes over SVG for search result display.
    icons: {
      icon: [
        // favicon.ico — universal fallback (legacy browsers, Bing)
        { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
        // PNG sizes for Google Search favicons and Rich Results
        { url: logoPng, sizes: "32x32", type: "image/png" },
        { url: logoPng, sizes: "192x192", type: "image/png" },
        { url: logoPng, sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      // Apple touch icon for iOS home screen
      apple: [{ url: logoPng, sizes: "180x180", type: "image/png" }],
      // Supplemental signals for Google image index + share previews
      other: [
        { rel: "apple-touch-icon-precomposed", url: logoPng },
        ...(absoluteOg ? [{ rel: "image_src", url: absoluteOg }] : []),
      ],
    },

    manifest: "/manifest.webmanifest",
    robots: buildRobots(),

    // ─── Google Search Console verification ───────────────────────────────
    verification: seo.googleSearchConsoleVerification
      ? { google: seo.googleSearchConsoleVerification }
      : undefined,

    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },

    // ─── Open Graph ────────────────────────────────────────────────────────
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: base,
      siteName: SEO_DEFAULTS.siteName,
      locale: SEO_DEFAULTS.locale,
      alternateLocale: ["en_US"], // bilingual signal for OG crawlers
      type: "website",
      images: absoluteOg
        ? [
            {
              url: absoluteOg,
              width: SEO_DEFAULTS.ogImageWidth,
              height: SEO_DEFAULTS.ogImageHeight,
              alt: seo.siteBrand,
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

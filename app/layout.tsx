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
  const metadataBase = new URL(seo.canonicalUrlBase);
  const absoluteOg = toAbsoluteUrl(seo.ogImage, seo.canonicalUrlBase);
  const absoluteTwitter = toAbsoluteUrl(
    seo.twitterCardImage,
    seo.canonicalUrlBase,
  );
  const absoluteLogoPng = toAbsoluteUrl(
    "/assets/images/logo.png",
    seo.canonicalUrlBase,
  );
  const appleIcon = toAbsoluteUrl(
    "/assets/icons/apple-touch-icon.svg",
    seo.canonicalUrlBase,
  );

  return {
    metadataBase,
    title: {
      default: seo.siteTitle,
      template: `%s | ${seo.siteBrand}`,
      absolute: seo.siteTitle,
    },
    description: seo.siteDescription,
    keywords: seo.siteKeywords,
    applicationName: SEO_DEFAULTS.siteName,
    authors: [...SEO_DEFAULTS.authors],
    creator: SEO_DEFAULTS.siteName,
    publisher: SEO_DEFAULTS.publisher,
    category: SEO_DEFAULTS.category,
    alternates: {
      canonical: "/",
      languages: { "bn-BD": "/" },
    },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
      shortcut: "/favicon.ico",
      apple: appleIcon
        ? [{ url: appleIcon, type: "image/svg+xml", sizes: "180x180" }]
        : undefined,
      other: absoluteLogoPng
        ? [{ rel: "apple-touch-icon-precomposed", url: absoluteLogoPng }]
        : undefined,
    },
    manifest: "/manifest.webmanifest",
    robots: buildRobots(),
    verification: seo.googleSearchConsoleVerification
      ? { google: seo.googleSearchConsoleVerification }
      : undefined,
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      url: seo.canonicalUrlBase,
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
            },
          ]
        : undefined,
    },
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

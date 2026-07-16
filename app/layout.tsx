import { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { getSetting } from "@/lib/actions/setting.actions";

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

export async function generateMetadata(): Promise<Metadata> {
  const setting = await getSetting();
  
  const defaultTitle = "Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম";
  const defaultDescription = "বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম। সর্বশেষ খবর, বিশ্লেষণ এবং মতামত।";
  const defaultKeywords = ["অনলাইন খবর", "বাংলাদেশ খবর", "Muktimarg", "Daily Muktimarg", "সংবাদ"];
  const defaultUrl = "https://dailymuktimarg.com";
  const defaultImage = "https://dailymuktimarg.com/assets/images/placeholder.webp";

  const seo = setting?.seo || {};
  const metadataBase = seo.canonicalUrlBase ? new URL(seo.canonicalUrlBase) : new URL(defaultUrl);

  return {
    title: seo.siteTitle || defaultTitle,
    description: seo.siteMetaDescription || defaultDescription,
    keywords: seo.siteKeywords?.length ? seo.siteKeywords : defaultKeywords,
    metadataBase,
    icons: {
      icon: "./favicon.ico",
      shortcut: "./favicon.ico",
      apple: "/assets/images/placeholder.webp",
    },
    alternates: {
      canonical: seo.canonicalUrlBase || defaultUrl,
    },
    openGraph: {
      title: seo.ogTitle || seo.siteTitle || defaultTitle,
      description: seo.ogDescription || seo.siteMetaDescription || defaultDescription,
      url: seo.canonicalUrlBase || defaultUrl,
      siteName: "Daily Muktimarg",
      images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630, alt: "Daily Muktimarg" }] : [{ url: defaultImage, width: 1200, height: 630, alt: "Daily Muktimarg" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.twitterCardTitle || seo.ogTitle || seo.siteTitle || defaultTitle,
      description: seo.twitterCardDescription || seo.ogDescription || seo.siteMetaDescription || defaultDescription,
      images: seo.twitterCardImage ? [seo.twitterCardImage] : [defaultImage],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body
        className={`${inter.variable} ${dmSerif.variable} ${solaimanLipi.variable} font-sans`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}

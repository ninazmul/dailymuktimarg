import { Metadata } from "next";
import { Inter, DM_Serif_Display, Hind_Siliguri } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

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

const hindSiliguri = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
});

export const metadata: Metadata = {
  title: "Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম",
  description:
    "বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম। সর্বশেষ খবর, বিশ্লেষণ এবং মতামত।",
  keywords: [
    "অনলাইন খবর",
    "বাংলাদেশ খবর",
    "Muktimarg",
    "Daily Muktimarg",
    "সংবাদ",
  ],
  metadataBase: new URL("https://dailymuktimarg.com"),
  icons: {
    icon: "./favicon.ico",
    shortcut: "./favicon.ico",
    apple: "/assets/images/placeholder.webp",
  },
  alternates: {
    canonical: "https://dailymuktimarg.com/",
  },
  openGraph: {
    title: "Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম",
    description:
      "বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম। সর্বশেষ খবর, বিশ্লেষণ এবং মতামত।",
    url: "https://dailymuktimarg.com/",
    siteName: "Daily Muktimarg",
    images: [
      {
        url: "https://dailymuktimarg.com/assets/images/placeholder.webp",
        width: 1200,
        height: 630,
        alt: "Daily Muktimarg",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Muktimarg | অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম",
    description:
      "বাংলাদেশের অন্যতম প্রধান অনলাইন সংবাদ মাধ্যম। সর্বশেষ খবর, বিশ্লেষণ এবং মতামত।",
    images: ["/assets/images/placeholder.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <body
        className={`${inter.variable} ${dmSerif.variable} ${hindSiliguri.variable} font-sans`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}

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

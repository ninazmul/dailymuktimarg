// Shared SEO defaults — safe to import in both server and client components.
// All image paths must resolve to real files under /public.
export const SEO_DEFAULTS = {
  siteTitle: "দৈনিক মুক্তিমার্গ। ন্যায়ের পথে মুক্তির আলো",
  siteBrand: "দৈনিক মুক্তিমার্গ | Daily Muktimarg",
  siteDescription:
    "বাংলাদেশের অন্যতম প্রতিনিধিত্বশীল অনলাইন সংবাদ মাধ্যম দৈনিক মুক্তিমার্গ। সর্বশেষ সংবাদ, বিশ্লেষণ, মতামত, রাজনীতি, অর্থনীতি, ক্রীড়া, বিনোদন, আইন ও ন্যায়বিচারসহ সব খবর ন্যায়ের পথে। — (Daily Muktimarg / Muktimarg / daily muktimarg / dailymuktimarg.com)",
  // Bengali keywords
  siteKeywordsBn: [
    "দৈনিক মুক্তিমার্গ",
    "মুক্তিমার্গ",
    "দৈনিক",
    "দৈনিক মুক্তিমার্গ সংবাদ",
    "দৈনিক মুক্তিমার্গ খবর",
    "দৈনিক মুক্তিমার্গ অনলাইন",
    "দৈনিক মুক্তিমার্গ পত্রিকা",
    "মুক্তিমার্গ সংবাদ",
    "মুক্তিমার্গ খবর",
    "অনলাইন খবর",
    "বাংলাদেশ খবর",
    "আজকের খবর",
    "সংবাদ",
    "ন্যায়বিচার",
    "রাজনীতি",
    "অর্থনীতি",
    "ক্রীড়া",
    "বিনোদন",
    "আন্তর্জাতিক সংবাদ",
    "জাতীয় সংবাদ",
  ] as string[],
  // English keywords for global & bilingual search ranking
  siteKeywordsEn: [
    "Daily Muktimarg",
    "Muktimarg",
    "Daily",
    "dailymuktimarg",
    "daily muktimarg",
    "dailymuktimarg.com",
    "Daily Mukti Marg",
    "Mukti Marg",
    "Dainik Muktimarg",
    "Dainik Mukti Marg",
    "Dailymukti",
    "Mukti",
    "Bangladesh news",
    "Bangladeshi newspaper",
    "online news Bangladesh",
    "latest Bangladesh news",
    "Bengali news",
    "bd news",
    "Bangladesh politics",
    "Bangladesh economy",
  ] as string[],
  get siteKeywords(): string[] {
    return [...this.siteKeywordsBn, ...this.siteKeywordsEn];
  },
  canonicalUrlBase:
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    "https://dailymuktimarg.com",
  // logo.webp exists in /public/assets/images/ — use as OG/Twitter default
  ogImage: "/assets/images/logo.webp",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterImage: "/assets/images/logo.webp",
  googleAnalyticsId: "G-PCDFML3RTC",
  locale: "bn_BD",
  siteName: "দৈনিক মুক্তিমার্গ",
  authors: [{ name: "দৈনিক মুক্তিমার্গ" }],
  publisher: "দৈনিক মুক্তিমার্গ",
  category: "News",
};

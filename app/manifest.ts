import type { MetadataRoute } from "next";
import { getSeoInfo, SEO_DEFAULTS } from "@/lib/seo";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await getSeoInfo().catch(() => null);
  const name = seo?.siteBrand || SEO_DEFAULTS.siteBrand;
  const shortName = seo?.siteBrand || SEO_DEFAULTS.siteBrand;
  const desc = seo?.siteDescription || SEO_DEFAULTS.siteDescription;
  const startUrl = seo?.canonicalUrlBase || SEO_DEFAULTS.canonicalUrlBase;
  const logoPng = `${startUrl}/assets/images/logo.png`;
  const logoWebp = `${startUrl}/assets/images/logo.webp`;
  const favicon = `${startUrl}/favicon.ico`;
  const apple = `${startUrl}/assets/icons/apple-touch-icon.svg`;

  return {
    name,
    short_name: shortName,
    description: desc,
    lang: "bn-BD",
    dir: "ltr",
    start_url: `${startUrl}/`,
    scope: `${startUrl}/`,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#FFFFFF",
    theme_color: "#226B3A",
    categories: ["news", "magazines", "education"],
    icons: [
      {
        src: favicon,
        sizes: "64x64",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: apple,
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: logoPng,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: logoWebp,
        sizes: "512x512",
        type: "image/webp",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "আজকের খবর",
        short_name: "আজকের পত্রিকা",
        description: "আজকের প্রকাশিত সকল সংবাদ",
        url: `${startUrl}/todays-news`,
        icons: [{ src: favicon, sizes: "64x64" }],
      },
      {
        name: "ফটো গ্যালারি",
        short_name: "গ্যালারি",
        description: "সবচেয়ে সাম্প্রতিক ফটো গ্যালারি",
        url: `${startUrl}/gallery`,
        icons: [{ src: favicon, sizes: "64x64" }],
      },
    ],
  };
}

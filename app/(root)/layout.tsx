import { connectToDatabase } from "@/lib/database";
import Category from "@/lib/database/models/category.model";
import News from "@/lib/database/models/news.model";
import { getSetting } from "@/lib/actions/setting.actions";
import { getAds } from "@/lib/actions/ad.actions";
import { getPublishedPages } from "@/lib/actions/page.actions";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import BreakingTicker from "@/components/shared/BreakingTicker";
import Ad from "@/components/shared/Ad";
import ScrollToTop from "@/components/shared/ScrollToTop";
import Script from "next/script";
import { SEO_DEFAULTS, getSeoInfo, toAbsoluteUrl } from "@/lib/seo";

export const revalidate = 120;

function buildJsonLd<T>(obj: T) {
  return JSON.stringify(obj, null, 0);
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectToDatabase();

  const [setting, navCategories, breakingNews, activeAds, pages] =
    await Promise.all([
      getSetting(),
      Category.find().sort({ priority: 1, name: 1 }).lean(),
      News.find({ breaking: true, status: "published" })
        .select("title slug")
        .sort({ publishDate: -1 })
        .limit(10)
        .lean(),
      getAds({ status: "active" }),
      getPublishedPages(),
    ]);

  const footerAds = activeAds.filter((ad) => ad.placement === "footer");
  const popupAds = activeAds.filter((ad) => ad.placement === "popup");
  const stickyAds = activeAds.filter((ad) => ad.placement === "sticky");
  const mobileAds = activeAds.filter((ad) => ad.placement === "mobile");

  const safeCategories = JSON.parse(JSON.stringify(navCategories));
  const safeBreaking = JSON.parse(JSON.stringify(breakingNews));
  const safePages = JSON.parse(JSON.stringify(pages));

  // Convert socialLinks if it is a Map, or use directly if it's already a plain object
  const socialLinks = setting?.socialLinks
    ? setting.socialLinks instanceof Map
      ? Object.fromEntries(setting.socialLinks)
      : (setting.socialLinks as unknown as Record<string, string>)
    : {};

  const seo: Record<string, any> = setting?.seo || {};

  const publicSeo = await getSeoInfo().catch(() => null);
  const canonicalBase =
    publicSeo?.canonicalUrlBase ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    SEO_DEFAULTS.canonicalUrlBase;
  const siteLogoUrl = toAbsoluteUrl("/assets/images/logo.webp", canonicalBase);
  const orgName = publicSeo?.siteBrand || SEO_DEFAULTS.siteBrand;
  const orgNameEnglish = "Daily Muktimarg";
  const social =
    setting?.socialLinks && !(setting.socialLinks instanceof Map)
      ? (setting.socialLinks as unknown as Record<string, string | undefined>)
      : {};
  const sameAsLinks = Object.values(social).filter(
    (u): u is string => typeof u === "string" && u.length > 0,
  );
  // Ensure social media profiles are always included to boost entity authority.
  const defaultSocial = [
    "https://www.facebook.com/dailymuktimarg",
    "https://twitter.com/dailymuktimarg",
    "https://www.youtube.com/@dailymuktimarg",
  ];
  const allSameAs = Array.from(new Set([...sameAsLinks, ...defaultSocial]));
  const potentialSearchTarget = `${canonicalBase}/search?q={search_term_string}`;

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${canonicalBase}/#website`,
    name: orgName,
    alternateName: orgNameEnglish,
    inLanguage: ["bn-BD", "en"],
    url: `${canonicalBase}/`,
    description: publicSeo?.siteDescription || SEO_DEFAULTS.siteDescription,
    publisher: { "@id": `${canonicalBase}/#organization` },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: potentialSearchTarget,
        },
        "query-input": "required name=search_term_string",
      },
    ],
  };

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": `${canonicalBase}/#organization`,
    name: orgName,
    // Bengali legal/primary name first so Google Knowledge Graph favours Bengali.
    legalName: orgName,
    alternateName: orgNameEnglish,
    description: publicSeo?.siteDescription || SEO_DEFAULTS.siteDescription,
    url: `${canonicalBase}/`,
    email: setting?.contactEmail || undefined,
    telephone: setting?.phoneNumber || undefined,
    address: setting?.address || undefined,
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    foundingDate: seo.establishmentDate || "2020",
    // Google's Knowledge Graph logo strict rule: ≤60px height × ≤600px width
    logo: siteLogoUrl
      ? {
          "@type": "ImageObject",
          url: siteLogoUrl,
          width: 600,
          height: 60,
        }
      : undefined,
    image: siteLogoUrl || undefined,
    sameAs: allSameAs,
    knowsLanguage: ["bn-BD", "en-US"],
    ethicsPolicy: seo.ethicsPolicyUrl || undefined,
    masthead: seo.mastheadUrl || undefined,
    correctionsPolicy: seo.correctionsPolicyUrl || undefined,
    diversityPolicy: seo.diversityPolicyUrl || undefined,
    // Signals to Google this is an established News publication
    publishingPrinciples: seo.ethicsPolicyUrl || undefined,
    actionableFeedbackPolicy: seo.correctionsPolicyUrl || undefined,
    ownershipFundingInfo: `${canonicalBase}/pages/about`,
    diversityStaffingReport: seo.diversityPolicyUrl || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${canonicalBase}/pages/about`,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 max-w-full overflow-x-hidden">
      <Script
        id="ld-website-organization"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: buildJsonLd(websiteLd) + "\n" + buildJsonLd(organizationLd),
        }}
      />
      {/* Google Analytics / Google Tag */}
      {(publicSeo?.googleAnalyticsId || seo.googleAnalyticsId || SEO_DEFAULTS.googleAnalyticsId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${
              publicSeo?.googleAnalyticsId || seo.googleAnalyticsId || SEO_DEFAULTS.googleAnalyticsId
            }`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${
                publicSeo?.googleAnalyticsId || seo.googleAnalyticsId || SEO_DEFAULTS.googleAnalyticsId
              }');
            `}
          </Script>
        </>
      )}

      {/* Header Script */}
      {setting?.headerScript && (
        <Script
          id="header-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: setting.headerScript }}
        />
      )}

      <Header categories={safeCategories} socialLinks={socialLinks} />
      {safeBreaking.length > 0 && <BreakingTicker items={safeBreaking} />}
      <main className="flex-1">{children}</main>
      {footerAds.length > 0 && (
        <div className="py-4 px-4 border-t border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto space-y-4">
            {footerAds.map((ad) => (
              <Ad key={ad._id.toString()} ad={ad} />
            ))}
          </div>
        </div>
      )}
      <Footer
        contactEmail={setting?.contactEmail}
        phoneNumber={setting?.phoneNumber}
        address={setting?.address}
        socialLinks={socialLinks}
        pages={safePages}
      />
      {popupAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
      {stickyAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}
      {mobileAds.map((ad) => (
        <Ad key={ad._id.toString()} ad={ad} />
      ))}

      <ScrollToTop />

      {/* Footer Script */}
      {setting?.footerScript && (
        <Script
          id="footer-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: setting.footerScript }}
        />
      )}
    </div>
  );
}

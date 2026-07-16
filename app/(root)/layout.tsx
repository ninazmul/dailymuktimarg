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
import Script from "next/script";

export const revalidate = 120;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectToDatabase();

  const [setting, navCategories, breakingNews, activeAds, pages] =
    await Promise.all([
      getSetting(),
      Category.find({ isNavbar: true }).sort({ priority: 1, name: 1 }).lean(),
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

  const seo = setting?.seo || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Google Analytics */}
      {seo.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${seo.googleAnalyticsId}');
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

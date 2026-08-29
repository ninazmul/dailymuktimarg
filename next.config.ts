import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongoose", "nodemailer", "uploadthing"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-label",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io", port: "" },
      { protocol: "https", hostname: "img.clerk.com", port: "" },
      { protocol: "https", hostname: "ufs.sh", port: "" },
      { protocol: "https", hostname: "*.ufs.sh", port: "" },
    ],
  },
  async headers() {
    return [
      {
        // Match any .apk file served from the public directory
        source: "/:file*.apk",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Content-Disposition",
            value: 'attachment; filename="dailymuktimarg.apk"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

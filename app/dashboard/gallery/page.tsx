import { requirePermission } from "@/lib/auth/rbac";
import { getGalleries } from "@/lib/actions/gallery.actions";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function GalleryDashboardPage() {
  const access = await requirePermission("gallery", "read");
  const result = await getGalleries({ limit: 50 });
  return <GalleryClient initialResult={result} access={access} />;
}

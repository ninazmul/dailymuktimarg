import { requirePermission } from "@/lib/auth/rbac";
import { getAds } from "@/lib/actions/ad.actions";
import AdsClient from "./AdsClient";

export const dynamic = "force-dynamic";

export default async function AdsDashboardPage() {
  const access = await requirePermission("ads", "read");
  const ads = await getAds();
  return <AdsClient initialAds={ads} access={access} />;
}

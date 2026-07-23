import { requirePermission } from "@/lib/auth/rbac";
import { getSetting } from "@/lib/actions/setting.actions";
import TodaysNewsDashboardClient from "./TodaysNewsDashboardClient";

export const dynamic = "force-dynamic";

export default async function TodaysNewsDashboardPage() {
  const access = await requirePermission("todays-news", "read");
  const setting = await getSetting();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <TodaysNewsDashboardClient initialSetting={setting} access={access} />
    </div>
  );
}

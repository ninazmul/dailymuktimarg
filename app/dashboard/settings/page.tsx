import { requirePermission } from "@/lib/auth/rbac";
import { getSetting } from "@/lib/actions/setting.actions";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsDashboardPage() {
  const access = await requirePermission("settings", "read");
  const setting = await getSetting();
  return <SettingsClient initialSetting={setting} access={access} />;
}

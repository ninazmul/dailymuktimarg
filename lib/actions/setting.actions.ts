"use server";

import { connectToDatabase } from "@/lib/database";
import Setting, { ISetting } from "@/lib/database/models/setting.model";
import { requirePermission } from "@/lib/auth/rbac";
import { SettingFormParams } from "@/types";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getSetting(): Promise<ISetting | null> {
  try {
    await connectToDatabase();
    const setting = await Setting.findOne().lean<ISetting>();
    return setting ? safeJson(setting) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function updateSetting(params: SettingFormParams): Promise<ISetting> {
  try {
    await requirePermission("settings", "update");
    await connectToDatabase();

    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting({
        contactEmail: params.contactEmail,
        phoneNumber: params.phoneNumber,
        address: params.address,
        socialLinks: params.socialLinks,
        headerScript: params.headerScript,
        footerScript: params.footerScript,
        maintenanceMode: params.maintenanceMode ?? false,
        seo: params.seo,
      });
      await setting.save();
    } else {
      if (params.contactEmail !== undefined) setting.contactEmail = params.contactEmail;
      if (params.phoneNumber !== undefined) setting.phoneNumber = params.phoneNumber;
      if (params.address !== undefined) setting.address = params.address;
      if (params.socialLinks !== undefined) setting.socialLinks = params.socialLinks;
      if (params.headerScript !== undefined) setting.headerScript = params.headerScript;
      if (params.footerScript !== undefined) setting.footerScript = params.footerScript;
      if (params.maintenanceMode !== undefined) setting.maintenanceMode = params.maintenanceMode;
      if (params.seo !== undefined) {
        // Merge existing SEO with new params to preserve fields not being updated
        setting.seo = {
          ...(setting.seo || {}),
          ...params.seo,
        };
      }

      await setting.save();
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/");
    return safeJson(setting);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

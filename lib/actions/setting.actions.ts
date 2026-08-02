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

    // Build a flat $set map so every field is saved explicitly via dot-notation.
    // This avoids Mongoose change-detection issues with nested booleans like showSidebar.
    const setMap: Record<string, any> = {};

    if (params.contactEmail !== undefined) setMap["contactEmail"] = params.contactEmail;
    if (params.phoneNumber !== undefined) setMap["phoneNumber"] = params.phoneNumber;
    if (params.address !== undefined) setMap["address"] = params.address;
    if (params.socialLinks !== undefined) setMap["socialLinks"] = params.socialLinks;
    if (params.headerScript !== undefined) setMap["headerScript"] = params.headerScript;
    if (params.footerScript !== undefined) setMap["footerScript"] = params.footerScript;
    if (params.maintenanceMode !== undefined) setMap["maintenanceMode"] = params.maintenanceMode;

    if (params.seo !== undefined) {
      Object.entries(params.seo).forEach(([key, val]) => {
        if (val !== undefined) setMap[`seo.${key}`] = val;
      });
    }

    if (params.todaysNewsLayout !== undefined) {
      // Write each sub-field explicitly as a dot-notation path so booleans
      // (including false) are always persisted correctly.
      Object.entries(params.todaysNewsLayout).forEach(([key, val]) => {
        if (val !== undefined) setMap[`todaysNewsLayout.${key}`] = val;
      });
      // Explicitly include boolean fields even when false
      if (params.todaysNewsLayout.showSidebar !== undefined) {
        setMap["todaysNewsLayout.showSidebar"] = params.todaysNewsLayout.showSidebar;
      }
      if (params.todaysNewsLayout.showLeadHero !== undefined) {
        setMap["todaysNewsLayout.showLeadHero"] = params.todaysNewsLayout.showLeadHero;
      }
      if (params.todaysNewsLayout.showCategoryFilter !== undefined) {
        setMap["todaysNewsLayout.showCategoryFilter"] = params.todaysNewsLayout.showCategoryFilter;
      }
    }

    const updated = await Setting.findOneAndUpdate(
      {},
      { $set: setMap },
      { upsert: true, new: true, lean: true },
    );

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/todays-news");
    revalidatePath("/todays-news");
    revalidatePath("/");

    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

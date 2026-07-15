"use server";

import { connectToDatabase } from "@/lib/database";
import Ad, { IAd } from "@/lib/database/models/ad.model";
import { requirePermission } from "@/lib/auth/rbac";
import { AdFormParams } from "@/types";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getAds(params?: {
  placement?: string;
  status?: string;
}): Promise<IAd[]> {
  try {
    await connectToDatabase();
    const query: any = {};
    if (params?.placement) query.placement = params.placement;
    if (params?.status) query.status = params.status;

    const now = new Date();
    query.$or = [
      { startDate: { $lte: now }, endDate: { $gte: now } },
      { startDate: null, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: null },
    ];

    let adsQuery = Ad.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean<IAd[]>();

    if (params?.status) {
      adsQuery = adsQuery.select(
        "placement client imageUrl htmlCode targetUrl status priority startDate endDate",
      );
    }

    const ads = await adsQuery;
    return safeJson(ads);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createAd(params: AdFormParams): Promise<IAd> {
  await requirePermission("ads", "create");
  try {
    await connectToDatabase();
    const ad = await Ad.create(params);
    revalidatePath("/dashboard/ads");
    revalidatePath("/");
    return safeJson(ad);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateAd(id: string, params: Partial<AdFormParams>): Promise<IAd> {
  await requirePermission("ads", "update");
  try {
    await connectToDatabase();
    const updated = await Ad.findByIdAndUpdate(id, { $set: params }, { returnDocument: "after" });
    if (!updated) throw new Error("Ad not found");
    revalidatePath("/dashboard/ads");
    revalidatePath("/");
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteAd(id: string) {
  await requirePermission("ads", "delete");
  try {
    await connectToDatabase();
    const deleted = await Ad.findByIdAndDelete(id);
    if (!deleted) throw new Error("Ad not found");
    revalidatePath("/dashboard/ads");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

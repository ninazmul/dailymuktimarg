"use server";

import { connectToDatabase } from "@/lib/database";
import Media, { IMedia } from "@/lib/database/models/media.model";
import { requirePermission } from "@/lib/auth/rbac";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getMediaItems(params: {
  folder?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("media", "read");
  try {
    await connectToDatabase();

    const page = params.page || 1;
    const limit = params.limit || 30;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.folder && params.folder !== "All") {
      query.folder = params.folder;
    }
    if (params.search) {
      query.$or = [
        { name: new RegExp(params.search, "i") },
        { altText: new RegExp(params.search, "i") },
      ];
    }

    const [items, totalCount] = await Promise.all([
      Media.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IMedia[]>(),
      Media.countDocuments(query),
    ]);

    return {
      items: safeJson(items),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return { items: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getDistinctFolders(): Promise<string[]> {
  await requirePermission("media", "read");
  try {
    await connectToDatabase();
    const folders = await Media.distinct("folder");
    // Ensure "Root" is always included and sorting keeps it first
    const result = new Set<string>(["Root"]);
    folders.forEach((f) => {
      if (f) result.add(f);
    });
    return Array.from(result).sort();
  } catch (error) {
    handleError(error);
    return ["Root"];
  }
}

export async function updateMediaAltText(mediaId: string, altText: string): Promise<IMedia> {
  await requirePermission("media", "update");
  try {
    await connectToDatabase();
    const item = await Media.findByIdAndUpdate(
      mediaId,
      { $set: { altText } },
      { returnDocument: "after" },
    );
    if (!item) throw new Error("Media item not found");
    revalidatePath("/dashboard/media");
    return safeJson(item);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function renameMediaItem(mediaId: string, name: string): Promise<IMedia> {
  await requirePermission("media", "update");
  try {
    await connectToDatabase();
    const item = await Media.findByIdAndUpdate(
      mediaId,
      { $set: { name } },
      { returnDocument: "after" },
    );
    if (!item) throw new Error("Media item not found");
    revalidatePath("/dashboard/media");
    return safeJson(item);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteMediaItem(mediaId: string) {
  await requirePermission("media", "delete");
  try {
    await connectToDatabase();
    const deleted = await Media.findByIdAndDelete(mediaId);
    if (!deleted) throw new Error("Media item not found");

    revalidatePath("/dashboard/media");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

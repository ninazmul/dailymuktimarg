"use server";

import { connectToDatabase } from "@/lib/database";
import Gallery, { IGallery } from "@/lib/database/models/gallery.model";
import { requirePermission } from "@/lib/auth/rbac";
import { GalleryFormParams } from "@/types";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getGalleries(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  try {
    await connectToDatabase();

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params?.status) {
      query.status = params.status;
    }
    if (params?.search) {
      query.$or = [
        { title: { $regex: params.search, $options: "i" } },
        { subtitle: { $regex: params.search, $options: "i" } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      Gallery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IGallery[]>(),
      Gallery.countDocuments(query),
    ]);

    return {
      items: safeJson(items) as IGallery[],
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return {
      items: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
}

export async function getGalleryBySlug(slug: string): Promise<IGallery | null> {
  try {
    await connectToDatabase();
    const gallery = await Gallery.findOne({ slug, status: "published" }).lean<IGallery>();
    return gallery ? safeJson(gallery) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function getGalleryById(id: string): Promise<IGallery | null> {
  try {
    await connectToDatabase();
    const gallery = await Gallery.findById(id).lean<IGallery>();
    return gallery ? safeJson(gallery) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createGallery(params: GalleryFormParams): Promise<IGallery> {
  await requirePermission("gallery", "create");
  try {
    await connectToDatabase();

    let slug = params.slug ? generateSlug(params.slug) : generateSlug(params.title);
    if (!slug) {
      slug = `gallery-${Date.now()}`;
    }

    // Ensure unique slug
    let uniqueSlug = slug;
    let count = 1;
    while (await Gallery.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${slug}-${count++}`;
    }

    const gallery = await Gallery.create({
      title: params.title,
      subtitle: params.subtitle || "",
      slug: uniqueSlug,
      mainImage: params.mainImage,
      secondaryPhotos: params.secondaryPhotos || [],
      status: params.status || "published",
    });

    revalidatePath("/dashboard/gallery");
    revalidatePath("/");
    return safeJson(gallery);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateGallery(
  id: string,
  params: Partial<GalleryFormParams>
): Promise<IGallery> {
  await requirePermission("gallery", "update");
  try {
    await connectToDatabase();

    const updateData: any = {};
    if (params.title !== undefined) updateData.title = params.title;
    if (params.subtitle !== undefined) updateData.subtitle = params.subtitle;
    if (params.mainImage !== undefined) updateData.mainImage = params.mainImage;
    if (params.secondaryPhotos !== undefined) updateData.secondaryPhotos = params.secondaryPhotos;
    if (params.status !== undefined) updateData.status = params.status;

    if (params.slug) {
      let slug = generateSlug(params.slug);
      let uniqueSlug = slug;
      let count = 1;
      while (await Gallery.exists({ slug: uniqueSlug, _id: { $ne: id } })) {
        uniqueSlug = `${slug}-${count++}`;
      }
      updateData.slug = uniqueSlug;
    }

    const updated = await Gallery.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!updated) throw new Error("Gallery item not found");

    revalidatePath("/dashboard/gallery");
    revalidatePath("/");
    revalidatePath(`/gallery/${updated.slug}`);
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteGallery(id: string) {
  await requirePermission("gallery", "delete");
  try {
    await connectToDatabase();
    const deleted = await Gallery.findByIdAndDelete(id);
    if (!deleted) throw new Error("Gallery item not found");

    revalidatePath("/dashboard/gallery");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

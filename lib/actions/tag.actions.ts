"use server";

import { connectToDatabase } from "@/lib/database";
import Tag, { ITag } from "@/lib/database/models/tag.model";
import { requirePermission } from "@/lib/auth/rbac";
import { TagFormParams } from "@/types";
import { safeJson, handleError, generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getTags(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    await connectToDatabase();

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.search) {
      query.name = new RegExp(params.search, "i");
    }

    const [tags, totalCount] = await Promise.all([
      Tag.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<ITag[]>(),
      Tag.countDocuments(query),
    ]);

    return {
      tags: safeJson(tags),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return { tags: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getAllTags(): Promise<ITag[]> {
  try {
    await connectToDatabase();
    const tags = await Tag.find().sort({ name: 1 }).lean<ITag[]>();
    return safeJson(tags);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createTag(params: TagFormParams): Promise<ITag> {
  const adminAccess = await requirePermission("tags", "create");
  try {
    await connectToDatabase();

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.name);

    // Verify uniqueness
    const existing = await Tag.findOne({ slug });
    if (existing) {
      throw new Error(`Tag slug "${slug}" is already in use.`);
    }

    const newTag = await Tag.create({
      name: params.name,
      slug,
    });

    revalidatePath("/dashboard/tags");
    return safeJson(newTag);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateTag(
  id: string,
  params: TagFormParams,
): Promise<ITag> {
  const adminAccess = await requirePermission("tags", "update");
  try {
    await connectToDatabase();

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.name);

    const existing = await Tag.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      throw new Error(`Tag slug "${slug}" is already in use.`);
    }

    const updated = await Tag.findByIdAndUpdate(
      id,
      { $set: { name: params.name, slug } },
      { returnDocument: "after" },
    );

    if (!updated) throw new Error("Tag not found");

    revalidatePath("/dashboard/tags");
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteTag(id: string) {
  const adminAccess = await requirePermission("tags", "delete");
  try {
    await connectToDatabase();

    const deleted = await Tag.findByIdAndDelete(id);
    if (!deleted) throw new Error("Tag not found");

    revalidatePath("/dashboard/tags");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

"use server";

import { connectToDatabase } from "@/lib/database";
import HomepageLayout, {
  IHomepageLayout,
} from "@/lib/database/models/homepageLayout.model";
import { requirePermission } from "@/lib/auth/rbac";
import { HomepageLayoutFormParams } from "@/types";
import { safeJson, handleError } from "@/lib/utils";
import { revalidateTag as _revalidateTag, revalidatePath } from "next/cache";
const revalidateTag = _revalidateTag as (tag: string) => void;

export async function getHomepageSections(): Promise<IHomepageLayout[]> {
  try {
    await connectToDatabase();
    const sections = await HomepageLayout.find()
      .populate("categoryId", "name slug")
      .sort({ order: 1 })
      .lean<IHomepageLayout[]>();
    return safeJson(sections);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createHomepageSection(
  params: HomepageLayoutFormParams,
): Promise<IHomepageLayout> {
  await requirePermission("homepage-builder", "create");
  try {
    await connectToDatabase();

    // Auto-assign order to end of list
    const count = await HomepageLayout.countDocuments();
    const section = await HomepageLayout.create({
      ...params,
      order: params.order ?? count,
    });

    revalidateTag("homepage");
    revalidatePath("/dashboard/builder");
    revalidatePath("/");
    return safeJson(section);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateHomepageSection(
  id: string,
  params: Partial<HomepageLayoutFormParams>,
): Promise<IHomepageLayout> {
  await requirePermission("homepage-builder", "update");
  try {
    await connectToDatabase();

    const updated = await HomepageLayout.findByIdAndUpdate(
      id,
      { $set: params },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Section not found");

    revalidateTag("homepage");
    revalidatePath("/dashboard/builder");
    revalidatePath("/");
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteHomepageSection(id: string) {
  await requirePermission("homepage-builder", "delete");
  try {
    await connectToDatabase();

    const deleted = await HomepageLayout.findByIdAndDelete(id);
    if (!deleted) throw new Error("Section not found");

    revalidateTag("homepage");
    revalidatePath("/dashboard/builder");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

/**
 * Reorder homepage sections. Accepts an array of { id, order } pairs.
 */
export async function reorderHomepageSections(
  items: { id: string; order: number }[],
) {
  await requirePermission("homepage-builder", "update");
  try {
    await connectToDatabase();

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    await HomepageLayout.bulkWrite(bulkOps);

    revalidateTag("homepage");
    revalidatePath("/dashboard/builder");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

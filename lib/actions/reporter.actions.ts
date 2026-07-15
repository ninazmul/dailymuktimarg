"use server";

import { connectToDatabase } from "@/lib/database";
import Reporter, { IReporter } from "@/lib/database/models/reporter.model";
import { requirePermission } from "@/lib/auth/rbac";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getReporters(
  params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {},
) {
  try {
    await connectToDatabase();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.search) {
      query.$or = [
        { name: new RegExp(params.search, "i") },
        { email: new RegExp(params.search, "i") },
      ];
    }

    const [reporters, totalCount] = await Promise.all([
      Reporter.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IReporter[]>(),
      Reporter.countDocuments(query),
    ]);

    return {
      reporters: safeJson(reporters),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return { reporters: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getAllReporters(): Promise<IReporter[]> {
  try {
    await connectToDatabase();
    const reporters = await Reporter.find()
      .sort({ name: 1 })
      .lean<IReporter[]>();
    return safeJson(reporters);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createReporter(params: {
  name: string;
  email?: string;
  bio?: string;
  image?: string;
  socialLinks?: Record<string, string>;
}): Promise<IReporter> {
  await requirePermission("reporters", "create");
  try {
    await connectToDatabase();
    const newReporter = await Reporter.create(params);
    revalidatePath("/dashboard/reporters");
    return safeJson(newReporter);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateReporter(
  id: string,
  params: {
    name: string;
    email?: string;
    bio?: string;
    image?: string;
    socialLinks?: Record<string, string>;
  },
): Promise<IReporter> {
  await requirePermission("reporters", "update");
  try {
    await connectToDatabase();
    const updated = await Reporter.findByIdAndUpdate(
      id,
      { $set: params },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Reporter not found");
    revalidatePath("/dashboard/reporters");
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteReporter(id: string) {
  await requirePermission("reporters", "delete");
  try {
    await connectToDatabase();
    const deleted = await Reporter.findByIdAndDelete(id);
    if (!deleted) throw new Error("Reporter not found");
    revalidatePath("/dashboard/reporters");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

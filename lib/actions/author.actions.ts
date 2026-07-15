"use server";

import { connectToDatabase } from "@/lib/database";
import Author, { IAuthor } from "@/lib/database/models/author.model";
import { requirePermission } from "@/lib/auth/rbac";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getAuthors(
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

    const [authors, totalCount] = await Promise.all([
      Author.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IAuthor[]>(),
      Author.countDocuments(query),
    ]);

    return {
      authors: safeJson(authors),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return { authors: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getAllAuthors(): Promise<IAuthor[]> {
  try {
    await connectToDatabase();
    const authors = await Author.find().sort({ name: 1 }).lean<IAuthor[]>();
    return safeJson(authors);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createAuthor(params: {
  name: string;
  email?: string;
  bio?: string;
  image?: string;
  socialLinks?: Record<string, string>;
}): Promise<IAuthor> {
  await requirePermission("authors", "create");
  try {
    await connectToDatabase();
    const newAuthor = await Author.create(params);
    revalidatePath("/dashboard/authors");
    return safeJson(newAuthor);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateAuthor(
  id: string,
  params: {
    name: string;
    email?: string;
    bio?: string;
    image?: string;
    socialLinks?: Record<string, string>;
  },
): Promise<IAuthor> {
  await requirePermission("authors", "update");
  try {
    await connectToDatabase();
    const updated = await Author.findByIdAndUpdate(
      id,
      { $set: params },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Author not found");
    revalidatePath("/dashboard/authors");
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteAuthor(id: string) {
  await requirePermission("authors", "delete");
  try {
    await connectToDatabase();
    const deleted = await Author.findByIdAndDelete(id);
    if (!deleted) throw new Error("Author not found");
    revalidatePath("/dashboard/authors");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

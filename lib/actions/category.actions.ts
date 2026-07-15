"use server";

import { connectToDatabase } from "@/lib/database";
import Category, { ICategory } from "@/lib/database/models/category.model";
import { requirePermission } from "@/lib/auth/rbac";
import { CategoryFormParams } from "@/types";
import { safeJson, handleError, generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getCategories(): Promise<ICategory[]> {
  try {
    await connectToDatabase();
    const categories = await Category.find()
      .populate("parentId", "name slug")
      .sort({ priority: 1, name: 1 })
      .lean<ICategory[]>();
    return safeJson(categories);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createCategory(params: CategoryFormParams): Promise<ICategory> {
  const adminAccess = await requirePermission("categories", "create");
  try {
    await connectToDatabase();

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.name);

    // Verify uniqueness
    const existing = await Category.findOne({ slug });
    if (existing) {
      throw new Error(`Category slug "${slug}" is already in use.`);
    }

    let parentPath = "";
    if (params.parentId) {
      const parent = await Category.findById(params.parentId);
      if (parent) {
        parentPath = parent.path || `,${parent.slug},`;
      }
    }

    // Materialized path logic: ,parentSlug,childSlug,
    const path = params.parentId ? `${parentPath}${slug},` : `,${slug},`;

    const newCategory = await Category.create({
      name: params.name,
      slug,
      parentId: params.parentId || null,
      path,
      priority: params.priority || 0,
      isNavbar: params.isNavbar || false,
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/");
    return safeJson(newCategory);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateCategory(
  id: string,
  params: CategoryFormParams,
): Promise<ICategory> {
  const adminAccess = await requirePermission("categories", "update");
  try {
    await connectToDatabase();

    const category = await Category.findById(id);
    if (!category) throw new Error("Category not found");

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.name);

    if (slug !== category.slug) {
      const existing = await Category.findOne({ slug });
      if (existing) {
        throw new Error(`Category slug "${slug}" is already in use.`);
      }
    }

    let parentPath = "";
    if (params.parentId) {
      if (params.parentId === id) {
        throw new Error("A category cannot be its own parent.");
      }
      const parent = await Category.findById(params.parentId);
      if (parent) {
        parentPath = parent.path || `,${parent.slug},`;
      }
    }

    const newPath = params.parentId ? `${parentPath}${slug},` : `,${slug},`;

    // If path changed, we must also update all descendants paths
    const oldPath = category.path;
    if (oldPath && oldPath !== newPath) {
      const descendants = await Category.find({ path: new RegExp(`^${oldPath}`) });
      for (const desc of descendants) {
        const descPath: string = desc.path || "";
        desc.path = descPath.replace(oldPath, newPath);
        await desc.save();
      }
    }

    category.name = params.name;
    category.slug = slug;
    category.parentId = (params.parentId as any) || null;
    category.path = newPath;
    category.priority = params.priority || 0;
    category.isNavbar = params.isNavbar || false;

    await category.save();

    revalidatePath("/dashboard/categories");
    revalidatePath("/");
    return safeJson(category);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteCategory(id: string) {
  const adminAccess = await requirePermission("categories", "delete");
  try {
    await connectToDatabase();

    // Check if category has children
    const child = await Category.findOne({ parentId: id });
    if (child) {
      throw new Error("Cannot delete a category that has subcategories. Delete children first.");
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw new Error("Category not found");

    revalidatePath("/dashboard/categories");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

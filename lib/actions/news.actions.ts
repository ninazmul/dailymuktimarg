"use server";

import { connectToDatabase } from "@/lib/database";
import News, { INews } from "@/lib/database/models/news.model";
import AuditLog from "@/lib/database/models/auditLog.model";
import { requirePermission } from "@/lib/auth/rbac";
import { NewsFormParams } from "@/types";
import { safeJson, handleError, generateSlug } from "@/lib/utils";
import { revalidateTag as _revalidateTag, revalidatePath } from "next/cache";
const revalidateTag = _revalidateTag as (tag: string) => void;

const NEWS_LIST_FIELDS =
  "title slug featuredImage categoryId nestedCategoryId reporterId authorId tags publishDate views lead leadPosition status";

// ===== Helpers =====

/**
 * Ensures that if a new article is assigned a lead position (1 to 6),
 * any previous article occupying that position is unset.
 */
async function resolveLeadPositionConflicts(position: number, currentId?: string) {
  const query: any = { lead: true, leadPosition: position };
  if (currentId) {
    query._id = { $ne: currentId };
  }
  
  await News.updateMany(query, {
    $set: { lead: false, leadPosition: null },
  });
}

// ===== Actions =====

export async function getNewsArticles(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    await connectToDatabase();

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.search) {
      query.$or = [
        { title: new RegExp(params.search, "i") },
        { subtitle: new RegExp(params.search, "i") },
      ];
    }
    if (params.categoryId) {
      query.categoryId = params.categoryId;
    }
    if (params.status && params.status !== "all") {
      query.status = params.status;
    }

    const sortField = params.sortBy || "publishDate";
    const sortOrder = params.sortOrder === "asc" ? 1 : -1;
    const sortObj: any = { [sortField]: sortOrder };

    const [articles, totalCount] = await Promise.all([
      News.find(query)
        .select(NEWS_LIST_FIELDS)
        .populate("categoryId", "name slug")
        .populate("nestedCategoryId", "name slug")
        .populate("reporterId", "name image")
        .populate("authorId", "name image")
        .populate("tags", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<INews[]>(),
      News.countDocuments(query),
    ]);

    return {
      articles: safeJson(articles),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return { articles: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getNewsArticleBySlug(slug: string): Promise<INews | null> {
  try {
    await connectToDatabase();
    const article = await News.findOne({ slug })
      .populate("categoryId", "name slug")
      .populate("nestedCategoryId", "name slug")
      .populate("reporterId", "name bio image socialLinks")
      .populate("authorId", "name bio image socialLinks")
      .populate("tags", "name slug")
      .lean<INews>();
    
    return article ? safeJson(article) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function getNewsArticleById(id: string): Promise<INews | null> {
  try {
    await connectToDatabase();
    const article = await News.findById(id)
      .populate("tags", "name slug")
      .lean<INews>();
    return article ? safeJson(article) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function createNewsArticle(params: NewsFormParams): Promise<INews> {
  const adminAccess = await requirePermission("news", "create");
  try {
    await connectToDatabase();

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.title);

    // Verify uniqueness of slug
    const existing = await News.findOne({ slug });
    if (existing) {
      throw new Error(`Article slug "${slug}" is already in use.`);
    }

    // Resolve conflicts if assigned to homepage lead position
    if (params.lead && params.leadPosition) {
      await resolveLeadPositionConflicts(params.leadPosition);
    }

    const newArticle = await News.create({
      ...params,
      slug,
      views: 0,
      publishDate: params.publishDate ? new Date(params.publishDate) : new Date(),
    });

    await AuditLog.create({
      userId: adminAccess.dbUserId,
      action: "create",
      module: "news",
      targetId: newArticle._id.toString(),
      details: `Created article "${params.title}"`,
    });

    // Clear caches
    revalidateTag("news");
    revalidateTag("homepage");
    revalidatePath("/dashboard/news");
    revalidatePath("/");

    return safeJson(newArticle);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateNewsArticle(id: string, params: NewsFormParams): Promise<INews> {
  const adminAccess = await requirePermission("news", "update");
  try {
    await connectToDatabase();

    const article = await News.findById(id);
    if (!article) throw new Error("Article not found");

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.title);

    if (slug !== article.slug) {
      const existing = await News.findOne({ slug });
      if (existing) {
        throw new Error(`Article slug "${slug}" is already in use.`);
      }
    }

    // Resolve conflicts if assigned to homepage lead position
    if (params.lead && params.leadPosition) {
      await resolveLeadPositionConflicts(params.leadPosition, id);
    }

    // Explicitly update all fields to prevent Mongoose schema validation gaps
    const updated = await News.findByIdAndUpdate(
      id,
      {
        $set: {
          ...params,
          slug,
          publishDate: params.publishDate ? new Date(params.publishDate) : article.publishDate,
        },
      },
      { returnDocument: "after" },
    );

    if (!updated) throw new Error("Update failed");

    await AuditLog.create({
      userId: adminAccess.dbUserId,
      action: "update",
      module: "news",
      targetId: id,
      details: `Updated article "${params.title}"`,
    });

    // Clear caches
    revalidateTag("news");
    revalidateTag("homepage");
    revalidatePath(`/news/${slug}`);
    revalidatePath("/dashboard/news");
    revalidatePath("/");

    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deleteNewsArticle(id: string) {
  const adminAccess = await requirePermission("news", "delete");
  try {
    await connectToDatabase();

    const deleted = await News.findByIdAndDelete(id);
    if (!deleted) throw new Error("Article not found");

    await AuditLog.create({
      userId: adminAccess.dbUserId,
      action: "delete",
      module: "news",
      targetId: id,
      details: `Deleted article "${deleted.title}"`,
    });

    // Clear caches
    revalidateTag("news");
    revalidateTag("homepage");
    revalidatePath("/dashboard/news");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function incrementNewsViews(id: string) {
  try {
    await connectToDatabase();
    await News.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return { success: true };
  } catch (error) {
    console.error("Failed to increment views:", error);
    return { success: false };
  }
}

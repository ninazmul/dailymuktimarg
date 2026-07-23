"use server";

import { connectToDatabase } from "@/lib/database";
import News, { INews, NewsStatus } from "@/lib/database/models/news.model";
import AuditLog from "@/lib/database/models/auditLog.model";
import { requirePermission } from "@/lib/auth/rbac";
import { hasPermission } from "@/lib/auth/rbac-rules";
import { NewsFormParams } from "@/types";
import { safeJson, handleError, generateSlug } from "@/lib/utils";
import { revalidateTag as _revalidateTag, revalidatePath } from "next/cache";
const revalidateTag = _revalidateTag as (tag: string) => void;

const NEWS_LIST_FIELDS =
  "title slug featuredImage categoryId nestedCategoryId reporterId authorId tags publishDate views lead leadPosition status";

// ===== Helpers =====

/**
 * Ensures that if a new article is assigned a lead position (1 to 12),
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
  const canPublish = hasPermission(adminAccess, "news", "publish");

  try {
    await connectToDatabase();

    const slug = params.slug ? generateSlug(params.slug) : generateSlug(params.title);

    // Verify uniqueness of slug
    const existing = await News.findOne({ slug });
    if (existing) {
      throw new Error(`Article slug "${slug}" is already in use.`);
    }

    // Force status to "review" if user lacks publish access and attempts to set "published"
    let status = params.status || "draft";
    if (status === "published" && !canPublish) {
      status = "review";
    }

    // Resolve conflicts if assigned to homepage lead position
    if (params.lead && params.leadPosition) {
      await resolveLeadPositionConflicts(params.leadPosition);
    }

    const newArticle = await News.create({
      ...params,
      status,
      slug,
      views: 0,
      publishDate: params.publishDate ? new Date(params.publishDate) : new Date(),
    });

    await AuditLog.create({
      userId: adminAccess.dbUserId,
      action: status === "published" ? "publish" : "create",
      module: "news",
      targetId: newArticle._id.toString(),
      details: status === "published"
        ? `Created and published article "${params.title}"`
        : `Created article "${params.title}" (Status: ${status})`,
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
  const canPublish = hasPermission(adminAccess, "news", "publish");

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

    // Status security check: non-publishers cannot set or publish articles directly
    let status = params.status || article.status;
    if (status === "published" && !canPublish) {
      if (article.status !== "published") {
        throw new Error("Forbidden: You do not have permission to publish news articles.");
      } else {
        // Sent for re-review if edited by non-publisher
        status = "review";
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
          status,
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
      details: `Updated article "${params.title}" (Status: ${status})`,
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

export async function approveNewsArticle(id: string): Promise<INews> {
  const adminAccess = await requirePermission("news", "publish");
  try {
    await connectToDatabase();

    const article = await News.findById(id);
    if (!article) throw new Error("Article not found");

    const updated = await News.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "published",
          publishDate: article.publishDate || new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!updated) throw new Error("Approval failed");

    await AuditLog.create({
      userId: adminAccess.dbUserId,
      action: "publish",
      module: "news",
      targetId: id,
      details: `Approved and published article "${article.title}"`,
    });

    revalidateTag("news");
    revalidateTag("homepage");
    revalidatePath("/dashboard/news");
    revalidatePath("/");
    if (updated.slug) {
      revalidatePath(`/news/${updated.slug}`);
    }

    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updateNewsStatus(
  id: string,
  status: NewsStatus,
): Promise<INews> {
  const requiredAction = status === "published" ? "publish" : "update";
  const adminAccess = await requirePermission("news", requiredAction);
  try {
    await connectToDatabase();

    const article = await News.findById(id);
    if (!article) throw new Error("Article not found");

    const updateFields: any = { status };
    if (status === "published" && !article.publishDate) {
      updateFields.publishDate = new Date();
    }

    const updated = await News.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: "after" },
    );

    if (!updated) throw new Error("Status update failed");

    await AuditLog.create({
      userId: adminAccess.dbUserId,
      action: status === "published" ? "publish" : "update",
      module: "news",
      targetId: id,
      details: `Changed status of article "${article.title}" to ${status}`,
    });

    revalidateTag("news");
    revalidateTag("homepage");
    revalidatePath("/dashboard/news");
    revalidatePath("/");
    if (updated.slug) {
      revalidatePath(`/news/${updated.slug}`);
    }

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

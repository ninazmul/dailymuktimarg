"use server";

import { connectToDatabase } from "@/lib/database";
import Page, { IPage } from "@/lib/database/models/page.model";
import { requirePermission } from "@/lib/auth/rbac";
import { safeJson, handleError } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getPages(
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
        { title: new RegExp(params.search, "i") },
        { slug: new RegExp(params.search, "i") },
      ];
    }

    const [pages, totalCount] = await Promise.all([
      Page.find(query)
        .sort({ title: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IPage[]>(),
      Page.countDocuments(query),
    ]);

    return {
      pages: safeJson(pages),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    handleError(error);
    return { pages: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function getAllPages(): Promise<IPage[]> {
  try {
    await connectToDatabase();
    const pages = await Page.find().sort({ title: 1 }).lean<IPage[]>();
    return safeJson(pages);
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function getPage(id: string): Promise<IPage | null> {
  try {
    await connectToDatabase();
    const page = await Page.findById(id).lean<IPage>();
    return safeJson(page);
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function createPage(params: {
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  seo?: {
    title?: string;
    description?: string;
  };
}): Promise<IPage> {
  await requirePermission("pages", "create");
  try {
    await connectToDatabase();
    const newPage = await Page.create(params);
    revalidatePath("/dashboard/pages");
    revalidatePath(`/pages/${params.slug}`);
    return safeJson(newPage);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function updatePage(
  id: string,
  params: {
    title?: string;
    slug?: string;
    content?: string;
    status?: "draft" | "published";
    seo?: {
      title?: string;
      description?: string;
    };
  },
): Promise<IPage> {
  await requirePermission("pages", "update");
  try {
    await connectToDatabase();
    const updated = await Page.findByIdAndUpdate(
      id,
      { $set: params },
      { returnDocument: "after" },
    );
    if (!updated) throw new Error("Page not found");
    revalidatePath("/dashboard/pages");
    if (params.slug) {
      revalidatePath(`/pages/${params.slug}`);
    }
    return safeJson(updated);
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function deletePage(id: string) {
  await requirePermission("pages", "delete");
  try {
    await connectToDatabase();
    const page = await Page.findById(id).lean<IPage>();
    if (!page) throw new Error("Page not found");
    const deleted = await Page.findByIdAndDelete(id);
    if (!deleted) throw new Error("Page not found");
    revalidatePath("/dashboard/pages");
    revalidatePath(`/pages/${page.slug}`);
    return { success: true };
  } catch (error) {
    handleError(error);
    throw error;
  }
}

export async function seedDefaultPages() {
  try {
    await connectToDatabase();

    const defaultPages = [
      {
        title: "About Us",
        slug: "about-us",
        content:
          "<p>Welcome to Daily Muktimarg! We are your trusted source for news and information.</p>",
        status: "published" as const,
      },
      {
        title: "Contact",
        slug: "contact",
        content:
          "<p>Get in touch with us! You can reach us via email or phone.</p>",
        status: "published" as const,
      },
      {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content:
          "<p>Your privacy is important to us. This policy outlines how we collect and use your information.</p>",
        status: "published" as const,
      },
    ];

    for (const pageData of defaultPages) {
      const existing = await Page.findOne({ slug: pageData.slug });
      if (!existing) {
        await Page.create(pageData);
      }
    }

    console.log("Default pages seeded!");
  } catch (error) {
    console.error("Error seeding default pages:", error);
  }
}

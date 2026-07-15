"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
} from "lucide-react";
import Link from "next/link";
import { INews } from "@/lib/database/models/news.model";
import { ICategory } from "@/lib/database/models/category.model";
import { deleteNewsArticle, getNewsArticles } from "@/lib/actions/news.actions";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/shared/Loader";
import { DashboardAccess, hasPermission } from "@/lib/auth/rbac-rules";

export default function NewsClient({
  initialResult,
  categories,
  initialSearch,
  initialCategory,
  initialStatus,
  access,
}: {
  initialResult: {
    articles: INews[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  categories: ICategory[];
  initialSearch: string;
  initialCategory: string;
  initialStatus: string;
  access: DashboardAccess;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [result, setResult] = useState(initialResult);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory || "all");
  const [status, setStatus] = useState(initialStatus || "all");
  const [isLoading, setIsLoading] = useState(false);
  const canCreate = hasPermission(access, "news", "create");
  const canUpdate = hasPermission(access, "news", "update");
  const canDelete = hasPermission(access, "news", "delete");
  const canMutate = canUpdate || canDelete;

  const reloadArticles = async (
    page = result.currentPage,
    query = search,
    cat = category,
    stat = status,
  ) => {
    setIsLoading(true);
    try {
      const response = await getNewsArticles({
        page,
        limit: 15,
        search: query,
        categoryId: cat === "all" ? "" : cat,
        status: stat,
      });
      setResult(response);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    let activeSearch = search;
    let activeCategory = category;
    let activeStatus = status;

    if (key === "search") {
      activeSearch = value;
      if (value) params.set("search", value);
      else params.delete("search");
    } else if (key === "category") {
      activeCategory = value;
      if (value !== "all") params.set("categoryId", value);
      else params.delete("categoryId");
      setCategory(value);
    } else if (key === "status") {
      activeStatus = value;
      if (value !== "all") params.set("status", value);
      else params.delete("status");
      setStatus(value);
    }

    router.replace(`${pathname}?${params.toString()}`);
    reloadArticles(1, activeSearch, activeCategory, activeStatus);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
    reloadArticles(newPage, search, category, status);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this news article?")) return;
    try {
      await deleteNewsArticle(id);
      toast.success("Article deleted successfully.");
      reloadArticles();
    } catch (error) {
      toast.error("Failed to delete article.");
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "published":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "draft":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "review":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "archived":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">News Articles</h2>
        </div>
        {canCreate && (
          <Button asChild className="gap-2 w-full md:w-auto">
            <Link href="/dashboard/news/create">
              <Plus className="w-4 h-4" />
              Create Article
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search articles by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange("search", e.target.value);
            }}
            className="pl-9"
          />
        </div>

        <Select value={category} onValueChange={(val) => handleFilterChange("category", val)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat._id.toString()} value={cat._id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(val) => handleFilterChange("status", val)}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">Under Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loader label="Loading articles list..." />
      ) : result.articles.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
          No news articles found matching your criteria.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-gray-50/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Cover</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Publish Date</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Lead Placement</TableHead>
                <TableHead>Status</TableHead>
                {canMutate && (
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.articles.map((article) => (
                <TableRow key={article._id.toString()} className="bg-white">
                  <TableCell>
                    <div className="relative w-12 h-8 rounded overflow-hidden border">
                      <Image
                        src={article.featuredImage}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-800 max-w-xs truncate">
                    {article.title}
                  </TableCell>
                  <TableCell>
                    {(article.categoryId as any)?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(article.publishDate || "").toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Eye className="w-3.5 h-3.5" />
                      {article.views}
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.lead ? (
                      <Badge className="bg-amber-100 text-amber-800 border hover:bg-amber-100 flex items-center gap-1 w-fit">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Lead {article.leadPosition}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(article.status)}>
                      {article.status}
                    </Badge>
                  </TableCell>
                  {canMutate && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                            <Link href={`/dashboard/news/${article._id}/edit`}>
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Link>
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleDelete(article._id.toString())}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t bg-white text-sm text-gray-500">
              <span>
                Page {result.currentPage} of {result.totalPages} ({result.totalCount} posts)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.currentPage === 1}
                  onClick={() => handlePageChange(result.currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.currentPage === result.totalPages}
                  onClick={() => handlePageChange(result.currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLogs } from "@/lib/actions/rbac.actions";
import { toast } from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/shared/Loader";

export default function AuditLogsClient({
  initialResult,
}: {
  initialResult: {
    logs: any[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [result, setResult] = useState(initialResult);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [isLoading, setIsLoading] = useState(false);

  const reloadLogs = async (page = result.currentPage, query = search) => {
    setIsLoading(true);
    try {
      const response = await getAuditLogs({ page, limit: 20, search: query });
      setResult(response);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value) params.set("search", value);
    else params.delete("search");
    router.replace(`${pathname}?${params.toString()}`);
    reloadLogs(1, value);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.replace(`${pathname}?${params.toString()}`);
    reloadLogs(newPage);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <History className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-800">Audit Logs</h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <Loader label="Loading audit logs..." />
      ) : result.logs.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-xl text-gray-500">
          No audit logs found.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-gray-50/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.logs.map((log) => (
                <TableRow key={log._id.toString()} className="bg-white">
                  <TableCell className="font-semibold text-gray-800">
                    {log.userId?.name || "Unknown"}
                  </TableCell>
                  <TableCell className="capitalize">{log.action}</TableCell>
                  <TableCell className="capitalize">{log.module}</TableCell>
                  <TableCell className="text-gray-600">
                    {log.details}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {result.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t bg-white text-sm text-gray-500">
              <span>
                Page {result.currentPage} of {result.totalPages} (
                {result.totalCount} logs)
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

"use client";

import { useState } from "react";
import { useAdminTags } from "@/hooks/admin/useAdminTags";
import { Tag, SortState } from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, ArrowUp, ArrowDown, Edit, Tag as TagIcon, Search, RefreshCw } from "lucide-react";
import { TagFormModal } from "@/components/admin/TagFormModal";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({
    column: "displayName",
    direction: "ASC",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | undefined>(undefined);

  const { data: response, isLoading } = useAdminTags({
    page,
    sortBy: `${sort.column}:${sort.direction}`,
    search: debouncedSearchTerm,
  });

  const tags = response?.data || [];
  const meta = response?.meta;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminTags'] });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: meta?.totalItems || 0,
      visible: tags.filter((t: Tag) => t.isVisible !== false).length,
      hidden: tags.filter((t: Tag) => t.isVisible === false).length,
    };
  }, [tags, meta]);

  const openNewModal = () => {
    setSelectedTag(undefined);
    setIsFormModalOpen(true);
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    setIsFormModalOpen(true);
  };

  const handleSort = (columnName: string) => {
    setSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return null;
    return sort.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tag Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage tags for events and locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openNewModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Tag
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <TagIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All tags on platform
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visible</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <IconTag className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.visible}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active tags
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-gray-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden</CardTitle>
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
              <IconTag className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.hidden}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hidden tags
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tags ({meta?.totalItems || 0})</CardTitle>
              <CardDescription className="mt-1">
                Showing page {meta?.currentPage || 1} of {meta?.totalPages || 1}
              </CardDescription>
            </div>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by display name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !response ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("displayName")}
                    >
                      Display Name <SortIcon column="displayName" />
                    </Button>
                  </TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created At <SortIcon column="createdAt" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag: Tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge
                        style={{ backgroundColor: tag.color, color: "#fff" }}
                      >
                        {tag.icon} {tag.displayName}
                      </Badge>
                    </TableCell>
                    <TableCell>{tag.displayName}</TableCell>
                    <TableCell>{tag.color}</TableCell>
                    <TableCell>
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={!meta || meta.currentPage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={!meta || meta.currentPage >= meta.totalPages}
        >
          Next
        </Button>
      </div>

      <TagFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={selectedTag}
      />
    </div>
  );
}

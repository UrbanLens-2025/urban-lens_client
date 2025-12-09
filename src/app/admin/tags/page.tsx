"use client";

import { useState, useMemo } from "react";
import { useAdminTags } from "@/hooks/admin/useAdminTags";
import { useTagStats } from "@/hooks/admin/useTagStats";
import { useTagGroups } from "@/hooks/admin/useTagGroups";
import { Tag } from "@/types";
import { SortableTableHeader, SortDirection } from "@/components/shared/SortableTableHeader";
import { TableFilters } from "@/components/shared/TableFilters";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
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
import {
  Loader2,
  PlusCircle,
  Edit,
  Tag as TagIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TagFormModal } from "@/components/admin/TagFormModal";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime, formatGroupName } from "@/lib/utils";

export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ column: string; direction: SortDirection }>({
    column: "displayName",
    direction: "ASC",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | undefined>(undefined);

  // Fetch unique tag groups for category filter
  const { groups: tagGroups, isLoading: isLoadingGroups } = useTagGroups();

  const sortBy = sort.direction ? `${sort.column}:${sort.direction}` : "displayName:ASC";
  const isVisibleFilter =
    visibilityFilter === "all" ? undefined : visibilityFilter === "visible";
  const groupNameFilter = categoryFilter === "all" ? undefined : categoryFilter;

  const { data: response, isLoading } = useAdminTags({
    page,
    sortBy,
    search: debouncedSearchTerm,
    isVisible: isVisibleFilter,
    groupName: groupNameFilter,
  });

  const tags = response?.data || [];
  const meta = response?.meta;

  // Fetch accurate statistics from API
  const tagStats = useTagStats();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["adminTags"] });
    queryClient.invalidateQueries({ queryKey: ["tagStats"] });
  };

  const openNewModal = () => {
    setSelectedTag(undefined);
    setIsFormModalOpen(true);
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    setIsFormModalOpen(true);
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction: direction || "ASC" });
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setVisibilityFilter("all");
    setCategoryFilter("all");
    setSort({ column: "displayName", direction: "ASC" });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (visibilityFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [visibilityFilter, categoryFilter, debouncedSearchTerm]);

  return (
    <PageContainer>
      <PageHeader
        title="Tag Management"
        description="Create and manage tags for events and locations"
        icon={TagIcon}
        actions={
          <Button onClick={openNewModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Tag
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Tags"
          value={tagStats.isLoading ? "—" : tagStats.total.toLocaleString()}
          description={tagStats.isLoading ? "Loading..." : `${tags.length} on this page`}
          icon={TagIcon}
          color="blue"
          isLoading={tagStats.isLoading}
        />

        <StatCard
          title="Visible Tags"
          value={tagStats.isLoading ? "—" : tagStats.visible.toLocaleString()}
          description={
            tagStats.isLoading
              ? "Loading..."
              : `${tagStats.total > 0 ? Math.round((tagStats.visible / tagStats.total) * 100) : 0}% of total`
          }
          icon={Eye}
          color="green"
          isLoading={tagStats.isLoading}
        />

        <StatCard
          title="Hidden Tags"
          value={tagStats.isLoading ? "—" : tagStats.hidden.toLocaleString()}
          description={
            tagStats.isLoading
              ? "Loading..."
              : `${tagStats.total > 0 ? Math.round((tagStats.hidden / tagStats.total) * 100) : 0}% of total`
          }
          icon={EyeOff}
          color="orange"
          isLoading={tagStats.isLoading}
        />
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Tags</CardTitle>
              <CardDescription className="mt-1">
                Showing {tags.length} of {meta?.totalItems || 0} tags
                {(visibilityFilter !== "all" || categoryFilter !== "all") && (
                  <span>
                    {" "}
                    ({[
                      visibilityFilter !== "all" && visibilityFilter,
                      categoryFilter !== "all" && formatGroupName(categoryFilter),
                    ]
                      .filter(Boolean)
                      .join(", ")})
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters */}
          <TableFilters
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            searchPlaceholder="Search tags by display name..."
            filters={[
              {
                key: "visibility",
                label: "Visibility",
                value: visibilityFilter,
                options: [
                  { value: "all", label: "All Tags" },
                  { value: "visible", label: "Visible Only" },
                  { value: "hidden", label: "Hidden Only" },
                ],
                onValueChange: (value) => {
                  setVisibilityFilter(value);
                  setPage(1);
                },
              },
              {
                key: "category",
                label: "Category",
                value: categoryFilter,
                options: isLoadingGroups
                  ? [{ value: "all", label: "Loading categories..." }]
                  : tagGroups.length > 0
                  ? [
                      { value: "all", label: "All Categories" },
                      ...tagGroups.map((group) => ({
                        value: group,
                        label: formatGroupName(group),
                      })),
                    ]
                  : [{ value: "all", label: "All Categories" }],
                onValueChange: (value) => {
                  setCategoryFilter(value);
                  setPage(1);
                },
              },
            ]}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
          />

          {/* Table */}
          {isLoading && !response ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TagIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || visibilityFilter !== "all" || categoryFilter !== "all"
                  ? "No tags found"
                  : "No tags yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchTerm || visibilityFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your search terms or filters"
                  : "Create your first tag to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Preview</TableHead>
                      <SortableTableHeader
                        column="displayName"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Display Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="groupName"
                        currentSort={sort}
                        onSort={handleSort}
                        className="hidden md:table-cell"
                      >
                        Group
                      </SortableTableHeader>
                      <TableHead className="hidden lg:table-cell">Color</TableHead>
                      <TableHead>Status</TableHead>
                      <SortableTableHeader
                        column="createdAt"
                        currentSort={sort}
                        onSort={handleSort}
                        className="hidden sm:table-cell"
                      >
                        Created
                      </SortableTableHeader>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag: Tag) => (
                      <TableRow key={tag.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: tag.color,
                              color: "#fff",
                            }}
                            className="flex items-center gap-1.5 w-fit"
                          >
                            <span>{tag.icon}</span>
                            <span className="font-medium">{tag.displayName}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tag.displayName}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatGroupName(tag.groupName)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border-2 border-border"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm font-mono">{tag.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(tag as any).isVisible !== false ? (
                            <Badge
                              variant="outline"
                              className="flex items-center w-fit bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Visible
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="flex items-center w-fit bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {formatDateTime(tag.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(tag)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t px-6 pb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(meta.currentPage - 1) * (meta.itemsPerPage || 20) + 1} to{" "}
                    {Math.min(meta.currentPage * (meta.itemsPerPage || 20), meta.totalItems)} of{" "}
                    {meta.totalItems} tags
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={meta.currentPage <= 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={meta.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      {[...Array(Math.min(5, meta.totalPages))].map((_, i) => {
                        const pageNum =
                          meta.totalPages <= 5
                            ? i + 1
                            : meta.currentPage <= 3
                            ? i + 1
                            : meta.currentPage >= meta.totalPages - 2
                            ? meta.totalPages - 4 + i
                            : meta.currentPage - 2 + i;
                        if (pageNum > meta.totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === meta.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={meta.currentPage >= meta.totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(meta.totalPages)}
                      disabled={meta.currentPage >= meta.totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TagFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        initialData={selectedTag}
      />
    </PageContainer>
  );
}

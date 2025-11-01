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
import { Loader2, PlusCircle, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { TagFormModal } from "@/components/admin/TagFormModal";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";

export default function AdminTagsPage() {
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tag Management</h1>
          <p className="text-muted-foreground">
            Create and view all tags on the platform.
          </p>
        </div>
        <Button onClick={openNewModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags ({meta?.totalItems || 0})</CardTitle>
          <CardDescription>
            Showing page {meta?.currentPage} of {meta?.totalPages}.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search by display name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
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

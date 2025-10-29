/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Search, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useTags } from "@/hooks/tags/useTags";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Tag } from "@/types";
import { createTags, updateTag } from "@/api/locations";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function TagsManagementPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({
    groupName: "",
    displayName: "",
    color: "#3b82f6",
    icon: "📍",
    isSelectable: true,
  });
  const [editForm, setEditForm] = useState({
    groupName: "",
    displayName: "",
    color: "#3b82f6",
    icon: "📍",
    isSelectable: true,
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Search state
  const [search, setSearch] = useState("");
  
  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sort state
  const [sort, setSort] = useState<{
    field: "displayName" | "createdAt" | "updatedAt";
    direction: "asc" | "desc";
  }>({ field: "displayName", direction: "asc" });

  // Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when searching
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Prepare sortBy string for API
  const sortBy = useMemo(() => {
    return `${sort.field}:${sort.direction.toUpperCase()}`;
  }, [sort]);

  const { data: tagsData, isLoading, error } = useTags({
    page,
    limit: itemsPerPage,
    search: debouncedSearch || undefined,
    sortBy,
  });

  const tags = tagsData?.data || [];
  const totalPages = tagsData?.meta?.totalPages || 1;
  const currentPage = tagsData?.meta?.currentPage || page;
  const totalItems = tagsData?.meta?.totalItems || 0;
  const sortByApi = tagsData?.meta?.sortBy?.[0] || null;

  // Parse sortBy from API response
  const parsedSort = useMemo(() => {
    if (!sortByApi) return null;
    const [field, direction] = sortByApi;
    return { field: field.toLowerCase(), direction: direction.toLowerCase() };
  }, [sortByApi]);

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: createTags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTags'] });
      toast.success("Tag created successfully");
      setIsAddDialogOpen(false);
      setNewTag({
        groupName: "",
        displayName: "",
        color: "#3b82f6",
        icon: "📍",
        isSelectable: true,
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create tag");
    },
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, payload }: { tagId: number; payload: any }) => 
      updateTag(tagId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTags'] });
      toast.success("Tag updated successfully");
      setIsEditDialogOpen(false);
      setEditingTag(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update tag");
    },
  });

  // Sort icon component
  const SortIcon = ({ field }: { field: "displayName" | "createdAt" | "updatedAt" }) => {
    if (!parsedSort || parsedSort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return parsedSort.direction === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const toggleSort = (field: "displayName" | "createdAt" | "updatedAt") => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const handleAddTag = () => {
    if (!newTag.groupName.trim() || !newTag.displayName.trim()) {
      toast.error("Group name and display name are required");
      return;
    }
    
    createTagMutation.mutate({
      list: [
        {
          groupName: newTag.groupName,
          displayName: newTag.displayName,
          color: newTag.color,
          icon: newTag.icon,
          isSelectable: newTag.isSelectable,
        },
      ],
    });
  };

  const handleOpenEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setEditForm({
      groupName: tag.groupName || "", // groupName is optional in update
      displayName: tag.displayName,
      color: tag.color,
      icon: tag.icon,
      isSelectable: tag.isSelectable,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;
    
    if (!editForm.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    const payload: any = {
      displayName: editForm.displayName,
      color: editForm.color,
      icon: editForm.icon,
      isSelectable: editForm.isSelectable,
    };

    // Only include groupName if it's not empty
    if (editForm.groupName.trim()) {
      payload.groupName = editForm.groupName;
    }

    updateTagMutation.mutate({
      tagId: editingTag.id,
      payload,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">Failed to load tags</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by display name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Tag
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">No tags found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort("displayName")}
                          className="flex items-center gap-1"
                        >
                          Display Name
                          <SortIcon field="displayName" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort("createdAt")}
                          className="flex items-center gap-1"
                        >
                          Created At
                          <SortIcon field="createdAt" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort("updatedAt")}
                          className="flex items-center gap-1"
                        >
                          Updated At
                          <SortIcon field="updatedAt" />
                        </Button>
                      </TableHead>
                      <TableHead>Is Selectable</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.id}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{tag.displayName}</div>
                            {tag.groupName && (
                              <div className="text-xs text-muted-foreground">
                                {tag.groupName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tag.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tag.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tag.isSelectable ? "default" : "secondary"}>
                            {tag.isSelectable ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {tag.color}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-2xl">{tag.icon}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {tags.length} of {totalItems} tags
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag for location categorization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="e.g., Category, Type, etc."
                value={newTag.groupName}
                onChange={(e) =>
                  setNewTag({ ...newTag, groupName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., Restaurant, Park, etc."
                value={newTag.displayName}
                onChange={(e) =>
                  setNewTag({ ...newTag, displayName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={newTag.color}
                  onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                placeholder="📍"
                value={newTag.icon}
                onChange={(e) => setNewTag({ ...newTag, icon: e.target.value })}
                maxLength={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isSelectable"
                checked={newTag.isSelectable}
                onCheckedChange={(checked) =>
                  setNewTag({ ...newTag, isSelectable: checked })
                }
              />
              <Label htmlFor="isSelectable">Is Selectable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTag}
              disabled={createTagMutation.isPending}
            >
              {createTagMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update tag information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-groupName">Group Name (Optional)</Label>
              <Input
                id="edit-groupName"
                placeholder="e.g., Category, Type, etc."
                value={editForm.groupName}
                onChange={(e) =>
                  setEditForm({ ...editForm, groupName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                placeholder="e.g., Restaurant, Park, etc."
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon (Emoji)</Label>
              <Input
                id="edit-icon"
                placeholder="📍"
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                maxLength={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isSelectable"
                checked={editForm.isSelectable}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isSelectable: checked })
                }
              />
              <Label htmlFor="edit-isSelectable">Is Selectable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTag}
              disabled={updateTagMutation.isPending}
            >
              {updateTagMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

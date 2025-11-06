"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { useLocationById } from "@/hooks/locations/useLocationById";
import { useUpdateLocation } from "@/hooks/locations/useUpdateLocation";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUpload } from "@/components/shared/FileUpload";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLocationByIdForAdmin } from "@/hooks/admin/useLocationByIdForAdmin";
import { useUpdateLocationAsAdmin } from "@/hooks/admin/useUpdateLocationAsAdmin";
import { useAllTags } from "@/hooks/tags/useAllTags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, X, Loader2 as Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types";

const updateLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.array(z.string().url()).min(1, "At least one image is required"),
  isVisibleOnMap: z.boolean().optional(),
  tagIds: z.array(z.number()).min(1, "At least one tag is required"),
});
type FormValues = z.infer<typeof updateLocationSchema>;

export default function EditLocationPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: location, isLoading: isLoadingData } =
    useLocationByIdForAdmin(locationId);
  const { mutate: updateLocation, isPending: isUpdating } =
    useUpdateLocationAsAdmin();
  const { data: allTags, isLoading: isLoadingTags } = useAllTags();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(updateLocationSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      imageUrl: [],
      isVisibleOnMap: false,
      tagIds: [],
    },
  });

  const selectedTagIds = form.watch("tagIds") || [];
  
  // Filter to only show LOCATION_TYPE tags for locations
  const tagsFromDb: Tag[] = (allTags || []).filter((tag) => tag.groupName === "LOCATION_TYPE");
  const groupedTags = tagsFromDb.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
    const group = tag.groupName || "Others";
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  // Check if at least one LOCATION_TYPE tag is selected
  const locationTypeTagIds = (allTags || [])
    .filter((tag) => tag.groupName === "LOCATION_TYPE")
    .map((tag) => tag.id);
  const hasLocationType = selectedTagIds.some((id) => locationTypeTagIds.includes(id));

  const toggleTag = (tagId: number, groupName: string | null) => {
    const group = groupName || "Others";
    // LOCATION_TYPE: single selection (required)
    if (group === "LOCATION_TYPE") {
      if (selectedTagIds.includes(tagId)) {
        form.setValue("tagIds", selectedTagIds.filter((id) => id !== tagId), { shouldValidate: true });
      } else {
        const locationTypeTags = groupedTags["LOCATION_TYPE"]?.map((t) => t.id) || [];
        const newSelection = selectedTagIds.filter((id) => !locationTypeTags.includes(id));
        form.setValue("tagIds", [...newSelection, tagId], { shouldValidate: true });
      }
    } else {
      // Other groups: multiple selection (shouldn't happen since we filter to LOCATION_TYPE only)
      const newSelection = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];
      form.setValue("tagIds", newSelection, { shouldValidate: true });
    }
  };

  const getGroupLabel = (group: string) => {
    if (group === "Others") return "Others";
    return group
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ") + (group === "LOCATION_TYPE" ? " (Select One)" : "");
  };

  const INITIAL_DISPLAY_COUNT = 5;
  const getFilteredTags = (tags: Tag[], groupName: string) => {
    const term = (searchTerms[groupName] || "").toLowerCase();
    return tags.filter((t) => t.displayName.toLowerCase().includes(term));
  };
  const getDisplayedTags = (tags: Tag[], groupName: string) => {
    const filtered = getFilteredTags(tags, groupName);
    const isExpanded = expandedGroups[groupName];
    return isExpanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT);
  };

  // 3. Điền (pre-fill) form khi dữ liệu được tải
  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        description: location.description,
        imageUrl: location.imageUrl || [],
        isVisibleOnMap: location.isVisibleOnMap ?? false,
        tagIds: (location.tags || []).map((t) => t.id),
      });
    }
  }, [location, form]);

  const onSubmit = async (values: FormValues) => {
    // Validate LOCATION_TYPE requirement
    if (!hasLocationType) {
      form.setError("tagIds", {
        type: "manual",
        message: "At least one location type is required. Please select a location type.",
      });
      await form.trigger("tagIds", { shouldFocus: true });
      return;
    }
    
    try {
      const { name, description, imageUrl, isVisibleOnMap, tagIds } = values;

      const mainPayload = {
        name,
        description,
        imageUrl,
        isVisibleOnMap: isVisibleOnMap ?? false,
        tagIds,
      };

      updateLocation({ locationId, payload: mainPayload });

      queryClient.invalidateQueries({ queryKey: ["allLocations"] });
      queryClient.invalidateQueries({ queryKey: ["location", locationId] });
      router.refresh();
    } catch (err) {
      toast.error("An error occurred while saving. Please try again.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!location) {
    return <div>Location not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Location: {location.name}</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Update Location Details</CardTitle>
          <CardDescription>
            Make changes to your active location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Images</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="isVisibleOnMap"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Visible on Map</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Should this location be visible to the public on the
                        map?
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="tagIds"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    {isLoadingTags ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTagIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md">
                            {selectedTagIds.map((id: number) => {
                              const tag = tagsFromDb.find((t: Tag) => t.id === id);
                              if (!tag) return null;
                              return (
                                <Badge
                                  key={id}
                                  style={{ backgroundColor: tag.color, color: "#fff" }}
                                  className="pl-2 pr-1 py-1 flex items-center gap-1"
                                >
                                  <span className="text-xs">{tag.icon}</span>
                                  <span className="text-xs">{tag.displayName}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleTag(id, tag.groupName)}
                                    className="ml-1 rounded-full hover:bg-white/20 p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        {Object.entries(groupedTags)
                          .sort(([a], [b]) => {
                            if (a === "Others") return 1;
                            if (b === "Others") return -1;
                            return a.localeCompare(b);
                          })
                          .map(([groupName, tagsInGroup]) => {
                            const filtered = getFilteredTags(tagsInGroup, groupName);
                            const displayed = getDisplayedTags(tagsInGroup, groupName);
                            const hasMore = filtered.length > INITIAL_DISPLAY_COUNT;
                            const isGroupExpanded = expandedGroups[`group_${groupName}`] ?? true;
                            const isExpandedList = expandedGroups[groupName];
                            const isLocationType = groupName === "LOCATION_TYPE";
                            const hasError = isLocationType && !hasLocationType && form.formState.errors.tagIds;
                            return (
                              <div 
                                key={groupName} 
                                className={cn(
                                  "border rounded-lg p-3 space-y-2 bg-muted/30",
                                  hasError && "bg-destructive/5 border-destructive border-2 shadow-md"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedGroups((prev) => ({
                                        ...prev,
                                        [`group_${groupName}`]: !prev[`group_${groupName}`],
                                      }))
                                    }
                                    className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                                  >
                                    {isGroupExpanded ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <h3 className="text-sm font-semibold">
                                      {getGroupLabel(groupName)}
                                      <span className="text-xs text-muted-foreground font-normal ml-2">({filtered.length})</span>
                                    </h3>
                                  </button>
                                  {isGroupExpanded && (
                                    <div className="relative w-40">
                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                      <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerms[groupName] || ""}
                                        onChange={(e) => setSearchTerms((prev) => ({ ...prev, [groupName]: e.target.value }))}
                                        className="pl-7 h-8 text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  )}
                                </div>

                                {isGroupExpanded && (
                                  <>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {displayed.map((tag: Tag) => {
                                        const isSelected = selectedTagIds.includes(tag.id);
                                        return (
                                          <Badge
                                            key={tag.id}
                                            variant={isSelected ? "default" : "outline"}
                                            style={
                                              isSelected
                                                ? { backgroundColor: tag.color, color: "#fff", borderColor: tag.color }
                                                : { borderColor: tag.color, color: tag.color }
                                            }
                                            className={cn(
                                              "cursor-pointer transition-all hover:shadow-sm px-2 py-0.5 text-xs",
                                              isSelected && "ring-1 ring-offset-1 ring-primary",
                                              !isSelected && "hover:bg-muted"
                                            )}
                                            onClick={() => toggleTag(tag.id, tag.groupName)}
                                          >
                                            <span className="mr-1">{tag.icon}</span>
                                            {tag.displayName}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                    {hasMore && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setExpandedGroups((prev) => ({ ...prev, [groupName]: !isExpandedList }))}
                                        className="w-full h-7 text-xs"
                                      >
                                        {isExpandedList ? (
                                          <>
                                            <ChevronUp className="mr-1 h-3 w-3" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="mr-1 h-3 w-3" />
                                            View More ({filtered.length - INITIAL_DISPLAY_COUNT} more)
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    {filtered.length === 0 && searchTerms[groupName] && (
                                      <p className="text-xs text-muted-foreground text-center py-2">
                                        No tags found for "{searchTerms[groupName]}"
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

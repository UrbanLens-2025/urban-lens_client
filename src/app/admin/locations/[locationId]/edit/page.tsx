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
import { Loader2, ArrowLeft, AlertCircle, MapPin, FileText, ImageIcon, Eye, Tag as TagIcon, Save } from "lucide-react";
import Link from "next/link";
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

  // Prevent editing business-owned locations
  if (location.business) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Editing Not Allowed
            </CardTitle>
            <CardDescription>
              This location is owned by a business account and cannot be edited by administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Business Owner:</p>
              <p className="text-sm">{location.business.name}</p>
              {location.business.accountId && (
                <Link href={`/admin/business/${location.business.accountId}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Business Account
                  </Button>
                </Link>
              )}
            </div>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Update Location Details
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Make changes to your active location
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6 lg:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>

                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base font-semibold">
                        <MapPin className="h-4 w-4 text-primary" />
                        Location Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20" />
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-4 w-4 text-primary" />
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[120px] border-2 border-primary/20 focus:ring-2 focus:ring-primary/20 resize-none" 
                          placeholder="Describe the location, its features, and what makes it special..."
                        />
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Images Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Location Images</h2>
                </div>

                <FormField
                  name="imageUrl"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base font-semibold">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Upload Images
                      </FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 bg-muted/30 hover:border-primary/40 transition-colors">
                          <FileUpload
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Settings Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Visibility Settings</h2>
                </div>

                <FormField
                  name="isVisibleOnMap"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-primary/10 p-6 bg-gradient-to-r from-muted/50 to-transparent hover:border-primary/20 transition-all">
                      <div className="space-y-1 flex-1">
                        <FormLabel className="flex items-center gap-2 text-base font-semibold">
                          <Eye className="h-4 w-4 text-primary" />
                          Visible on Map
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Should this location be visible to the public on the map?
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-primary/10">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TagIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold">Location Tags</h2>
                </div>

                <FormField
                  name="tagIds"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-base font-semibold">
                        <TagIcon className="h-4 w-4 text-primary" />
                        Select Location Type
                      </FormLabel>
                    {isLoadingTags ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTagIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border-2 border-primary/10">
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
                                  "border-2 rounded-xl p-4 space-y-3 bg-gradient-to-br from-card to-muted/20 shadow-sm transition-all",
                                  hasError && "bg-destructive/5 border-destructive border-2 shadow-md ring-2 ring-destructive/20"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedGroups((prev) => ({
                                        ...prev,
                                        [`group_${groupName}`]: !prev[`group_${groupName}`],
                                      }))
                                    }
                                    className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors group"
                                  >
                                    <div className={cn(
                                      "p-1.5 rounded-md transition-colors",
                                      isGroupExpanded ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/5"
                                    )}>
                                      {isGroupExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </div>
                                    <h3 className="text-sm font-semibold">
                                      {getGroupLabel(groupName)}
                                      <span className="text-xs text-muted-foreground font-normal ml-2">({filtered.length})</span>
                                    </h3>
                                  </button>
                                  {isGroupExpanded && (
                                    <div className="relative w-48">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        type="text"
                                        placeholder="Search tags..."
                                        value={searchTerms[groupName] || ""}
                                        onChange={(e) => setSearchTerms((prev) => ({ ...prev, [groupName]: e.target.value }))}
                                        className="pl-9 h-10 text-sm border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  )}
                                </div>

                                {isGroupExpanded && (
                                  <>
                                    <div className="flex flex-wrap gap-2 pt-2">
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
                                              "cursor-pointer transition-all px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md",
                                              isSelected && "ring-2 ring-offset-2 ring-primary/30 scale-105",
                                              !isSelected && "hover:bg-muted/50 hover:scale-105"
                                            )}
                                            onClick={() => toggleTag(tag.id, tag.groupName)}
                                          >
                                            <span className="mr-1.5">{tag.icon}</span>
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
                                        className="w-full h-9 text-sm border border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                                      >
                                        {isExpandedList ? (
                                          <>
                                            <ChevronUp className="mr-2 h-4 w-4" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                            View More ({filtered.length - INITIAL_DISPLAY_COUNT} more)
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    {filtered.length === 0 && searchTerms[groupName] && (
                                      <div className="text-center py-6">
                                        <p className="text-sm text-muted-foreground">
                                          No tags found for "<span className="font-medium">{searchTerms[groupName]}</span>"
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-primary/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isUpdating}
                  className="h-12 border-2 border-primary/20 hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

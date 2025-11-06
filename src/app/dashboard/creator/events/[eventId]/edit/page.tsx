"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventById } from "@/hooks/events/useEventById";
import { useAddEventTags, useRemoveEventTags } from "@/hooks/events/useEventTags";
import { updateEvent } from "@/api/events";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAllTags } from "@/hooks/tags/useAllTags";
import { Tag } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
import {
  Loader2,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Globe,
  Star,
  ImageIcon,
  Tag as TagIcon,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { UpdateEventPayload } from "@/types";
import { cn } from "@/lib/utils";

const updateEventSchema = z.object({
  displayName: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .max(255, "Event name must not exceed 255 characters"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(1024, "Description must not exceed 1024 characters"),
  avatarUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  coverUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  refundPolicy: z
    .string()
    .nullable()
    .or(z.literal("").transform(() => null)),
  termsAndConditions: z
    .string()
    .nullable()
    .or(z.literal("").transform(() => null)),
  social: z
    .array(
      z.object({
        platform: z.string().min(1, "Platform is required"),
        url: z.string().url("Invalid URL"),
        isMain: z.boolean(),
      })
    )
    .default([]),
});

type UpdateEventForm = z.infer<typeof updateEventSchema>;

const popularPlatforms = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Website",
  "Other",
];

const INITIAL_DISPLAY_COUNT = 5;

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const addEventTags = useAddEventTags();
  const removeEventTags = useRemoveEventTags();

  const { data: event, isLoading, isError } = useEventById(eventId);
  const { data: allTags, isLoading: isLoadingTags } = useAllTags();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  // Track pending tag changes (will be applied on form submit)
  const [pendingTagIds, setPendingTagIds] = useState<number[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tags = allTags || [];
  // Tags are now direct Tag objects, so use tag.id instead of tag.tagId
  const currentTagIds = event?.tags?.map((tag) => tag.id) || [];
  // Use pending tags if available, otherwise use current tags from event
  const displayedTagIds = pendingTagIds !== null ? pendingTagIds : currentTagIds;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<UpdateEventForm>({
    resolver: zodResolver(updateEventSchema) as any,
    mode: "onChange",
    defaultValues: {
      displayName: "",
      description: "",
      avatarUrl: null,
      coverUrl: null,
      refundPolicy: null,
      termsAndConditions: null,
      social: [],
    },
  });

  // Update form when event data loads
  useEffect(() => {
    if (event) {
      form.reset({
        displayName: event.displayName || "",
        description: event.description || "",
        avatarUrl: event.avatarUrl || null,
        coverUrl: event.coverUrl || null,
        refundPolicy: event.refundPolicy || null,
        termsAndConditions: event.termsAndConditions || null,
        social: event.social || [],
      });
      // Reset pending tags when event loads
      setPendingTagIds(null);
    }
  }, [event, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  const socialLinks = form.watch("social") || [];

  const handleAddSocialLink = () => {
    append({
      platform: "",
      url: "",
      isMain: socialLinks.length === 0,
    });
  };

  const handleToggleMain = (index: number) => {
    const currentLinks = form.getValues("social") || [];
    const newLinks = currentLinks.map((link, i) => ({
      ...link,
      isMain: i === index,
    }));
    form.setValue("social", newLinks);
  };

  const onSubmit = async (data: UpdateEventForm) => {
    setIsSubmitting(true);
    try {
      // Step 1: Update event details
      const payload: UpdateEventPayload = {
        displayName: data.displayName,
        description: data.description,
        avatarUrl: data.avatarUrl || null,
        coverUrl: data.coverUrl || null,
        refundPolicy: data.refundPolicy || null,
        termsAndConditions: data.termsAndConditions || null,
        social: data.social || [],
      };

      // Call API directly to avoid hook's auto-navigation
      const updatedEvent = await updateEvent(eventId, payload);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['eventDetail'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      queryClient.setQueryData(['eventDetail', updatedEvent.id], updatedEvent);

      // Step 2: Apply tag changes if there are pending changes
      if (pendingTagIds !== null) {
        const tagsToAdd = pendingTagIds.filter(id => !currentTagIds.includes(id));
        const tagsToRemove = currentTagIds.filter(id => !pendingTagIds.includes(id));

        // Remove tags first
        if (tagsToRemove.length > 0) {
          await removeEventTags.mutateAsync({
            eventId,
            payload: { tagIds: tagsToRemove },
          });
        }

        // Then add new tags
        if (tagsToAdd.length > 0) {
          await addEventTags.mutateAsync({
            eventId,
            payload: { tagIds: tagsToAdd },
          });
        }
      }

      // Step 3: Show success message and navigate after all updates are complete
      toast.success("Event updated successfully!");
      router.push(`/dashboard/creator/events/${eventId}`);
      router.refresh();
    } catch (error: any) {
      // Error handling
      toast.error(error?.message || "Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading event details</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your event details
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter event name"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event..."
                        rows={5}
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormMessage />
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/1024 characters
                      </span>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Tags Management */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TagIcon className="h-4 w-4" />
                Event Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingTags ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Selected Tags */}
                  {displayedTagIds.length > 0 && (
                    <div className="pb-2 border-b">
                      <FormLabel className="mb-2 text-sm font-medium">Current Tags</FormLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {displayedTagIds.map((tagId) => {
                          const tag = tags.find((t: Tag) => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <Badge
                              key={tagId}
                              style={{
                                backgroundColor: tag.color,
                                color: "#fff",
                              }}
                              className="pl-1.5 pr-1 py-0.5 flex items-center gap-1 text-xs"
                            >
                              <span className="text-xs">{tag.icon}</span>
                              <span className="text-xs">{tag.displayName}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  // Update pending tags instead of calling API
                                  const newTagIds = displayedTagIds.filter(id => id !== tagId);
                                  setPendingTagIds(newTagIds);
                                }}
                                disabled={isSubmitting}
                                className="ml-1 rounded-full hover:bg-white/20 p-0.5 disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tag Selection by Group - Show ALL groups from database */}
                  {(() => {
                    // Group ALL tags by groupName (no filtering)
                    const groupedTags = tags.reduce(
                      (acc: Record<string, Tag[]>, tag: Tag) => {
                        const group = tag.groupName || "Others";
                        if (!acc[group]) {
                          acc[group] = [];
                        }
                        acc[group].push(tag);
                        return acc;
                      },
                      {}
                    );

                    // Format group name from database (e.g., "EVENT_TYPE" -> "Event Type")
                    const getGroupLabel = (group: string) => {
                      if (group === "Others") {
                        return "Others";
                      }
                      // Convert SNAKE_CASE or UPPERCASE to Title Case
                      return group
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(" ");
                    };

                    const getFilteredTags = (tags: Tag[], groupName: string) => {
                      const searchTerm =
                        searchTerms[groupName]?.toLowerCase() || "";
                      return tags.filter((tag: Tag) =>
                        tag.displayName.toLowerCase().includes(searchTerm)
                      );
                    };

                    const getDisplayedTags = (tags: Tag[], groupName: string) => {
                      const filtered = getFilteredTags(tags, groupName);
                      const isExpanded = expandedGroups[groupName];
                      return isExpanded
                        ? filtered
                        : filtered.slice(0, INITIAL_DISPLAY_COUNT);
                    };

                    const handleAddTag = (tagId: number) => {
                      if (!displayedTagIds.includes(tagId)) {
                        // Update pending tags instead of calling API
                        const newTagIds = [...displayedTagIds, tagId];
                        setPendingTagIds(newTagIds);
                      }
                    };

                    return (
                      <div className="space-y-3">
                        {Object.entries(groupedTags)
                          .sort(([a], [b]) => {
                            // Sort "Others" to the end
                            if (a === "Others") return 1;
                            if (b === "Others") return -1;
                            return a.localeCompare(b);
                          })
                          .map(([groupName, tags]) => {
                            const filteredTags = getFilteredTags(tags, groupName);
                            const displayedTags = getDisplayedTags(
                              tags,
                              groupName
                            );
                            const hasMore =
                              filteredTags.length > INITIAL_DISPLAY_COUNT;
                            const isExpanded = expandedGroups[groupName];
                            const isGroupExpanded = expandedGroups[`group_${groupName}`] ?? true;

                            return (
                              <div key={groupName} className="border rounded-lg p-3 space-y-2 bg-muted/30">
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
                                      <span className="text-xs text-muted-foreground font-normal ml-2">
                                        ({filteredTags.length})
                                      </span>
                                    </h3>
                                  </button>
                                  {isGroupExpanded && (
                                    <div className="relative w-40">
                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                      <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerms[groupName] || ""}
                                        onChange={(e) =>
                                          setSearchTerms((prev) => ({
                                            ...prev,
                                            [groupName]: e.target.value,
                                          }))
                                        }
                                        className="pl-7 h-8 text-xs"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  )}
                                </div>

                                {isGroupExpanded && (
                                  <>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {displayedTags.map((tag: Tag) => {
                                        const isSelected = displayedTagIds.includes(
                                          tag.id
                                        );
                                        return (
                                          <Badge
                                            key={tag.id}
                                            variant={isSelected ? "default" : "outline"}
                                            style={
                                              isSelected
                                                ? {
                                                    backgroundColor: tag.color,
                                                    color: "#fff",
                                                    borderColor: tag.color,
                                                  }
                                                : {
                                                    borderColor: tag.color,
                                                    color: tag.color,
                                                  }
                                            }
                                            className={cn(
                                              "cursor-pointer transition-all hover:shadow-sm px-2 py-0.5 text-xs",
                                              isSelected &&
                                                "ring-1 ring-offset-1 ring-primary",
                                              !isSelected && "hover:bg-muted"
                                            )}
                                            onClick={() => handleAddTag(tag.id)}
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
                                        onClick={() =>
                                          setExpandedGroups((prev) => ({
                                            ...prev,
                                            [groupName]: !prev[groupName],
                                          }))
                                        }
                                        className="w-full h-7 text-xs"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="mr-1 h-3 w-3" />
                                            Show Less
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="mr-1 h-3 w-3" />
                                            View More ({filteredTags.length - INITIAL_DISPLAY_COUNT} more)
                                          </>
                                        )}
                                      </Button>
                                    )}

                                    {filteredTags.length === 0 &&
                                      searchTerms[groupName] && (
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
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Event Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Image</FormLabel>
                    <FormDescription>
                      Upload a square image for your event avatar
                    </FormDescription>
                    <FormControl>
                      <SingleFileUpload
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image</FormLabel>
                    <FormDescription>
                      Upload a wide banner image for your event cover
                    </FormDescription>
                    <FormControl>
                      <SingleFileUpload
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <FormDescription>
                  Add links to promote your event
                </FormDescription>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSocialLink}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No social links added yet. Click "Add Link" to add your first
                    link.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-3 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FormLabel className="text-sm font-medium">
                            Link {index + 1}
                          </FormLabel>
                          {socialLinks[index]?.isMain && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Main
                            </Badge>
                          )}
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`social.${index}.platform`}
                          render={({ field: platformField }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Facebook, Instagram"
                                  list={`platforms-${index}`}
                                  {...platformField}
                                />
                              </FormControl>
                              <datalist id={`platforms-${index}`}>
                                {popularPlatforms.map((platform) => (
                                  <option key={platform} value={platform} />
                                ))}
                              </datalist>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`social.${index}.url`}
                          render={({ field: urlField }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input
                                  type="url"
                                  placeholder="https://..."
                                  {...urlField}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`social.${index}.isMain`}
                        render={({ field: mainField }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">
                                Set as Main Link
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Mark this as your primary social media link
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={mainField.value || false}
                                onCheckedChange={(checked) => {
                                  mainField.onChange(checked);
                                  if (checked) {
                                    handleToggleMain(index);
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policies */}
          <Card>
            <CardHeader>
              <CardTitle>Policies & Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="refundPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Refund Policy</FormLabel>
                    <FormDescription>
                      Describe your refund policy for this event
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter refund policy details..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAndConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms and Conditions</FormLabel>
                    <FormDescription>
                      Describe the terms and conditions for this event
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter terms and conditions..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
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
    </div>
  );
}


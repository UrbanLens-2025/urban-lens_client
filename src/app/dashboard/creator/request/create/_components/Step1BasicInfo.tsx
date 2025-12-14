"use client";

import { useMemo, useState } from "react";
import { UseFormReturn, Controller } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SocialLinksInput } from "./SocialLinksInput";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Info,
  Users,
  FileText,
  Globe,
  Image as ImageIcon,
  Tag,
  Tags,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Loader2
} from "lucide-react";
import { CreateEventRequestForm } from "../page";
import { DateTimePicker } from "./DateTimePicker";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
import { useTagCategories } from "@/hooks/tags/useTagCategories";
import { TagCategory } from "@/types";
import { cn } from "@/lib/utils";

interface Step1BasicInfoProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

const INITIAL_DISPLAY_COUNT = 5;

export function Step1BasicInfo({ form }: Step1BasicInfoProps) {
  const { data: tagCategories, isLoading: isLoadingTags } = useTagCategories("EVENT");
  const selectedTagIds = form.watch("tagIds") || [];
  const locationId = form.watch("locationId"); // Check if venue is selected

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter tags based on search term
  const filteredTags = useMemo(() => {
    if (!tagCategories) return [];
    const term = searchTerm.toLowerCase();
    return tagCategories.filter((tag) =>
      tag.name.toLowerCase().includes(term) ||
      tag.description.toLowerCase().includes(term)
    );
  }, [tagCategories, searchTerm]);

  // Get displayed tags (limited if not expanded)
  const displayedTags = useMemo(() => {
    return isExpanded ? filteredTags : filteredTags.slice(0, INITIAL_DISPLAY_COUNT);
  }, [filteredTags, isExpanded]);

  const hasMore = filteredTags.length > INITIAL_DISPLAY_COUNT;

  // Allow multiple tag selections
  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      // Deselect if already selected
      const newSelection = selectedTagIds.filter((id: number) => id !== tagId);
      form.setValue("tagIds", newSelection, { shouldValidate: true });
    } else {
      // Add to current selection (multiple allowed)
      form.setValue("tagIds", [...selectedTagIds, tagId], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4 pb-4 border-b-2 border-primary/20">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md">
          <FileText className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Basic Event Information
          </h2>
          <p className="text-muted-foreground text-base">
            Provide the essential details about your event. All fields marked with * are required.
          </p>
        </div>
      </div>

      {/* Event Name and Expected Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4">
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2 mb-2">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <div className="p-1 rounded-md bg-primary/10">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  Event Name
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose a clear, descriptive name for your event</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  placeholder="Enter event name"
                  {...field}
                  className="h-12 border-2 border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all w-full text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedNumberOfParticipants"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2 mb-2">
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <div className="p-1 rounded-md bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  Expected Participants
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimate the number of attendees for planning purposes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number.parseInt(e.target.value) : undefined
                    )
                  }
                  className="h-12 border-2 border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-base"
                  min={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Event Description */}
      <FormField
        control={form.control}
        name="eventDescription"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 mb-2">
              <FormLabel className="flex items-center gap-2 text-base font-semibold">
                <div className="p-1 rounded-md bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                Description
                <span className="text-destructive">*</span>
              </FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Provide a detailed description to help attendees understand your event</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <FormControl>
              <Textarea
                placeholder="Describe your event, including what attendees can expect, key highlights, and any important information..."
                rows={6}
                {...field}
                className="resize-none border-2 border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-base min-h-[120px]"
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

      <Separator className="my-6" />

      {/* Start Date and End Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => {
            const endDate = form.watch("endDate");
            return (
              <FormItem>
                <DateTimePicker
                  label="Start Date"
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.startDate?.message}
                  eventEndDate={endDate}
                  allowFlexibleDates={!!locationId}
                />
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => {
            const startDate = form.watch("startDate");
            return (
              <FormItem>
                <DateTimePicker
                  label="End Date"
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.endDate?.message}
                  eventStartDate={startDate}
                  allowFlexibleDates={!!locationId}
                />
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>

      <Separator className="my-8" />

      {/* Cover Image and Avatar Image */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <FormField
            control={form.control}
            name="coverUrl"
            render={({ field }) => (
              <FormItem>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <FormLabel className="text-base font-semibold text-foreground flex items-center gap-2">
                          Cover Image
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-medium mb-1">Cover Image</p>
                              <p className="text-sm">This is the main banner image displayed at the top of your event page. Recommended size: 1920x1080px or 16:9 aspect ratio.</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Main banner for your event</p>
                      </div>
                    </div>
                  </div>
                  <FormControl>
                    <SingleFileUpload
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url || "")}
                    />
                  </FormControl>
                </div>
                <FormMessage className="mt-2" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
              <FormItem>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <FormLabel className="text-base font-semibold text-foreground flex items-center gap-2">
                          Avatar Image
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-medium mb-1">Avatar Image</p>
                              <p className="text-sm">This is the thumbnail image used in event listings and cards. Recommended size: 512x512px or 1:1 aspect ratio (square).</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <p className="text-xs text-muted-foreground mt-0.5">Thumbnail for event listings</p>
                      </div>
                    </div>
                  </div>
                  <FormControl>
                    <SingleFileUpload
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url || "")}
                    />
                  </FormControl>
                </div>
                <FormMessage className="mt-2" />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator className="my-6" />

      {/* Tags Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <FormLabel className="flex items-center gap-2 text-base font-semibold">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Tags className="h-4 w-4 text-primary" />
            </div>
            Event Tags *
          </FormLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Tags help categorize your event and make it easier for users to discover</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <FormField
          control={form.control}
          name="tagIds"
          render={() => (
            <FormItem>
              <div className="border-2 border-primary/20 rounded-xl p-5 space-y-4 bg-gradient-to-br from-primary/5 to-primary/10/50 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Tags className="h-4 w-4 text-primary" />
                      Select Tags
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {filteredTags.length} available
                    </Badge>
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-9 text-sm border-primary/20 focus:border-primary/50"
                    />
                    {searchTerm.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground p-1 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isLoadingTags ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    <span className="ml-3 text-sm text-muted-foreground">Loading tags...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {displayedTags.map((tag: TagCategory) => {
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
                              "cursor-pointer transition-all duration-200 px-3 py-1.5 text-sm font-medium",
                              isSelected
                                ? "shadow-md ring-2 ring-offset-2 ring-primary/30 scale-105"
                                : "hover:shadow-sm hover:scale-105 hover:bg-muted/50"
                            )}
                            onClick={() => toggleTag(tag.id)}
                            title={tag.description}
                          >
                            <span className="mr-1.5 text-base">{tag.icon}</span>
                            {tag.name}
                          </Badge>
                        );
                      })}
                    </div>

                    {hasMore && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full h-9 text-sm font-medium hover:bg-primary/10"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="mr-2 h-4 w-4" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            View More ({filteredTags.length - INITIAL_DISPLAY_COUNT} more tags)
                          </>
                        )}
                      </Button>
                    )}

                    {filteredTags.length === 0 && searchTerm && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No tags found for "{searchTerm}"
                      </p>
                    )}

                    {(!tagCategories || tagCategories.length === 0) && !isLoadingTags && (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">No tags available. Please contact support to add tags.</p>
                      </div>
                    )}
                  </>
                )}
              </div>


              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator className="my-6" />

      {/* Social Links */}
      <Controller
        control={form.control}
        name="social"
        render={() => <SocialLinksInput form={form} />}
      />

    </div>
  );
}

// Export alias for Step 2 (basic info is now second step)
export const Step2BasicInfo = Step1BasicInfo;


"use client";

import { useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { useTagCategories } from "@/hooks/tags/useTagCategories";
import { TagCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Search, ChevronDown, ChevronUp, X, Tags, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step2TagsSelectionProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

const INITIAL_DISPLAY_COUNT = 5;

export function Step2TagsSelection({ form }: Step2TagsSelectionProps) {
  const { data: tagCategories, isLoading } = useTagCategories("EVENT");
  const selectedTagIds = form.watch("tagIds") || [];
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 pb-2 border-b border-primary/10">
        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
          <Tags className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-semibold">Select Event Tags</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tags help categorize your event and make it easier for users to discover</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground text-sm">
            Choose tags that best describe your event (you can select multiple).
          </p>
        </div>
      </div>

      {selectedTagIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagIds.map((id: number) => {
            const tag = tagCategories?.find((t: TagCategory) => t.id === id);
            if (!tag) return null;
            return (
              <Badge
                key={id}
                style={{ backgroundColor: tag.color, color: "#fff" }}
                className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
                <span className="text-xs">{tag.icon}</span>
                <span className="text-xs">{tag.name}</span>
                <button
                  onClick={() => toggleTag(id)}
                  className="ml-1 rounded-full hover:bg-white/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {form.formState.errors.tagIds && (
        <div className="text-sm text-destructive">
          {form.formState.errors.tagIds.message}
        </div>
      )}

      <div className="border-2 border-primary/10 rounded-lg p-4 space-y-3 bg-primary/5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Tags className="h-4 w-4 text-primary" />
            Event Tags
            <span className="text-xs text-muted-foreground font-normal ml-2">
              ({filteredTags.length})
            </span>
          </h3>
          <div className="relative w-40">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
            {searchTerm.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
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
                  "cursor-pointer transition-all hover:shadow-sm px-2 py-0.5 text-xs",
                  isSelected && "ring-1 ring-offset-1 ring-primary",
                  !isSelected && "hover:bg-muted"
                )}
                onClick={() => toggleTag(tag.id)}
                title={tag.description}
              >
                <span className="mr-1">{tag.icon}</span>
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

        {filteredTags.length === 0 && searchTerm && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No tags found for "{searchTerm}"
          </p>
        )}
      </div>

      {(!tagCategories || tagCategories.length === 0) && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tags available. Please contact support to add tags.</p>
        </div>
      )}
    </div>
  );
}

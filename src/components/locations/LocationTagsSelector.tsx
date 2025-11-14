/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { useTagCategories } from "@/hooks/tags/useTagCategories";
import type { TagCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INITIAL_DISPLAY_COUNT = 6;

interface LocationTagsSelectorProps {
  value: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  helperText?: string;
}

export function LocationTagsSelector({
  value,
  onChange,
  error,
  helperText,
}: LocationTagsSelectorProps) {
  const { data: tagCategories, isLoading } = useTagCategories("LOCATION");
  const [isExpanded, setIsExpanded] = useState(true);
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

  // Handle tag selection - allow multiple selections
  const handleToggleTag = (tagId: number) => {
    const isSelected = value.includes(tagId);
    if (isSelected) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      // Add to current selection (multiple allowed)
      onChange([...value, tagId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tagCategories || tagCategories.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        No tags available. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      <div
        className={cn(
          "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4",
          error && "border-destructive/60 bg-destructive/5"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2 text-sm font-semibold">
            Location Tag Categories
            <span className="text-xs font-normal text-muted-foreground">
              ({filteredTags.length})
            </span>
          </div>

          <div className="relative w-36 sm:w-48">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-8 pl-7 text-xs"
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

        <div className="flex flex-wrap gap-2">
          {displayedTags.map((tag) => {
            const isSelected = value.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                role="checkbox"
                aria-checked={isSelected}
                onClick={() => handleToggleTag(tag.id)}
                variant={isSelected ? "default" : "outline"}
                style={
                  isSelected
                    ? {
                        backgroundColor: tag.color,
                        borderColor: tag.color,
                        color: "#fff",
                      }
                    : { borderColor: tag.color, color: tag.color }
                }
                className={cn(
                  "cursor-pointer px-2.5 py-1 text-xs font-medium transition-all hover:shadow-sm",
                  isSelected && "ring-1 ring-offset-1 ring-primary"
                )}
                title={tag.description}
              >
                {tag.icon && <span className="mr-1">{tag.icon}</span>}
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
            className="h-7 px-0 text-xs text-muted-foreground hover:text-primary"
          >
            {isExpanded ? "Show less" : `Show all ${filteredTags.length} tags`}
          </Button>
        )}
      </div>
    </div>
  );
}


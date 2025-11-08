/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Search, X } from "lucide-react";

import { useAllTags } from "@/hooks/tags/useAllTags";
import type { Tag } from "@/types";
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

const GROUP_TITLE_MAP: Record<string, string> = {
  LOCATION_TYPE: "Location Type (Select One)",
};

function formatGroupLabel(groupName: string) {
  if (GROUP_TITLE_MAP[groupName]) {
    return GROUP_TITLE_MAP[groupName];
  }
  return groupName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function LocationTagsSelector({
  value,
  onChange,
  error,
  helperText,
}: LocationTagsSelectorProps) {
  const { data: allTags, isLoading } = useAllTags();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const tagsByGroup = useMemo(() => {
    const tags = (allTags || []).filter((tag) => tag.groupName === "LOCATION_TYPE");
    return tags.reduce((acc: Record<string, Tag[]>, tag) => {
      const group = tag.groupName || "Others";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(tag);
      return acc;
    }, {} as Record<string, Tag[]>);
  }, [allTags]);

  const handleToggleTag = (tagId: number, groupName?: string | null) => {
    const group = groupName || "Others";

    if (group === "LOCATION_TYPE") {
      const locationTags = tagsByGroup["LOCATION_TYPE"]?.map((tag) => tag.id) || [];
      const isSelected = value.includes(tagId);

      if (isSelected) {
        onChange(value.filter((id) => id !== tagId));
        return;
      }

      const filteredSelection = value.filter(
        (id) => !locationTags.includes(id)
      );
      onChange([...filteredSelection, tagId]);
      return;
    }

    const isSelected = value.includes(tagId);
    if (isSelected) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const getFilteredTags = (tags: Tag[], groupName: string) => {
    const term = (searchTerms[groupName] || "").toLowerCase();
    return tags.filter((tag) =>
      tag.displayName.toLowerCase().includes(term)
    );
  };

  const getDisplayedTags = (tags: Tag[], groupName: string) => {
    const filtered = getFilteredTags(tags, groupName);
    const isExpanded = expandedGroups[groupName];
    return isExpanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allTags || allTags.length === 0) {
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
      <div className="space-y-3">
        {Object.entries(tagsByGroup)
          .sort(([a], [b]) => {
            if (a === "Others") return 1;
            if (b === "Others") return -1;
            return a.localeCompare(b);
          })
          .map(([groupName, tagsInGroup]) => {
            const filtered = getFilteredTags(tagsInGroup, groupName);
            const displayed = getDisplayedTags(tagsInGroup, groupName);
            const hasMore = filtered.length > INITIAL_DISPLAY_COUNT;
            const listExpanded = expandedGroups[groupName];
            const groupExpanded =
              expandedGroups[`group_${groupName}`] ?? true;

            return (
              <div
                key={groupName}
                className={cn(
                  "space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4",
                  error && groupName === "LOCATION_TYPE" && "border-destructive/60 bg-destructive/5"
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
                    className="flex flex-1 items-center gap-2 text-left text-sm font-semibold transition-colors hover:text-primary"
                  >
                    {groupExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    {formatGroupLabel(groupName)}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({filtered.length})
                    </span>
                  </button>

                  {groupExpanded && (
                    <div className="relative w-36 sm:w-48">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search tags..."
                        value={searchTerms[groupName] || ""}
                        onChange={(event) =>
                          setSearchTerms((prev) => ({
                            ...prev,
                            [groupName]: event.target.value,
                          }))
                        }
                        className="h-8 pl-7 text-xs"
                        onClick={(event) => event.stopPropagation()}
                      />
                      {(searchTerms[groupName] || "").length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setSearchTerms((prev) => ({
                              ...prev,
                              [groupName]: "",
                            }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {groupExpanded && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {displayed.map((tag) => {
                        const isSelected = value.includes(tag.id);
                        return (
                          <Badge
                            key={tag.id}
                            role="checkbox"
                            aria-checked={isSelected}
                            onClick={() => handleToggleTag(tag.id, tag.groupName)}
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
                          >
                            {tag.icon && <span className="mr-1">{tag.icon}</span>}
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
                        className="h-7 px-0 text-xs text-muted-foreground hover:text-primary"
                      >
                        {listExpanded ? "Show less" : `Show all ${filtered.length} tags`}
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}


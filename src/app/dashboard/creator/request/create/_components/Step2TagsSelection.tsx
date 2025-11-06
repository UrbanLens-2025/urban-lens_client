"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { useAllTags } from "@/hooks/tags/useAllTags";
import { Tag } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step2TagsSelectionProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

const INITIAL_DISPLAY_COUNT = 5;

export function Step2TagsSelection({ form }: Step2TagsSelectionProps) {
  const { data: allTags, isLoading } = useAllTags();
  const selectedTagIds = form.watch("tagIds") || [];
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  
  // Filter to only show EVENT_TYPE tags for events
  const tags = (allTags || []).filter((tag) => tag.groupName === "EVENT_TYPE");
  
  // Group tags by groupName
  const groupedTags = tags.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
    const group = tag.groupName || "Others";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(tag);
    return acc;
  }, {});

  const toggleTag = (tagId: number, groupName: string | null) => {
    const normalizedGroupName = groupName || "Others";
    // EVENT_TYPE only allows one selection
    if (normalizedGroupName === "EVENT_TYPE") {
      // If clicking the same tag, deselect it
      if (selectedTagIds.includes(tagId)) {
        const newSelection = selectedTagIds.filter((id: number) => id !== tagId);
        form.setValue("tagIds", newSelection, { shouldValidate: true });
      } else {
        // Remove all EVENT_TYPE tags and add the new one
        const eventTypeTags = groupedTags["EVENT_TYPE"]?.map((t: Tag) => t.id) || [];
        const newSelection = selectedTagIds.filter((id: number) => !eventTypeTags.includes(id));
        form.setValue("tagIds", [...newSelection, tagId], { shouldValidate: true });
      }
    } else {
      // Multiple selection for other groups (including Others)
      const newSelection = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id: number) => id !== tagId)
        : [...selectedTagIds, tagId];
      form.setValue("tagIds", newSelection, { shouldValidate: true });
    }
  };

  const toggleExpanded = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Format group name from database (e.g., "EVENT_TYPE" -> "Event Type")
  const getGroupLabel = (group: string) => {
    if (group === "Others") {
      return "Others";
    }
    // Convert SNAKE_CASE or UPPERCASE to Title Case
    const formattedGroup = group
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    
    // EVENT_TYPE only allows one selection, others allow multiple
    const isSingleSelection = group === "EVENT_TYPE";
    
    return isSingleSelection 
      ? `${formattedGroup} (Select One)`
      : formattedGroup;
  };

  const getFilteredTags = (tags: Tag[], groupName: string) => {
    const searchTerm = searchTerms[groupName]?.toLowerCase() || "";
    return tags.filter((tag: Tag) =>
      tag.displayName.toLowerCase().includes(searchTerm)
    );
  };

  const getDisplayedTags = (tags: Tag[], groupName: string) => {
    const filtered = getFilteredTags(tags, groupName);
    const isExpanded = expandedGroups[groupName];
    return isExpanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT);
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
      <div>
        <h2 className="text-2xl font-semibold mb-2">Select Event Tags</h2>
        <p className="text-muted-foreground">
          Choose tags that best describe your event.
        </p>
        {selectedTagIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTagIds.map((id: number) => {
              const tag = tags.find((t: Tag) => t.id === id);
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
      </div>

      {form.formState.errors.tagIds && (
        <div className="text-sm text-destructive">
          {form.formState.errors.tagIds.message}
        </div>
      )}

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
            const displayedTags = getDisplayedTags(tags, groupName);
            const hasMore = filteredTags.length > INITIAL_DISPLAY_COUNT;
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
                          setSearchTerms(prev => ({ ...prev, [groupName]: e.target.value }))
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
                        onClick={() => toggleExpanded(groupName)}
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

                    {filteredTags.length === 0 && searchTerms[groupName] && (
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

      {tags.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tags available. Please contact support to add tags.</p>
        </div>
      )}
    </div>
  );
}

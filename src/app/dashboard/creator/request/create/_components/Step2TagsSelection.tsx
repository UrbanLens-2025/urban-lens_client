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

const ALLOWED_TAG_GROUPS = ["EVENT_TYPE", "THEME", "AESTHETIC", "ACTIVITY"];
const INITIAL_DISPLAY_COUNT = 5;

export function Step2TagsSelection({ form }: Step2TagsSelectionProps) {
  const { data: allTags, isLoading } = useAllTags();
  const selectedTagIds = form.watch("tagIds") || [];
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  
  const tags = allTags || [];
  
  // Include all tags - those in allowed groups AND those with null groupName
  const filteredTags = tags.filter(
    (tag: Tag) => !tag.groupName || ALLOWED_TAG_GROUPS.includes(tag.groupName)
  );

  // Group tags by groupName, assigning null groupName to "Others"
  const groupedTags = filteredTags.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
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
      return "Others (Multiple Selection)";
    }
    // Convert SNAKE_CASE or UPPERCASE to Title Case
    const formattedGroup = group
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
    
    // Check if this group only allows one selection (based on first tag in group)
    const groupTags = groupedTags[group] || [];
    const firstTag = groupTags[0];
    // If group is EVENT_TYPE, allow only one selection (this could be determined from tag properties in future)
    const isSingleSelection = group === "EVENT_TYPE";
    
    return isSingleSelection 
      ? `${formattedGroup} (Select One)`
      : `${formattedGroup} (Multiple Selection)`;
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

      <div className="space-y-6">
        {Object.entries(groupedTags).map(([groupName, tags]) => {
          const filteredTags = getFilteredTags(tags, groupName);
          const displayedTags = getDisplayedTags(tags, groupName);
          const hasMore = filteredTags.length > INITIAL_DISPLAY_COUNT;
          const isExpanded = expandedGroups[groupName];

          return (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{getGroupLabel(groupName)}</h3>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerms[groupName] || ""}
                    onChange={(e) =>
                      setSearchTerms(prev => ({ ...prev, [groupName]: e.target.value }))
                    }
                    className="pl-8 h-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
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
                        "cursor-pointer transition-all hover:shadow-md px-3 py-1.5",
                        isSelected && "ring-2 ring-offset-2 ring-primary"
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
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(groupName)}
                  className="w-full"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      View More ({filteredTags.length - INITIAL_DISPLAY_COUNT} more)
                    </>
                  )}
                </Button>
              )}

              {filteredTags.length === 0 && searchTerms[groupName] && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags found for "{searchTerms[groupName]}"
                </p>
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

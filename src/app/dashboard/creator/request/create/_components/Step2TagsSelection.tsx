"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { useTags } from "@/hooks/tags/useTags";
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

// Mock tags for testing (will be replaced by API data when available)
const MOCK_TAGS: Tag[] = [
  // EVENT_TYPE (10 tags)
  { id: 1, groupName: "EVENT_TYPE", displayName: "Conference", color: "#3B82F6", icon: "🎤", isSelectable: true },
  { id: 2, groupName: "EVENT_TYPE", displayName: "Workshop", color: "#8B5CF6", icon: "🛠️", isSelectable: true },
  { id: 3, groupName: "EVENT_TYPE", displayName: "Concert", color: "#EC4899", icon: "🎵", isSelectable: true },
  { id: 4, groupName: "EVENT_TYPE", displayName: "Festival", color: "#F59E0B", icon: "🎪", isSelectable: true },
  { id: 5, groupName: "EVENT_TYPE", displayName: "Exhibition", color: "#10B981", icon: "🖼️", isSelectable: true },
  { id: 6, groupName: "EVENT_TYPE", displayName: "Networking", color: "#6366F1", icon: "🤝", isSelectable: true },
  { id: 7, groupName: "EVENT_TYPE", displayName: "Seminar", color: "#14B8A6", icon: "📚", isSelectable: true },
  { id: 8, groupName: "EVENT_TYPE", displayName: "Party", color: "#F43F5E", icon: "🎉", isSelectable: true },
  { id: 9, groupName: "EVENT_TYPE", displayName: "Sports", color: "#EF4444", icon: "⚽", isSelectable: true },
  { id: 10, groupName: "EVENT_TYPE", displayName: "Charity", color: "#06B6D4", icon: "❤️", isSelectable: true },
  
  // THEME (10 tags)
  { id: 11, groupName: "THEME", displayName: "Tech & Innovation", color: "#3B82F6", icon: "💻", isSelectable: true },
  { id: 12, groupName: "THEME", displayName: "Arts & Culture", color: "#8B5CF6", icon: "🎨", isSelectable: true },
  { id: 13, groupName: "THEME", displayName: "Food & Beverage", color: "#F59E0B", icon: "🍕", isSelectable: true },
  { id: 14, groupName: "THEME", displayName: "Music & Dance", color: "#EC4899", icon: "🎶", isSelectable: true },
  { id: 15, groupName: "THEME", displayName: "Business & Finance", color: "#10B981", icon: "💼", isSelectable: true },
  { id: 16, groupName: "THEME", displayName: "Health & Wellness", color: "#14B8A6", icon: "🧘", isSelectable: true },
  { id: 17, groupName: "THEME", displayName: "Education", color: "#6366F1", icon: "📖", isSelectable: true },
  { id: 18, groupName: "THEME", displayName: "Fashion", color: "#F43F5E", icon: "👗", isSelectable: true },
  { id: 19, groupName: "THEME", displayName: "Gaming", color: "#8B5CF6", icon: "🎮", isSelectable: true },
  { id: 20, groupName: "THEME", displayName: "Environmental", color: "#10B981", icon: "🌱", isSelectable: true },
  
  // AESTHETIC (10 tags)
  { id: 21, groupName: "AESTHETIC", displayName: "Modern", color: "#64748B", icon: "✨", isSelectable: true },
  { id: 22, groupName: "AESTHETIC", displayName: "Vintage", color: "#92400E", icon: "📻", isSelectable: true },
  { id: 23, groupName: "AESTHETIC", displayName: "Minimalist", color: "#71717A", icon: "⚪", isSelectable: true },
  { id: 24, groupName: "AESTHETIC", displayName: "Colorful", color: "#EC4899", icon: "🌈", isSelectable: true },
  { id: 25, groupName: "AESTHETIC", displayName: "Elegant", color: "#6366F1", icon: "💎", isSelectable: true },
  { id: 26, groupName: "AESTHETIC", displayName: "Rustic", color: "#92400E", icon: "🪵", isSelectable: true },
  { id: 27, groupName: "AESTHETIC", displayName: "Urban", color: "#475569", icon: "🏙️", isSelectable: true },
  { id: 28, groupName: "AESTHETIC", displayName: "Tropical", color: "#10B981", icon: "🌴", isSelectable: true },
  { id: 29, groupName: "AESTHETIC", displayName: "Futuristic", color: "#06B6D4", icon: "🚀", isSelectable: true },
  { id: 30, groupName: "AESTHETIC", displayName: "Bohemian", color: "#D97706", icon: "🌺", isSelectable: true },
  
  // ACTIVITY (10 tags)
  { id: 31, groupName: "ACTIVITY", displayName: "Dining", color: "#F59E0B", icon: "🍽️", isSelectable: true },
  { id: 32, groupName: "ACTIVITY", displayName: "Dancing", color: "#EC4899", icon: "💃", isSelectable: true },
  { id: 33, groupName: "ACTIVITY", displayName: "Networking", color: "#3B82F6", icon: "👥", isSelectable: true },
  { id: 34, groupName: "ACTIVITY", displayName: "Learning", color: "#6366F1", icon: "🎓", isSelectable: true },
  { id: 35, groupName: "ACTIVITY", displayName: "Shopping", color: "#F43F5E", icon: "🛍️", isSelectable: true },
  { id: 36, groupName: "ACTIVITY", displayName: "Gaming", color: "#8B5CF6", icon: "🕹️", isSelectable: true },
  { id: 37, groupName: "ACTIVITY", displayName: "Live Performance", color: "#EC4899", icon: "🎭", isSelectable: true },
  { id: 38, groupName: "ACTIVITY", displayName: "Outdoor Activities", color: "#10B981", icon: "🏕️", isSelectable: true },
  { id: 39, groupName: "ACTIVITY", displayName: "Photography", color: "#06B6D4", icon: "📷", isSelectable: true },
  { id: 40, groupName: "ACTIVITY", displayName: "Socializing", color: "#F59E0B", icon: "💬", isSelectable: true },
];

export function Step2TagsSelection({ form }: Step2TagsSelectionProps) {
  const { data: tagsResponse, isLoading } = useTags();
  const selectedTagIds = form.watch("tagIds") || [];
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  // Use API tags if available, otherwise use mock tags
  const apiTags = tagsResponse?.data || [];
  const allTags = apiTags.length > 0 ? apiTags : MOCK_TAGS;
  
  // Filter tags by allowed groups
  const filteredTags = allTags.filter(
    (tag: Tag) => tag.groupName && ALLOWED_TAG_GROUPS.includes(tag.groupName)
  );

  // Group tags by groupName
  const groupedTags = filteredTags.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
    const group = tag.groupName || "OTHER";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(tag);
    return acc;
  }, {});

  const toggleTag = (tagId: number, groupName: string) => {
    // EVENT_TYPE only allows one selection
    if (groupName === "EVENT_TYPE") {
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
      // Multiple selection for other groups
      const newSelection = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id: number) => id !== tagId)
        : [...selectedTagIds, tagId];
      form.setValue("tagIds", newSelection, { shouldValidate: true });
    }
  };

  const toggleExpanded = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupLabel = (group: string) => {
    switch (group) {
      case "EVENT_TYPE":
        return "Event Type (Select One)";
      case "THEME":
        return "Theme (Multiple Selection)";
      case "AESTHETIC":
        return "Aesthetic (Multiple Selection)";
      case "ACTIVITY":
        return "Activity (Multiple Selection)";
      default:
        return group;
    }
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
              const tag = allTags.find((t: Tag) => t.id === id);
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
                    onClick={() => toggleTag(id, tag.groupName || "")}
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
                      onClick={() => toggleTag(tag.id, groupName)}
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

      {filteredTags.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tags available</p>
        </div>
      )}
    </div>
  );
}

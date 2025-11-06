"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Tag } from "@/types";

interface DisplayTagsProps {
  tags?: Tag[];
  maxCount?: number;
  emptyText?: string;
}

export function DisplayTags({
  tags = [],
  maxCount = 5,
}: DisplayTagsProps) {
  // Filter out any tags without IDs and ensure uniqueness
  const validTags = tags.filter((tag) => tag?.id != null);
  const uniqueTags = validTags.reduce((acc, tag) => {
    if (!acc.find((t) => t.id === tag.id)) {
      acc.push(tag);
    }
    return acc;
  }, [] as Tag[]);

  const visibleTags = uniqueTags.slice(0, maxCount);
  const hiddenTags = uniqueTags.slice(maxCount);
  const hiddenCount = hiddenTags.length;

  if (uniqueTags.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag, index) => (
          <Badge
            key={`tag-${tag.id}-${index}`}
            variant="secondary"
            style={{ backgroundColor: tag.color, color: "#fff" }}
          >
            {tag.icon} {tag.displayName}
          </Badge>
        ))}

        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-default">
                +{hiddenCount} more
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-xs">
              <div className="flex flex-wrap gap-2">
                {hiddenTags.map((tag, index) => (
                  <Badge
                    key={`hidden-tag-${tag.id}-${index}`}
                    variant="secondary"
                    style={{ backgroundColor: tag.color, color: "#fff" }}
                  >
                    {tag.icon} {tag.displayName}
                  </Badge>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

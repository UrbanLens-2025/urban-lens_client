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
  tags?: { tag: Tag }[];
  maxCount?: number;
  emptyText?: string;
}

export function DisplayTags({
  tags = [],
  maxCount = 5,
}: DisplayTagsProps) {

  const visibleTags = tags.slice(0, maxCount);
  const hiddenTags = tags.slice(maxCount);
  const hiddenCount = hiddenTags.length;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map(({ tag }) => (
          <Badge
            key={tag.id}
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
                {hiddenTags.map(({ tag }) => (
                  <Badge
                    key={tag.id}
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

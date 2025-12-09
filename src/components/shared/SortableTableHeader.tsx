"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "ASC" | "DESC" | null;

interface SortableTableHeaderProps {
  children: React.ReactNode;
  column: string;
  currentSort?: {
    column: string;
    direction: SortDirection;
  };
  onSort?: (column: string, direction: SortDirection) => void;
  className?: string;
  sortable?: boolean;
}

export function SortableTableHeader({
  children,
  column,
  currentSort,
  onSort,
  className,
  sortable = true,
}: SortableTableHeaderProps) {
  const isActive = currentSort?.column === column;
  const direction = isActive ? currentSort?.direction : null;

  const handleClick = () => {
    if (!sortable || !onSort) return;

    let newDirection: SortDirection = "ASC";
    if (isActive) {
      if (direction === "ASC") {
        newDirection = "DESC";
      } else if (direction === "DESC") {
        newDirection = null; // Reset to no sort
      }
    }

    onSort(column, newDirection);
  };

  return (
    <TableHead
      className={cn(
        "font-semibold",
        sortable && onSort && "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {sortable && onSort && (
          <div className="flex flex-col">
            {direction === "ASC" ? (
              <ArrowUp className="h-3 w-3 text-primary" />
            ) : direction === "DESC" ? (
              <ArrowDown className="h-3 w-3 text-primary" />
            ) : (
              <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
            )}
          </div>
        )}
      </div>
    </TableHead>
  );
}


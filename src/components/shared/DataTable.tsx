"use client";

import { ReactNode, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { TableFilters } from "./TableFilters";
import { SortableTableHeader, SortDirection } from "./SortableTableHeader";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
}

interface Filter {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
  };
  renderRow: (item: any, index: number) => ReactNode;
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  // Filters
  filters?: Filter[];
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  // Sort
  sort?: {
    column: string;
    direction: SortDirection;
  };
  onSort?: (column: string, direction: SortDirection) => void;
  // Actions
  actions?: ReactNode;
  // Pagination
  pagination?: ReactNode;
  className?: string;
}

export function DataTable({
  columns,
  data,
  isLoading = false,
  emptyState,
  renderRow,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  activeFiltersCount,
  onClearFilters,
  sort,
  onSort,
  actions,
  pagination,
  className,
}: DataTableProps) {
  const computedActiveFiltersCount = useMemo(() => {
    if (activeFiltersCount !== undefined) return activeFiltersCount;
    let count = 0;
    filters.forEach((filter) => {
      if (filter.value !== "all" && filter.value !== "") count++;
    });
    if (searchValue) count++;
    return count;
  }, [activeFiltersCount, filters, searchValue]);

  return (
    <Card className={cn("overflow-hidden border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm", className)}>
      <CardContent className="p-0">
        <div className="flex flex-col h-full">
          {/* Filters */}
          <TableFilters
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            filters={filters}
            activeFiltersCount={computedActiveFiltersCount}
            onClearFilters={onClearFilters}
            actions={actions}
          />

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {emptyState?.icon && (
                  <div className="mb-4 text-muted-foreground/50">
                    {emptyState.icon}
                  </div>
                )}
                <p className="text-sm font-medium text-muted-foreground">
                  {emptyState?.title || "No data found"}
                </p>
                {emptyState?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {emptyState.description}
                  </p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b">
                    {columns.map((column) => (
                      column.sortable && onSort ? (
                        <SortableTableHeader
                          key={column.key}
                          column={column.key}
                          currentSort={sort}
                          onSort={onSort}
                          className={column.className}
                        >
                          {column.label}
                        </SortableTableHeader>
                      ) : (
                        <th
                          key={column.key}
                          className={cn(
                            "font-semibold text-left text-xs uppercase tracking-wide text-muted-foreground py-3 px-4",
                            column.className
                          )}
                        >
                          {column.label}
                        </th>
                      )
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => renderRow(item, index))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="border-t border-primary/10 px-6 py-4">
              {pagination}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


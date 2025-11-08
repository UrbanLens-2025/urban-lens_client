/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Users,
  Eye,
  ArrowUpDown,
  Filter,
} from "lucide-react";

import { useMyLocations } from "@/hooks/locations/useMyLocations";
import { Location } from "@/types";

import { DisplayTags } from "@/components/shared/DisplayTags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sortOptions = [
  { label: "Newest first", value: "createdAt:DESC" },
  { label: "Oldest first", value: "createdAt:ASC" },
  { label: "Name A → Z", value: "name:ASC" },
  { label: "Name Z → A", value: "name:DESC" },
  { label: "Most check-ins", value: "totalCheckIns:DESC" },
  { label: "Least check-ins", value: "totalCheckIns:ASC" },
];

const visibleOptions = [
  { label: "All visibility", value: "all" },
  { label: "Visible on map", value: "visible" },
  { label: "Hidden", value: "hidden" },
];

function ActiveLocationActions({ location }: { location: Location }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/business/locations/${location.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Edit Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/business/locations/${location.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Live Page
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const parseCheckIns = (value?: string) => {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function MyLocationsPage() {
  const [activePage, setActivePage] = useState(1);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>(sortOptions[0].value);
  const [visibleFilter, setVisibleFilter] = useState<"all" | "visible" | "hidden">("all");
  const [debouncedSearchTerm] = useDebounce(activeSearchTerm, 300);

  const filterVisibleOnMap =
    visibleFilter === "all"
      ? undefined
      : visibleFilter === "visible"
      ? "true"
      : "false";

  const { data: activeLocationsResponse, isLoading: isLoadingActive } =
    useMyLocations(activePage, debouncedSearchTerm, {
      sortBy,
      filterVisibleOnMap,
      searchBy: ["name", "addressLine", "description"],
    });

  const activeLocations: Location[] = activeLocationsResponse?.data || [];
  const activeMeta = activeLocationsResponse?.meta;
  const isLoading = isLoadingActive;

  const stats = useMemo(() => {
    const visibleOnMap = activeLocations.filter(
      (location) => location.isVisibleOnMap
    ).length;

    const totalCheckIns = activeLocations.reduce((acc, location) => {
      return acc + parseCheckIns(location.totalCheckIns);
    }, 0);

    return {
      total: activeMeta?.totalItems ?? activeLocations.length,
      visibleOnMap,
      totalCheckIns,
      currentPageCount: activeLocations.length,
    };
  }, [activeLocations, activeMeta]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold">My Locations</h1>
          <p className="text-muted-foreground">
            Manage your active locations and track submissions.
          </p>
        </div>
        <Link href="/dashboard/business/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Submit New Location
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total locations</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.total.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Across all pages
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Visible on map</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.visibleOnMap.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            This page only
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Total check-ins</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.totalCheckIns.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Across locations on this page
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Items this page</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {stats.currentPageCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Page {activeMeta?.currentPage ?? activePage} of {activeMeta?.totalPages ?? 1}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                Active Locations
              </CardTitle>
              <CardDescription>
                Browse and manage your published locations.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Input
                placeholder="Search locations..."
                value={activeSearchTerm}
                onChange={(e) => {
                  setActiveSearchTerm(e.target.value);
                  setActivePage(1);
                }}
                className="sm:w-[260px]"
              />
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-muted-foreground hover:text-foreground sm:w-auto"
                onClick={() => {
                  setActiveSearchTerm("");
                  setSortBy(sortOptions[0].value);
                  setVisibleFilter("all");
                  setActivePage(1);
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
                Reset filters
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" /> Filters
              </div>
              <Select
                value={visibleFilter}
                onValueChange={(value: "all" | "visible" | "hidden") => {
                  setVisibleFilter(value);
                  setActivePage(1);
                }}
              >
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  {visibleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setActivePage(1);
                }}
              >
                <SelectTrigger className="sm:w-[220px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {activeLocations.length} of {activeMeta?.totalItems ?? activeLocations.length} locations
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {activeLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-12 text-center">
              <div className="text-xl font-semibold">
                No locations found for your filters
              </div>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try adjusting your filters or submit a new location to get started.
              </p>
              <Button asChild className="mt-6">
                <Link href="/dashboard/business/locations/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Submit a location
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b border-border/60">
                    <TableHead className="w-[420px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Location
                    </TableHead>
                    <TableHead className="w-[280px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Address
                    </TableHead>
                    <TableHead className="w-[220px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Tags
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Check-ins
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLocations.map((location) => (
                    <TableRow
                      key={location.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="align-top">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-20 overflow-hidden rounded-lg border border-border/50 bg-muted">
                            {location.imageUrl?.[0] ? (
                              <img
                                src={location.imageUrl[0]}
                                alt={location.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-semibold leading-tight">
                                {location.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                Updated {new Date(location.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm text-muted-foreground">
                        <div>{location.addressLine}</div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground/80">
                          {location.addressLevel2}, {location.addressLevel1}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <DisplayTags tags={location.tags} maxCount={3} />
                      </TableCell>
                      <TableCell className="align-top text-right text-sm font-semibold">
                        {parseCheckIns(location.totalCheckIns).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <ActiveLocationActions location={location} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Page {activeMeta?.currentPage ?? activePage} of {activeMeta?.totalPages ?? 1}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePage((page) => Math.max(1, page - 1))}
                disabled={!activeMeta || activeMeta.currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setActivePage((page) =>
                    activeMeta ? Math.min(activeMeta.totalPages, page + 1) : page + 1
                  )
                }
                disabled={!activeMeta || activeMeta.currentPage >= activeMeta.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
  Copy,
  Edit,
  BadgeX,
  Search,
} from "lucide-react";

import { useMyLocations } from "@/hooks/locations/useMyLocations";
import { Location } from "@/types";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { useMutation } from "@tanstack/react-query";
import { updateLocation } from "@/api/locations";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

function VisibilitySwitch({ location }: { location: Location }) {
  const queryClient = useQueryClient();
  const { data: fullLocation, isLoading: isLoadingLocation } = useLocationById(location.id);

  const { mutate: toggleVisibility, isPending } = useMutation({
    mutationFn: async (checked: boolean) => {
      if (!fullLocation) {
        throw new Error("Location data not loaded");
      }

      // Get current tag IDs from the location
      const tagIds = fullLocation.tags?.map((tag) => tag.id) || [];

      return updateLocation(location.id, {
        name: fullLocation.name,
        description: fullLocation.description,
        imageUrl: fullLocation.imageUrl || [],
        isVisibleOnMap: checked,
        tagIds: tagIds,
      });
    },
    onSuccess: (_, checked) => {
      queryClient.invalidateQueries({ queryKey: ["myLocations"] });
      queryClient.invalidateQueries({ queryKey: ["location", location.id] });
      toast.success(
        checked
          ? "Location is now visible on map"
          : "Location is now hidden from map"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update visibility");
    },
  });

  const handleToggle = (checked: boolean) => {
    toggleVisibility(checked);
  };

  return (
    <Switch
      checked={location.isVisibleOnMap}
      onCheckedChange={handleToggle}
      disabled={isPending || isLoadingLocation || !fullLocation}
      className="data-[state=checked]:bg-primary"
    />
  );
}

function ActiveLocationActions({ location }: { location: Location }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 hover:bg-muted/80 transition-colors"
      asChild
    >
      <Link href={`/dashboard/business/locations/${location.id}`}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
  );
}

const parseCheckIns = (value?: string) => {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function MyLocationsPage() {
  // Active Locations state
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

  const stats = useMemo(() => {
    const visibleOnMap = activeLocations.filter(
      (location) => location.isVisibleOnMap
    ).length;

    const totalCheckIns = activeLocations.reduce((acc, location) => {
      return acc + parseCheckIns(location.totalCheckIns);
    }, 0);

    // Calculate total visible across all pages (we need to estimate or use meta if available)
    // For now, we'll show the count from current page, but note it's an estimate
    const hiddenOnMap = activeLocations.length - visibleOnMap;

    return {
      total: activeMeta?.totalItems ?? activeLocations.length,
      visibleOnMap,
      hiddenOnMap,
      totalCheckIns,
    };
  }, [activeLocations, activeMeta]);

  if (isLoadingActive) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Locations</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total approved locations
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visible on Map</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.visibleOnMap.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Discoverable by users
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hidden</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.hiddenOnMap.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Not visible on map
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Check-ins</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalCheckIns.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time visitor count
              </p>
            </CardContent>
          </Card>
        </div>

      <Card className="border-border/60 shadow-sm py-0 gap-0">
        <CardContent className="pt-4 pb-0 px-0">
          <div className="space-y-0 mt-0">
              {/* Search Bar and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 px-6 pb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by location name, address, or tags..."
                    value={activeSearchTerm}
                    onChange={(e) => {
                      setActiveSearchTerm(e.target.value);
                      setActivePage(1);
                    }}
                    className="h-10 pl-10 pr-4 rounded-lg border-border/60"
                  />
                </div>
                <Select
                  value={visibleFilter}
                  onValueChange={(value: "all" | "visible" | "hidden") => {
                    setVisibleFilter(value);
                    setActivePage(1);
                  }}
                >
                  <SelectTrigger className="h-10 sm:w-[160px] rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-12 text-center mx-6">
                  <div className="text-lg font-semibold">
                    No locations found for your filters
                  </div>
                  <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                    Try adjusting your filters or submit a new location to get started.
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/business/locations/create">
                      <PlusCircle className="mr-2 h-3.5 w-3.5" />
                      Submit a location
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-b border-border/60 hover:bg-muted/50">
                        <TableHead className="w-12 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 pl-6">#</TableHead>
                        <TableHead className="min-w-[200px] max-w-[280px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Location Name
                        </TableHead>
                        <TableHead className="min-w-[150px] max-w-[220px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Address
                        </TableHead>
                        <TableHead className="min-w-[150px] max-w-[200px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Tags
                        </TableHead>
                        <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 w-[120px]">
                          Created
                        </TableHead>
                        <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 w-[130px]">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeLocations.map((location, index) => (
                        <TableRow
                          key={location.id}
                          className="border-b border-border/40 transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="text-xs text-muted-foreground font-medium py-4 pl-6">
                            {(activePage - 1) * 10 + index + 1}
                          </TableCell>
                          <TableCell className="py-4">
                            <Link
                              href={`/dashboard/business/locations/${location.id}`}
                              className="group cursor-pointer hover:underline"
                            >
                              <span className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                {location.name}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-4">
                            <div className="truncate max-w-[180px]">{location.addressLine || "N/A"}</div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground/80 truncate mt-0.5 max-w-[180px]">
                              {[location.addressLevel2, location.addressLevel1].filter(Boolean).join(", ") || ""}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {location.tags && location.tags.length > 0 ? (
                                <>
                                  {location.tags.slice(0, 2).map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      className="text-xs font-medium px-2 py-0.5 rounded-md"
                                      style={{
                                        backgroundColor: `${tag.color}20`,
                                        color: tag.color,
                                        borderColor: `${tag.color}40`,
                                      }}
                                      variant="outline"
                                    >
                                      {tag.icon && <span className="mr-1">{tag.icon}</span>}
                                      {tag.displayName}
                                    </Badge>
                                  ))}
                                  {location.tags.length > 2 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs font-medium px-2 py-0.5 rounded-md"
                                    >
                                      +{location.tags.length - 2}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">No tags</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs py-4">
                            {new Date(location.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={cn(
                                "text-xs font-medium px-2 py-0.5",
                                location.isVisibleOnMap
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                              )}
                              variant="outline"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {location.isVisibleOnMap ? "Visible" : "Draft"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t pt-3 pb-3 px-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {activeMeta?.currentPage ?? activePage} of {activeMeta?.totalPages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setActivePage((page) => Math.max(1, page - 1))}
                    disabled={!activeMeta || activeMeta.currentPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
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
            </div>
          </CardContent>
      </Card>
    </div>
  );
}

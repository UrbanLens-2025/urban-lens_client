/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "next/navigation";
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
  ArrowUp,
  ArrowDown,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { useMyLocations, useLocationRequests } from "@/hooks/locations/useMyLocations";
import { Location, LocationRequest, LocationStatus, SortState } from "@/types";
import { useCancelLocationRequest } from "@/hooks/locations/useCancelLocationRequest";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function RequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: LocationStatus;
}) {
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const { mutate: cancelRequest, isPending } = useCancelLocationRequest();

  const onCancelConfirm = () => {
    cancelRequest(requestId, {
      onSuccess: () => setIsCancelAlertOpen(false),
    });
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/business/locations/request/${requestId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          {(status === "AWAITING_ADMIN_REVIEW" ||
            status === "NEEDS_MORE_INFO") && (
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/business/locations/request/${requestId}/edit`}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Request
              </Link>
            </DropdownMenuItem>
          )}

          {(status === "REJECTED" || status === "CANCELLED_BY_BUSINESS") && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/locations/create?copyFrom=${requestId}`}>
                <Copy className="mr-2 h-4 w-4" /> Copy & Create New
              </Link>
            </DropdownMenuItem>
          )}

          {(status === "AWAITING_ADMIN_REVIEW" ||
            status === "NEEDS_MORE_INFO") && (
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => setIsCancelAlertOpen(true)}
              disabled={isPending}
            >
              <BadgeX className="mr-2 h-4 w-4" />
              Cancel Request
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to cancel this request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your request status will be changed
              to &apos;CANCELLED_BY_BUSINESS&apos;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={onCancelConfirm}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const parseCheckIns = (value?: string) => {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function MyLocationsPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"locations" | "requests">(
    (tabFromUrl === "requests" ? "requests" : "locations") as "locations" | "requests"
  );

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabFromUrl === "requests") {
      setActiveTab("requests");
    } else if (tabFromUrl === "locations" || !tabFromUrl) {
      setActiveTab("locations");
    }
  }, [tabFromUrl]);
  
  // Active Locations state
  const [activePage, setActivePage] = useState(1);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>(sortOptions[0].value);
  const [visibleFilter, setVisibleFilter] = useState<"all" | "visible" | "hidden">("all");
  const [debouncedSearchTerm] = useDebounce(activeSearchTerm, 300);

  // Requests state
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsSearchTerm, setRequestsSearchTerm] = useState("");
  const [requestsStatusFilter, setRequestsStatusFilter] = useState<LocationStatus | "all">("all");
  const [requestsSort, setRequestsSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });
  const [debouncedRequestsSearch] = useDebounce(requestsSearchTerm, 300);
  const requestsSortByString = `${requestsSort.column}:${requestsSort.direction}`;

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

  const { data: requestsResponse, isLoading: isLoadingRequests } =
    useLocationRequests(requestsPage, requestsSortByString, {
      search: debouncedRequestsSearch,
      status: requestsStatusFilter === "all" ? undefined : requestsStatusFilter,
      searchBy: ["name", "description", "addressLine"],
    });

  const activeLocations: Location[] = activeLocationsResponse?.data || [];
  const activeMeta = activeLocationsResponse?.meta;
  const locationRequests: LocationRequest[] = requestsResponse?.data || [];
  const requestsMeta = requestsResponse?.meta;

  const isLoading = activeTab === "locations" ? isLoadingActive : isLoadingRequests;

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

  const requestStats = useMemo(() => {
    const awaitingReview = locationRequests.filter(
      (req) => req.status === "AWAITING_ADMIN_REVIEW"
    ).length;
    const needsMoreInfo = locationRequests.filter(
      (req) => req.status === "NEEDS_MORE_INFO"
    ).length;
    const approved = locationRequests.filter(
      (req) => req.status === "APPROVED"
    ).length;
    const rejectedOrCancelled = locationRequests.filter(
      (req) => req.status === "REJECTED" || req.status === "CANCELLED_BY_BUSINESS"
    ).length;

    return {
      total: requestsMeta?.totalItems ?? locationRequests.length,
      awaitingReview,
      needsMoreInfo,
      approved,
      rejectedOrCancelled,
      pending: awaitingReview + needsMoreInfo,
      currentPageCount: locationRequests.length,
    };
  }, [locationRequests, requestsMeta]);

  const handleRequestsSort = (columnName: string) => {
    setRequestsSort((currentSort) => ({
      column: columnName,
      direction:
        currentSort.column === columnName && currentSort.direction === "DESC"
          ? "ASC"
          : "DESC",
    }));
    setRequestsPage(1);
  };

  const RequestsSortIcon = ({ column }: { column: string }) => {
    if (requestsSort.column !== column) return null;
    return requestsSort.direction === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "locations" | "requests")} className="flex-1">
          <TabsList className="inline-flex h-9 items-center justify-start">
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Active Locations
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Requests
              {requestsMeta?.totalItems ? (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {requestsMeta.totalItems}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Link href="/dashboard/business/locations/create">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Submit New Location
          </Button>
        </Link>
      </div>

      {activeTab === "locations" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Locations</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all pages
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
                This page only
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
                Across locations on this page
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Items This Page</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.currentPageCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Page {activeMeta?.currentPage ?? activePage} of {activeMeta?.totalPages ?? 1}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Total requests</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {requestStats.total.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Across all pages
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Pending review</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {requestStats.awaitingReview.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              This page only
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Needs more info</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {requestStats.needsMoreInfo.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              This page only
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Approved</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {requestStats.approved.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5" />
              This page only
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs">Rejected/Cancelled</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {requestStats.rejectedOrCancelled.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" />
              This page only
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-border/60 shadow-sm">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "locations" | "requests")}>
          <CardContent className="pt-4">
            <TabsContent value="locations" className="space-y-3 mt-0">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Filter className="h-3.5 w-3.5" /> Filters
                    </div>
                    <Select
                      value={visibleFilter}
                      onValueChange={(value: "all" | "visible" | "hidden") => {
                        setVisibleFilter(value);
                        setActivePage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 sm:w-[160px]">
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
                      <SelectTrigger className="h-8 sm:w-[180px]">
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
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search locations..."
                      value={activeSearchTerm}
                      onChange={(e) => {
                        setActiveSearchTerm(e.target.value);
                        setActivePage(1);
                      }}
                      className="h-8 sm:w-[240px]"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setActiveSearchTerm("");
                        setSortBy(sortOptions[0].value);
                        setVisibleFilter("all");
                        setActivePage(1);
                      }}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {activeLocations.length} of {activeMeta?.totalItems ?? activeLocations.length} locations
                </div>
              </div>

              {activeLocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-8 text-center">
                  <div className="text-lg font-semibold">
                    No locations found for your filters
                  </div>
                  <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
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
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-b border-border/60 hover:bg-muted/50">
                        <TableHead className="w-[380px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Location
                        </TableHead>
                        <TableHead className="w-[260px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Address
                        </TableHead>
                        <TableHead className="w-[200px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Tags
                        </TableHead>
                        <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Visible
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                          Check-ins
                        </TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 w-[100px]">
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
                          <TableCell className="align-top py-4">
                            <Link 
                              href={`/dashboard/business/locations/${location.id}`}
                              className="flex items-start gap-2.5 group cursor-pointer"
                            >
                              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted">
                                {location.imageUrl?.[0] ? (
                                  <img
                                    src={location.imageUrl[0]}
                                    alt={location.name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">
                                    No image
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                                    {location.name}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  <span>
                                    Updated {new Date(location.updatedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="align-top text-xs text-muted-foreground py-4">
                            <div className="truncate">{location.addressLine}</div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground/80 truncate mt-0.5">
                              {location.addressLevel2}, {location.addressLevel1}
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-4">
                            <DisplayTags tags={location.tags} maxCount={3} />
                          </TableCell>
                          <TableCell className="align-top text-center py-4">
                            <VisibilitySwitch location={location} />
                          </TableCell>
                          <TableCell className="align-top text-right text-xs font-semibold py-4">
                            {parseCheckIns(location.totalCheckIns).toLocaleString()}
                          </TableCell>
                          <TableCell className="align-top text-right py-4">
                            <div className="flex items-center justify-end gap-2">
                              <ActiveLocationActions location={location} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
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
                    Previous
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
            </TabsContent>

            <TabsContent value="requests" className="space-y-3 mt-0">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Filter className="h-3.5 w-3.5" /> Filters
                    </div>
                    <Select
                      value={requestsStatusFilter}
                      onValueChange={(value: LocationStatus | "all") => {
                        setRequestsStatusFilter(value);
                        setRequestsPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 sm:w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="AWAITING_ADMIN_REVIEW">Pending Review</SelectItem>
                        <SelectItem value="NEEDS_MORE_INFO">Needs More Info</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="CANCELLED_BY_BUSINESS">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={requestsSortByString}
                      onValueChange={(value) => {
                        const [column, direction] = value.split(":");
                        setRequestsSort({
                          column: column as string,
                          direction: direction as "ASC" | "DESC",
                        });
                        setRequestsPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 sm:w-[180px]">
                        <SelectValue placeholder="Sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt:DESC">Newest first</SelectItem>
                        <SelectItem value="createdAt:ASC">Oldest first</SelectItem>
                        <SelectItem value="name:ASC">Name A → Z</SelectItem>
                        <SelectItem value="name:DESC">Name Z → A</SelectItem>
                        <SelectItem value="status:ASC">Status A → Z</SelectItem>
                        <SelectItem value="status:DESC">Status Z → A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search requests..."
                      value={requestsSearchTerm}
                      onChange={(e) => {
                        setRequestsSearchTerm(e.target.value);
                        setRequestsPage(1);
                      }}
                      className="h-8 sm:w-[240px]"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setRequestsSearchTerm("");
                        setRequestsStatusFilter("all");
                        setRequestsSort({
                          column: "createdAt",
                          direction: "DESC",
                        });
                        setRequestsPage(1);
                      }}
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {locationRequests.length} of {requestsMeta?.totalItems ?? locationRequests.length} requests
                </div>
              </div>

              {locationRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-8 text-center">
                  <div className="text-lg font-semibold">
                    No requests found for your filters
                  </div>
                  <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                    Try adjusting your filters or submit a new location request to get started.
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/dashboard/business/locations/create">
                      <PlusCircle className="mr-2 h-3.5 w-3.5" />
                      Submit a location
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border/60">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">
                        Location Name
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">
                        Description
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRequestsSort("createdAt")}
                          className="h-auto p-0 font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                        >
                          Submitted At <RequestsSortIcon column="createdAt" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground py-2">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="border-b border-border/40 transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium text-sm py-2.5">
                          {request.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5">
                          <div className="line-clamp-2 max-w-[300px]">
                            {request.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2.5">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge
                            className={cn("text-xs", {
                              "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400":
                                request.status === "AUTO_VALIDATING",
                              "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400":
                                request.status === "AWAITING_ADMIN_REVIEW" ||
                                request.status === "NEEDS_MORE_INFO",
                              "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400":
                                request.status === "APPROVED",
                              "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400":
                                request.status === "REJECTED",
                              "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400":
                                request.status === "CANCELLED_BY_BUSINESS",
                            })}
                          >
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2.5">
                          <RequestActions
                            requestId={request.id}
                            status={request.status}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {requestsMeta?.currentPage ?? requestsPage} of {requestsMeta?.totalPages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setRequestsPage((page) => Math.max(1, page - 1))}
                    disabled={!requestsMeta || requestsMeta.currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setRequestsPage((page) => page + 1)}
                    disabled={
                      !requestsMeta ||
                      requestsMeta.currentPage >= requestsMeta.totalPages
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

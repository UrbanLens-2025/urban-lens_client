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
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";

import { useMyLocations, useLocationRequests } from "@/hooks/locations/useMyLocations";
import { Location, LocationRequest, LocationStatus, SortState } from "@/types";
import { useCancelLocationRequest } from "@/hooks/locations/useCancelLocationRequest";

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
import { cn } from "@/lib/utils";

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
  const [activeTab, setActiveTab] = useState<"locations" | "requests">("locations");
  
  // Active Locations state
  const [activePage, setActivePage] = useState(1);
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>(sortOptions[0].value);
  const [visibleFilter, setVisibleFilter] = useState<"all" | "visible" | "hidden">("all");
  const [debouncedSearchTerm] = useDebounce(activeSearchTerm, 300);

  // Requests state
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsSort, setRequestsSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });
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
    useLocationRequests(requestsPage, requestsSortByString);

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
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/dashboard/business/locations/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Submit New Location
          </Button>
        </Link>
      </div>

      {activeTab === "locations" && (
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
      )}

      <Card className="border-border/60 shadow-sm">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "locations" | "requests")}>
          <CardHeader className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <TabsList className="grid w-full max-w-md grid-cols-2 lg:w-auto">
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Active Locations
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Requests
                  {requestsMeta?.totalItems ? (
                    <Badge variant="secondary" className="ml-1">
                      {requestsMeta.totalItems}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="locations" className="space-y-6 mt-0">
              <div className="space-y-6">
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
              </div>

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
            </TabsContent>

            <TabsContent value="requests" className="space-y-6 mt-0">
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Location Requests ({requestsMeta?.totalItems || 0})
                  </CardTitle>
                  <CardDescription>
                    Track and manage your location submission requests.
                  </CardDescription>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/60">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Location Name
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Description
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRequestsSort("createdAt")}
                          className="h-auto p-0 font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                        >
                          Submitted At <RequestsSortIcon column="createdAt" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationRequests.length > 0 ? (
                      locationRequests.map((request) => (
                        <TableRow
                          key={request.id}
                          className="border-b border-border/40 transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="font-medium">
                            {request.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {request.description}
                          </TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn({
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
                          <TableCell className="text-right">
                            <RequestActions
                              requestId={request.id}
                              status={request.status}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <div className="text-lg font-semibold">No requests found</div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Submit a new location to get started.
                            </p>
                            <Button asChild className="mt-4">
                              <Link href="/dashboard/business/locations/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Submit New Location
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {requestsMeta?.currentPage ?? requestsPage} of {requestsMeta?.totalPages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestsPage((page) => Math.max(1, page - 1))}
                    disabled={!requestsMeta || requestsMeta.currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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

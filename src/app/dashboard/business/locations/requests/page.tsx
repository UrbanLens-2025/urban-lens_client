/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  Loader2,
  Eye,
  ArrowUp,
  ArrowDown,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  Search,
} from "lucide-react";

import { useLocationRequests } from "@/hooks/locations/useMyLocations";
import { LocationRequest, LocationStatus, SortState } from "@/types";
import { useCancelLocationRequest } from "@/hooks/locations/useCancelLocationRequest";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 hover:bg-muted/80 transition-colors"
        asChild
      >
        <Link href={`/dashboard/business/locations/requests/${requestId}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>

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

export default function MyLocationRequestsPage() {
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsSearchTerm, setRequestsSearchTerm] = useState("");
  const [requestsStatusFilter, setRequestsStatusFilter] = useState<LocationStatus | "all">("all");
  const [requestsSort, setRequestsSort] = useState<SortState>({
    column: "createdAt",
    direction: "DESC",
  });
  const [debouncedRequestsSearch] = useDebounce(requestsSearchTerm, 300);
  const requestsSortByString = `${requestsSort.column}:${requestsSort.direction}`;

  const { data: requestsResponse, isLoading: isLoadingRequests } =
    useLocationRequests(requestsPage, requestsSortByString, {
      search: debouncedRequestsSearch,
      status: requestsStatusFilter === "all" ? undefined : requestsStatusFilter,
      searchBy: ["name", "description", "addressLine"],
    });

  const locationRequests: LocationRequest[] = requestsResponse?.data || [];
  const requestsMeta = requestsResponse?.meta;

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

  if (isLoadingRequests) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{requestStats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all pages
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{requestStats.awaitingReview.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This page only
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs More Info</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{requestStats.needsMoreInfo.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This page only
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{requestStats.approved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This page only
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected/Cancelled</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{requestStats.rejectedOrCancelled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This page only
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm py-0 gap-0">
        <CardContent className="pt-4 pb-0 px-0">
          <div className="space-y-3 mt-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-6 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search requests..."
                  value={requestsSearchTerm}
                  onChange={(e) => {
                    setRequestsSearchTerm(e.target.value);
                    setRequestsPage(1);
                  }}
                  className="h-8 pl-10 pr-4 w-full"
                />
              </div>
              <Select
                value={requestsStatusFilter}
                onValueChange={(value: LocationStatus | "all") => {
                  setRequestsStatusFilter(value);
                  setRequestsPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-full sm:w-[300px]">
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
            </div>
          </div>

          {locationRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-8 text-center mx-6 my-6">
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border/60 hover:bg-muted/50">
                    <TableHead className="w-12 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 pl-6">#</TableHead>
                    <TableHead className="min-w-[200px] max-w-[280px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                      Location Name
                    </TableHead>
                    <TableHead className="min-w-[150px] max-w-[250px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                      Description
                    </TableHead>
                    <TableHead className="min-w-[150px] max-w-[220px] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3">
                      Address
                    </TableHead>
                    <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRequestsSort("createdAt")}
                        className="h-auto p-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-transparent mx-auto"
                      >
                        Submitted At <RequestsSortIcon column="createdAt" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 w-[130px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationRequests.map((request, index) => (
                    <TableRow
                      key={request.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/30"
                    >
                      <TableCell className="text-xs text-muted-foreground font-medium py-4 pl-6">
                        {((requestsMeta?.currentPage ?? requestsPage) - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell className="py-4">
                        <Link
                          href={`/dashboard/business/locations/requests/${request.id}`}
                          className="group cursor-pointer hover:underline"
                        >
                          <div className="flex items-center gap-3">
                            {request.locationImageUrls && request.locationImageUrls.length > 0 ? (
                              <div className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden border border-border">
                                <Image
                                  src={request.locationImageUrls[0]}
                                  alt={request.name}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted border border-border flex items-center justify-center">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                              {request.name}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-4">
                        <div className="line-clamp-2 max-w-[200px]">
                          {request.description}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-4">
                        <div className="truncate max-w-[180px]">{request.addressLine}</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/80 truncate mt-0.5 max-w-[180px]">
                          {request.addressLevel2}, {request.addressLevel1}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-4 text-center">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={cn("text-xs font-medium px-2 py-0.5", {
                            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800":
                              request.status === "AUTO_VALIDATING",
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800":
                              request.status === "AWAITING_ADMIN_REVIEW" ||
                              request.status === "NEEDS_MORE_INFO",
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800":
                              request.status === "APPROVED",
                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800":
                              request.status === "REJECTED",
                            "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800":
                              request.status === "CANCELLED_BY_BUSINESS",
                          })}
                          variant="outline"
                        >
                          {request.status === "AWAITING_ADMIN_REVIEW" && "Pending Review"}
                          {request.status === "NEEDS_MORE_INFO" && "Needs Info"}
                          {request.status === "APPROVED" && "Approved"}
                          {request.status === "REJECTED" && "Rejected"}
                          {request.status === "CANCELLED_BY_BUSINESS" && "Cancelled"}
                          {request.status === "AUTO_VALIDATING" && "Validating"}
                          {!["AWAITING_ADMIN_REVIEW", "NEEDS_MORE_INFO", "APPROVED", "REJECTED", "CANCELLED_BY_BUSINESS", "AUTO_VALIDATING"].includes(request.status) && request.status}
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
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Loader2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { useOwnerLocationBookings } from "@/hooks/locations/useOwnerLocationBookings";
import Link from "next/link";
import { format } from "date-fns";
import {
  PageHeader,
  PageContainer,
  TableFilters,
  SortableTableHeader,
  type SortDirection,
} from "@/components/shared";

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PAYMENT_RECEIVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Payment Received
        </Badge>
      );
    case "AWAITING_BUSINESS_PROCESSING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Processing
        </Badge>
      );
    case "SOFT_LOCKED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Soft Locked
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || status}
        </Badge>
      );
  }
};

const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
};

const formatBookingDateRange = (dates: { startDateTime: string; endDateTime: string }[]) => {
  if (!dates || dates.length === 0) return { from: "N/A", to: "N/A" };
  
  // Find the earliest startDateTime and latest endDateTime
  const startDates = dates.map(d => new Date(d.startDateTime));
  const endDates = dates.map(d => new Date(d.endDateTime));
  
  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
  const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
  
  return {
    from: format(earliestStart, "MMM dd, yyyy"),
    to: format(latestEnd, "MMM dd, yyyy")
  };
};

const calculateTotalHours = (dates: { startDateTime: string; endDateTime: string }[]) => {
  if (!dates || dates.length === 0) return 0;
  
  let totalMilliseconds = 0;
  dates.forEach(date => {
    const start = new Date(date.startDateTime);
    const end = new Date(date.endDateTime);
    totalMilliseconds += (end.getTime() - start.getTime());
  });
  
  // Convert milliseconds to hours
  const totalHours = totalMilliseconds / (1000 * 60 * 60);
  return Math.round(totalHours); // Round to integer
};

// Component for booking row
function BookingRow({
  booking,
  index,
  page,
  meta,
}: {
  booking: any;
  index: number;
  page: number;
  meta?: any;
}) {
  return (
    <TableRow className="border-b transition-colors hover:bg-muted/30 border-border/40">
      <TableCell className="text-xs text-muted-foreground font-medium py-4 pl-6">
        {((meta?.currentPage ?? page) - 1) * 10 + index + 1}
      </TableCell>
      <TableCell className="py-4">
        <Link
          href={`/dashboard/business/location-bookings/${booking.id}`}
          className="group cursor-pointer hover:underline"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium group-hover:text-primary transition-colors">
              {booking.createdBy.firstName} {booking.createdBy.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {booking.createdBy.email}
            </span>
          </div>
        </Link>
      </TableCell>
      <TableCell className="py-4">
        <span className="text-sm font-semibold leading-tight truncate">
          {booking.referencedEventRequest?.eventName || "N/A"}
        </span>
      </TableCell>
      <TableCell className="py-4">
        <span className="text-sm font-semibold leading-tight truncate">
          {booking.location.name}
        </span>
      </TableCell>
      <TableCell className="py-4">
        {(() => {
          const dateRange = formatBookingDateRange(booking.dates);
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium text-foreground">{dateRange.from}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium text-foreground">{dateRange.to}</span>
              </div>
            </div>
          );
        })()}
      </TableCell>
      <TableCell className="py-4">
        <div className="text-sm font-medium">
          {calculateTotalHours(booking.dates)} hrs
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="text-sm font-semibold text-emerald-600">
          {formatCurrency(booking.amountToPay)}
        </div>
      </TableCell>
      <TableCell className="py-4">
        {getStatusBadge(booking.status)}
      </TableCell>
    </TableRow>
  );
}

export default function LocationBookingsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<{ column: string; direction: SortDirection }>({
    column: "createdAt",
    direction: "DESC",
  });
  const [debouncedSearchTerm] = useDebounce(search, 300);

  const sortBy = sort.direction 
    ? `${sort.column}:${sort.direction}` 
    : "createdAt:DESC";

  const { data: bookingsData, isLoading } = useOwnerLocationBookings({
    page,
    limit: 10,
    search: debouncedSearchTerm || undefined,
    sortBy,
    status: statusFilter,
  });

  const bookings = bookingsData?.data || [];
  const meta = bookingsData?.meta;

  const stats = {
    totalBookings: meta?.totalItems ?? 0,
    paymentReceived: bookings.filter(
      (b) => b.status?.toUpperCase() === "PAYMENT_RECEIVED"
    ).length,
    awaitingProcessing: bookings.filter(
      (b) => b.status?.toUpperCase() === "AWAITING_BUSINESS_PROCESSING"
    ).length,
    totalRevenue: bookings
      .filter((b) => b.status?.toUpperCase() === "PAYMENT_RECEIVED")
      .reduce((sum, b) => sum + parseFloat(b.amountToPay || "0"), 0),
  };

  const handleSort = (column: string, direction: SortDirection) => {
    setSort({ column, direction });
    setPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (debouncedSearchTerm) count++;
    return count;
  }, [statusFilter, debouncedSearchTerm]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setSort({ column: "createdAt", direction: "DESC" });
    setPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Location Bookings"
        description="Manage and track all bookings for your locations"
        icon={CalendarDays}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All location bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{stats.paymentReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Payment received
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.awaitingProcessing.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting your action
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats.totalRevenue.toString())}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From confirmed bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card className="overflow-hidden border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
        <CardContent className="pb-0 px-0">
          {/* Filters */}
          <TableFilters
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="Search by event name, location, or creator..."
            filters={[
              {
                key: "status",
                label: "Status",
                value: statusFilter,
                options: [
                  { value: "ALL", label: "All statuses" },
                  { value: "AWAITING_BUSINESS_PROCESSING", label: "Awaiting Processing" },
                  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
                  { value: "SOFT_LOCKED", label: "Soft Locked" },
                  { value: "CANCELLED", label: "Cancelled" },
                ],
                onValueChange: (value: string) => {
                  setStatusFilter(value);
                  setPage(1);
                },
              },
            ]}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted py-12 text-center">
              <div className="text-lg font-semibold">No bookings found</div>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Try adjusting your filters or wait for new bookings.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border/60 hover:bg-muted/50">
                      <TableHead className="w-12 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground py-3 pl-6">#</TableHead>
                      <SortableTableHeader
                        column="referencedEventRequest.eventName"
                        currentSort={sort}
                        onSort={handleSort}
                        className="min-w-[180px] max-w-[220px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3"
                      >
                        Requested By
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="referencedEventRequest.eventName"
                        currentSort={sort}
                        onSort={handleSort}
                        className="min-w-[180px] max-w-[220px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3"
                      >
                        Event Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="location.name"
                        currentSort={sort}
                        onSort={handleSort}
                        className="min-w-[200px] max-w-[280px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3"
                      >
                        Location Name
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="createdAt"
                        currentSort={sort}
                        onSort={handleSort}
                        className="min-w-[180px] max-w-[250px] text-left text-xs uppercase tracking-wide text-muted-foreground py-3"
                      >
                        Booking Date
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="totalHours"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-left text-xs uppercase tracking-wide text-muted-foreground py-3 w-[120px]"
                      >
                        Total Hours Booked
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="amountToPay"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-left text-xs uppercase tracking-wide text-muted-foreground py-3 w-[140px]"
                      >
                        Amount to Pay
                      </SortableTableHeader>
                      <SortableTableHeader
                        column="status"
                        currentSort={sort}
                        onSort={handleSort}
                        className="text-left text-xs uppercase tracking-wide text-muted-foreground py-3 w-[130px]"
                      >
                        Status
                      </SortableTableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking, index) => (
                      <BookingRow
                        key={booking.id}
                        booking={booking}
                        index={index}
                        page={page}
                        meta={meta}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-2 border-t pt-3 pb-3 px-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Page {meta?.currentPage ?? page} of {meta?.totalPages ?? 1}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta || meta.currentPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() =>
                      setPage((p) =>
                        meta ? Math.min(meta.totalPages, p + 1) : p + 1
                      )
                    }
                    disabled={!meta || meta.currentPage >= meta.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}


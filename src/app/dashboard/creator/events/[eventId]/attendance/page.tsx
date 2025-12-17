"use client";

import type React from "react";
import { use, useState } from "react";
import { useEventAttendance } from "@/hooks/events/useEventAttendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Users,
  Ticket,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

export default function EventAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked_in" | "not_checked_in">("all");
  const limit = 20;

  const {
    data: attendanceData,
    isLoading: isLoadingAttendance,
    isError,
  } = useEventAttendance(eventId, {
    page: currentPage,
    limit,
    sortBy: "createdAt:DESC",
  });

  const formatDateTime = (iso: string) => {
    return format(new Date(iso), "MMM dd, yyyy 'at' h:mm a");
  };

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getOrderStatusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PAID" || s === "COMPLETED") return "default" as const;
    if (s === "PENDING" || s === "PROCESSING") return "secondary" as const;
    if (s === "CANCELLED" || s === "REFUNDED") return "destructive" as const;
    return "outline" as const;
  };

  const getAttendanceStatusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "CONFIRMED" || s === "CHECKED_IN") return "default" as const;
    if (s === "CREATED" || s === "PENDING") return "secondary" as const;
    if (s === "CANCELLED") return "destructive" as const;
    return "outline" as const;
  };

  const getAttendanceStatusLabel = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "CREATED") return "Not Checked In";
    return status;
  };

  if (isLoadingAttendance) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !attendanceData) {
    return (
      <div className="text-center py-20 text-red-500">
        <p className="font-medium">Error loading attendance data</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  const { data: attendances, meta } = attendanceData;

  // Helper: determine if an attendance record is considered checked in
  const isAttendanceCheckedIn = (status?: string) => {
    const s = status?.toUpperCase();
    return s === "ATTENDED" || s === "CHECKED_IN" || s === "CONFIRMED";
  };

  // Filter at attendance level (per ticket/person)
  const filteredAttendances = attendances.filter((attendance) => {
    const fullName = `${attendance.order.createdBy.firstName} ${attendance.order.createdBy.lastName}`.toLowerCase();
    const email = attendance.order.createdBy.email?.toLowerCase() || "";
    const orderNumber = attendance.order.orderNumber?.toLowerCase() || "";
    const query = searchQuery.toLowerCase().trim();

    const matchesQuery =
      !query ||
      fullName.includes(query) ||
      email.includes(query) ||
      orderNumber.includes(query);

    const isCheckedIn = isAttendanceCheckedIn(attendance.status);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "checked_in" && isCheckedIn) ||
      (statusFilter === "not_checked_in" && !isCheckedIn);

    return matchesQuery && matchesStatus;
  });

  // Group filtered attendances by order so one row represents one purchase
  const groupedByOrder = Object.values(
    filteredAttendances.reduce((acc: Record<string, { order: any; attendances: any[] }>, attendance) => {
      const orderId = attendance.order.id;
      if (!acc[orderId]) {
        acc[orderId] = { order: attendance.order, attendances: [] };
      }
      acc[orderId].attendances.push(attendance);
      return acc;
    }, {})
  );

  // High-level stats (use all attendances, not just filtered)
  const totalOrders = new Set(attendances.map((a) => a.order.id)).size;

  const totalCheckedIn = attendances.reduce((sum, attendance) => {
    const isCheckedIn = isAttendanceCheckedIn(attendance.status);
    const count = attendance.numberOfAttendees ?? 1;
    return sum + (isCheckedIn ? count : 0);
  }, 0);

  const totalRevenue = attendances.reduce(
    (sum, attendance) =>
      sum + (attendance.order.status?.toUpperCase() === "PAID"
        ? parseFloat(attendance.order.totalPaymentAmount || "0")
        : 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor check-ins, orders, and revenue for this event in real time.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="text-xs text-muted-foreground text-right sm:text-left">
            <div>Total orders: <span className="font-medium text-foreground">{totalOrders}</span></div>
            <div>
              Revenue (paid):{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(totalRevenue, "VND")}
              </span>
            </div>
          </div>
          <Link href={`/dashboard/creator/events/${eventId}/attendance/scan`}>
            <Button variant="default" size="lg" className="w-full sm:w-auto">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR Code
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendee List
            </CardTitle>
            <Badge variant="outline" className="text-xs px-2 py-1">
              {groupedByOrder.length} shown
            </Badge>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Search by name, email or order number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-3"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: "all" | "checked_in" | "not_checked_in") => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="checked_in">Checked in / confirmed</SelectItem>
                <SelectItem value="not_checked_in">Not checked in yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {groupedByOrder.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {attendances.length === 0 ? "No attendees yet" : "No attendees match your filters"}
              </p>
              <p className="text-sm mt-1">
                {attendances.length === 0
                  ? "Attendees will appear here once tickets are purchased."
                  : "Try clearing the search or changing the status filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tickets</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedByOrder.map(({ order, attendances: groupedAttendances }) => {
                    const totalTickets = order.orderDetails.reduce(
                      (sum: number, detail: any) => sum + detail.quantity,
                      0
                    );

                    const totalUnits = groupedAttendances.reduce(
                      (sum: number, a: any) => sum + (a.numberOfAttendees ?? 1),
                      0
                    );

                    const checkedInUnits = groupedAttendances.reduce(
                      (sum: number, a: any) => {
                        const isChecked = isAttendanceCheckedIn(a.status);
                        const count = a.numberOfAttendees ?? 1;
                        return sum + (isChecked ? count : 0);
                      },
                      0
                    );

                    const orderStatusLabel =
                      totalUnits === 0
                        ? "No attendees"
                        : checkedInUnits === 0
                        ? "Not Checked In"
                        : checkedInUnits === totalUnits
                        ? "All Checked In"
                        : `${checkedInUnits} / ${totalUnits} Checked In`;

                    const statusVariant = (() => {
                      if (checkedInUnits === 0) return "secondary" as const;
                      if (checkedInUnits === totalUnits) return "default" as const;
                      return "outline" as const;
                    })();

                    const ticketsSummary = order.orderDetails
                      .map((detail: any) => {
                        const name =
                          detail.ticketSnapshot?.displayName ||
                          detail.ticket?.displayName ||
                          "Unknown Ticket";
                        return `${name}`;
                      })
                      .join(", ");

                    return (
                    <TableRow key={order.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
                            {order.orderNumber.slice(0, 16)}...
                          </div>
                          {order.referencedTransactionId && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-mono">
                                {order.referencedTransactionId.slice(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.createdBy.avatarUrl ? (
                            <Image
                              src={order.createdBy.avatarUrl}
                              alt={order.createdBy.firstName}
                              width={32}
                              height={32}
                              className="rounded-full border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {order.createdBy.firstName}{" "}
                              {order.createdBy.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{order.createdBy.email}</span>
                          </div>
                          {order.createdBy.phoneNumber && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{order.createdBy.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {ticketsSummary}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalTickets} ticket{totalTickets !== 1 ? "s" : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(
                            order.totalPaymentAmount,
                            order.currency
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant}
                          className="w-fit text-xs"
                        >
                          {orderStatusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * limit) + 1} to{" "}
                {Math.min(currentPage * limit, meta.totalItems)} of{" "}
                {meta.totalItems} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {meta.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={currentPage === meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


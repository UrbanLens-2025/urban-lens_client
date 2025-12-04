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
  const totalAttendees = attendances.reduce(
    (sum, attendance) =>
      sum +
      attendance.order.orderDetails.reduce(
        (detailSum, detail) => detailSum + detail.quantity,
        0
      ),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header with QR Scan Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View all attendees and ticket purchases
          </p>
        </div>
        <Link href={`/dashboard/creator/events/${eventId}/attendance/scan`}>
          <Button variant="default" size="lg">
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR Code
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Attendees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {meta.totalItems} order{meta.totalItems !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendances.length > 0
                ? formatCurrency(
                    attendances.reduce(
                      (sum, attendance) =>
                        sum + parseFloat(attendance.order.totalPaymentAmount || "0"),
                      0
                    ),
                    attendances[0]?.order.currency || "VND"
                  )
                : formatCurrency(0, "VND")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Paid Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                attendances.filter(
                  (a) => a.order.status?.toUpperCase() === "PAID"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {meta.totalItems} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendee List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No attendees yet</p>
              <p className="text-sm mt-1">
                Attendees will appear here once tickets are purchased
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
                  {attendances.map((attendance) => (
                    <TableRow key={attendance.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
                            {attendance.order.orderNumber}
                          </div>
                          {attendance.order.referencedTransactionId && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-mono">
                                {attendance.order.referencedTransactionId.slice(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {attendance.order.createdBy.avatarUrl ? (
                            <Image
                              src={attendance.order.createdBy.avatarUrl}
                              alt={attendance.order.createdBy.firstName}
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
                              {attendance.order.createdBy.firstName}{" "}
                              {attendance.order.createdBy.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="text-xs">{attendance.order.createdBy.email}</span>
                          </div>
                          {attendance.order.createdBy.phoneNumber && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs">{attendance.order.createdBy.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {attendance.order.orderDetails.map((detail) => (
                            <div key={detail.id} className="text-sm">
                              <div className="font-medium">
                                {detail.ticketSnapshot.displayName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Qty: {detail.quantity} × {formatCurrency(detail.unitPrice, detail.currency)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {formatCurrency(
                            attendance.order.totalPaymentAmount,
                            attendance.order.currency
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getOrderStatusVariant(attendance.order.status)} className="w-fit text-xs">
                            {attendance.order.status}
                          </Badge>
                          <Badge
                            variant={getAttendanceStatusVariant(attendance.status)}
                            className="w-fit text-xs"
                          >
                            {attendance.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(attendance.order.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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


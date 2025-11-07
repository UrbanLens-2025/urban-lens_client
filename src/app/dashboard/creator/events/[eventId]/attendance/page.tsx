"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventAttendance } from "@/hooks/events/useEventAttendance";
import { useEventById } from "@/hooks/events/useEventById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Users,
  Ticket,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
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
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { data: event, isLoading: isLoadingEvent } = useEventById(eventId);
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

  const isLoading = isLoadingEvent || isLoadingAttendance;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !attendanceData) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading attendance data</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Event Attendance
              {event && (
                <span className="text-xl font-normal text-muted-foreground ml-2">
                  - {event.displayName}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all attendees and ticket purchases
            </p>
          </div>
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
            <div className="space-y-6">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="border rounded-lg p-4 space-y-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          Order: {attendance.order.orderNumber}
                        </h3>
                        <Badge variant={getOrderStatusVariant(attendance.order.status)}>
                          {attendance.order.status}
                        </Badge>
                        <Badge
                          variant={getAttendanceStatusVariant(attendance.status)}
                          className="ml-2"
                        >
                          {attendance.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateTime(attendance.order.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(
                            attendance.order.totalPaymentAmount,
                            attendance.order.currency
                          )}
                        </div>
                        {attendance.order.referencedTransactionId && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            <span className="font-mono text-xs">
                              {attendance.order.referencedTransactionId.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {attendance.order.createdBy.avatarUrl ? (
                        <Image
                          src={attendance.order.createdBy.avatarUrl}
                          alt={attendance.order.createdBy.firstName}
                          width={48}
                          height={48}
                          className="rounded-full border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">
                          {attendance.order.createdBy.firstName}{" "}
                          {attendance.order.createdBy.lastName}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {attendance.order.createdBy.email}
                          </div>
                          {attendance.order.createdBy.phoneNumber && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {attendance.order.createdBy.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details / Tickets */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Tickets Purchased
                    </h4>
                    <div className="space-y-2">
                      {attendance.order.orderDetails.map((detail) => (
                        <div
                          key={detail.id}
                          className="flex items-start gap-4 p-3 bg-background border rounded-lg"
                        >
                          {detail.ticket.imageUrl && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                              <Image
                                src={detail.ticket.imageUrl}
                                alt={detail.ticketSnapshot.displayName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="font-semibold">
                                  {detail.ticketSnapshot.displayName}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {detail.ticketSnapshot.description}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Ticket className="h-3 w-3" />
                                    Quantity: {detail.quantity}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(
                                      detail.unitPrice,
                                      detail.currency
                                    )}{" "}
                                    each
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Subtotal:{" "}
                                    {formatCurrency(
                                      detail.subTotal,
                                      detail.currency
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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


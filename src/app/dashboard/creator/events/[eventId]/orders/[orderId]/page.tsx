"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEventOrder } from "@/hooks/events/useEventOrder";
import { PageContainer, PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ShoppingCart,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string; orderId: string }>;
}) {
  const { eventId, orderId } = use(params);
  const router = useRouter();

  const { data: order, isLoading, isError } = useEventOrder(eventId, orderId);

  const formatCurrency = (amount: string | number, currency: string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(num);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDateTime = (iso: string) => {
    return format(new Date(iso), "MMM dd, yyyy 'at' h:mm a");
  };

  const getOrderStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PAID" || s === "COMPLETED") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    }
    if (s === "PENDING" || s === "PROCESSING") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    if (s === "CANCELLED" || s === "REFUNDED") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3 mr-1" />
          {s === "REFUNDED" ? "Refunded" : "Cancelled"}
        </Badge>
      );
    }
    return <Badge>{status}</Badge>;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !order) {
    return (
      <PageContainer>
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading order details</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </PageContainer>
    );
  }

  const totalTickets = order.orderDetails.reduce(
    (acc, detail) => acc + detail.quantity,
    0
  );

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed on ${formatDateTime(order.createdAt)}`}
        icon={ShoppingCart}
        actions={
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Order Status */}
        <div className="flex items-center gap-3">
          {getOrderStatusBadge(order.status)}
          {order.refundedAt && (
            <Badge variant="outline" className="text-destructive">
              Refunded on {formatDateTime(order.refundedAt)}
            </Badge>
          )}
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-4">
                  {order.orderDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex gap-4 p-4 rounded-lg border bg-card"
                    >
                      {detail.ticketSnapshot?.imageUrl && (
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0">
                          <Image
                            src={detail.ticketSnapshot.imageUrl}
                            alt={detail.ticketSnapshot.displayName || "Ticket"}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg mb-1">
                          {detail.ticketSnapshot?.displayName || "Ticket"}
                        </h3>
                        {detail.ticketSnapshot?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {detail.ticketSnapshot.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Quantity: <span className="font-medium">{detail.quantity}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Unit Price
                            </div>
                            <div className="font-semibold">
                              {formatCurrency(detail.unitPrice, detail.currency)}
                            </div>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Subtotal</span>
                          <span className="font-bold">
                            {formatCurrency(detail.subTotal, detail.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between text-lg font-bold pt-2">
                  <span>Total Amount</span>
                  <span className="text-primary">
                    {formatCurrency(order.totalPaymentAmount, order.currency)}
                  </span>
                </div>

                {/* {order.refundedAmount && order.refundedAmount > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-destructive">
                      <span>Refunded Amount</span>
                      <span className="font-semibold">
                        -{formatCurrency(order.refundedAmount, order.currency)}
                      </span>
                    </div>
                  </>
                )} */}
              </CardContent>
            </Card>

            {/* Payment Information */}
            {order.referencedTransaction && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Transaction ID
                    </span>
                    <span className="text-sm font-mono">
                      {order.referencedTransaction.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        order.referencedTransaction.status === "COMPLETED"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {order.referencedTransaction.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(
                        order.referencedTransaction.amount,
                        order.referencedTransaction.currency
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Date
                    </span>
                    <span className="text-sm">
                      {formatDateTime(order.referencedTransaction.createdAt)}
                    </span>
                  </div>
                  {order.referencedTransaction.note && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {order.referencedTransaction.note}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Event Attendance */}
            {order.eventAttendances && order.eventAttendances.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Event Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.eventAttendances.map((attendance) => {
                      const status = attendance.status?.toUpperCase();
                      const isCheckedIn = status === "CHECKED_IN";
                      const isCancelled = status === "CANCELLED";

                      return (
                        <div
                          key={attendance.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            {isCheckedIn ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isCancelled ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                            <div>
                              <div className="font-medium">
                                {attendance.numberOfAttendees} attendee
                                {attendance.numberOfAttendees !== 1 ? "s" : ""}
                              </div>
                              {attendance.checkedInAt && (
                                <div className="text-xs text-muted-foreground">
                                  Checked in: {formatDateTime(attendance.checkedInAt)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              isCheckedIn
                                ? "default"
                                : isCancelled
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {isCheckedIn
                              ? "Checked in"
                              : isCancelled
                              ? "Cancelled"
                              : "Not checked in"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {order.createdBy.avatarUrl && (
                      <AvatarImage
                        src={order.createdBy.avatarUrl}
                        alt={`${order.createdBy.firstName} ${order.createdBy.lastName}`}
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(
                        order.createdBy.firstName || "",
                        order.createdBy.lastName || ""
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {order.createdBy.firstName} {order.createdBy.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.createdBy.email}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{order.createdBy.email}</span>
                  </div>
                  {order.createdBy.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">
                        {order.createdBy.phoneNumber}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-mono font-medium">
                    {order.orderNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Tickets</span>
                  <span className="font-semibold">{totalTickets}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Placed On</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                {order.updatedAt !== order.createdAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{formatDateTime(order.updatedAt)}</span>
                  </div>
                )}
                {order.refundedAt && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-sm text-destructive">
                      <span>Refunded On</span>
                      <span>{formatDateTime(order.refundedAt)}</span>
                    </div>
                    {order.refundReason && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Refund Reason:
                        </p>
                        <p className="text-sm">{order.refundReason}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Event Information */}
            {(order as any).event && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(order as any).event.avatarUrl && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                        <Image
                          src={(order as any).event.avatarUrl}
                          alt={(order as any).event.displayName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 300px"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold mb-1">
                        {(order as any).event.displayName}
                      </h3>
                      {(order as any).event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {(order as any).event.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        router.push(
                          `/dashboard/creator/events/${(order as any).event.id}`
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}


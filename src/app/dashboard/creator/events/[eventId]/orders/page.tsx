"use client";

import { use, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useEventOrders } from "@/hooks/events/useEventOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShoppingCart,
  Search,
  User,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { format } from "date-fns";

export default function EventOrdersPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 20;

  // Reset to page 1 when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  const {
    data: ordersData,
    isLoading,
    isError,
  } = useEventOrders(eventId, {
    page: currentPage,
    limit,
    sortBy: "createdAt:DESC",
    search: debouncedSearchQuery.trim() || undefined,
    searchBy: debouncedSearchQuery.trim()
      ? ["orderNumber", "createdBy.firstName", "createdBy.lastName", "createdBy.email"]
      : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

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

  const getOrderStatusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PAID" || s === "COMPLETED") return "default" as const;
    if (s === "PENDING" || s === "PROCESSING") return "secondary" as const;
    if (s === "CANCELLED" || s === "REFUNDED") return "destructive" as const;
    return "outline" as const;
  };

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.meta?.totalPages || 1;
  const totalItems = ordersData?.meta?.totalItems || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-500">
        <p className="font-medium">Error loading orders</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {(searchQuery || statusFilter !== "all") && (
            <div className="text-sm text-muted-foreground">
              Showing {orders.length} of {totalItems} order{totalItems !== 1 ? "s" : ""}
            </div>
          )}

          {/* Orders Table */}
          {orders.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-muted/10">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Orders will appear here once customers purchase tickets"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order, index) => (
                      <TableRow key={order.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          {(currentPage - 1) * limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm truncate max-w-[200px]">
                            {order.orderNumber}
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
                                <span className="text-xs">
                                  {order.createdBy.phoneNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.orderDetails.map((detail) => (
                              <div key={detail.id} className="text-sm">
                                <div className="font-medium">
                                  {detail.ticketSnapshot?.displayName ||
                                    detail.ticket?.displayName ||
                                    "Unknown Ticket"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Qty: {detail.quantity} ×{" "}
                                  {formatCurrency(
                                    detail.unitPrice,
                                    detail.currency
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {formatCurrency(
                              order.totalPaymentAmount,
                              order.currency
                            )}
                          </div>
                          {((order.status === "REFUNDED" || order.refundedAt) && order.refundedAmount && order.refundedAmount > 0) ? (
                            <div className="text-xs text-destructive">
                              Refunded: {formatCurrency(order.refundedAmount, order.currency)}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {order.refundReason ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Badge
                                      variant={getOrderStatusVariant(order.status)}
                                      className="w-fit text-xs"
                                    >
                                      {order.status}
                                    </Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{order.refundReason}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge
                              variant={getOrderStatusVariant(order.status)}
                              className="w-fit text-xs"
                            >
                              {order.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDateTime(order.createdAt)}</span>
                            </div>
                            {(order.status === "REFUNDED" || order.refundedAt) && order.refundedAt && (
                              <div className="text-xs text-destructive">
                                Refunded: {formatDateTime(order.refundedAt)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

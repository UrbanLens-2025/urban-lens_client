"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Ticket as TicketIcon,
  ImageIcon,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  TrendingUp,
  Users,
  ShoppingCart,
  FileText,
  Hash,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketId: string }>;
}) {
  const { eventId, ticketId } = use(params);
  const router = useRouter();
  const { data: tickets, isLoading } = useEventTickets(eventId);
  
  const ticket = tickets?.find(t => t.id === ticketId);

  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    if (currency === "VND") {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(num);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "PPP 'at' p");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <XCircle className="h-16 w-16 text-destructive/50" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Ticket Not Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The ticket you're looking for doesn't exist or has been deleted.
          </p>
        </div>
        <Button onClick={() => router.push(`/dashboard/creator/events/${eventId}/tickets`)}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  const availableQuantity = ticket.totalQuantityAvailable - ticket.quantityReserved;
  const availabilityPercentage = ticket.totalQuantityAvailable > 0 
    ? (availableQuantity / ticket.totalQuantityAvailable) * 100 
    : 0;
  const soldQuantity = ticket.quantityReserved;
  const soldPercentage = ticket.totalQuantityAvailable > 0 
    ? (soldQuantity / ticket.totalQuantityAvailable) * 100 
    : 0;
  const isSaleActive = new Date(ticket.saleStartDate) <= new Date() && 
                      new Date(ticket.saleEndDate) >= new Date();
  const totalRevenue = parseFloat(ticket.price) * soldQuantity;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{ticket.displayName}</h1>
            {ticket.isActive ? (
              <Badge className="bg-green-500 hover:bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Inactive
              </Badge>
            )}
            {isSaleActive && ticket.isActive && (
              <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                On Sale Now
              </Badge>
            )}
          </div>
          {ticket.description && (
            <p className="text-muted-foreground">{ticket.description}</p>
          )}
        </div>
        <Link href={`/dashboard/creator/ticket-form/edit/${eventId}/${ticketId}`}>
          <Button size="lg">
            <Edit className="h-4 w-4 mr-2" />
            Edit Ticket
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(ticket.price, ticket.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tickets Sold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldQuantity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {soldPercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TicketIcon className="h-4 w-4" />
              Available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableQuantity}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {ticket.totalQuantityAvailable} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue.toString(), ticket.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Image */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Image</CardTitle>
          </CardHeader>
          <CardContent>
            {ticket.imageUrl ? (
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                <img
                  src={ticket.imageUrl}
                  alt={ticket.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.classList.add('flex', 'items-center', 'justify-center');
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      parent.appendChild(icon.firstChild!);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pricing & Purchase Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price per ticket</span>
              <span className="font-semibold">
                {formatCurrency(ticket.price, ticket.currency)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Min per order</span>
              <span className="font-semibold">{ticket.minQuantityPerOrder}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Max per order</span>
              <span className="font-semibold">{ticket.maxQuantityPerOrder}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Currency</span>
              <Badge variant="outline">{ticket.currency}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sale Period */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sale Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sale Start</p>
              <p className="font-medium">{formatDateTime(ticket.saleStartDate)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sale End</p>
              <p className="font-medium">{formatDateTime(ticket.saleEndDate)}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {isSaleActive ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Currently on sale
                </Badge>
              ) : new Date(ticket.saleStartDate) > new Date() ? (
                <Badge variant="outline">
                  Starts {format(new Date(ticket.saleStartDate), 'MMM dd, yyyy')}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Sale ended
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total quantity</span>
              <span className="font-semibold">{ticket.totalQuantityAvailable}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tickets sold</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {soldQuantity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {availableQuantity}
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Availability</span>
                <span className="font-medium">{availabilityPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    availabilityPercentage > 50
                      ? "bg-green-500"
                      : availabilityPercentage > 20
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${availabilityPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms of Service */}
      {ticket.tos && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.tos}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Ticket ID</span>
            <code className="px-2 py-1 bg-muted rounded text-xs">{ticket.id}</code>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Created</span>
            <span>{format(new Date(ticket.createdAt), "PPP 'at' p")}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Last Updated</span>
            <span>{format(new Date(ticket.updatedAt), "PPP 'at' p")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


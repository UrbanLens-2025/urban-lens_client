"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { StatCard } from "@/components/shared";

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketId: string }>;
}) {
  const { eventId, ticketId } = use(params);
  const router = useRouter();
  const { data: tickets, isLoading } = useEventTickets(eventId);

  const ticket = tickets?.find(t => t.id === ticketId);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  const availableQuantity = ticket.totalQuantityAvailable;
  const availabilityPercentage = ticket.totalQuantityAvailable > 0
    ? (availableQuantity / ticket.totalQuantity) * 100
    : 0;
  const soldQuantity = ticket.quantityReserved;
  const soldPercentage = ticket.totalQuantityAvailable > 0
    ? (soldQuantity / ticket.totalQuantity) * 100
    : 0;
  const isSaleActive = new Date(ticket.saleStartDate) <= new Date() &&
    new Date(ticket.saleEndDate) >= new Date();
  const totalRevenue = parseFloat(ticket.price) * soldQuantity;

  const refundValue = parseFloat(ticket.price) * (ticket.refundPercentageBeforeCutoff || 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
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
            <div className='flex flex-row items-start gap-3 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Calendar className='h-4 w-4' />
                Start Sale: {formatDateTime(ticket.saleStartDate!)}
              </div>
              <div>-</div>
              <div className='flex items-center gap-1.5'>
                <Calendar className='h-4 w-4' />
                End Sale: {formatDateTime(ticket.saleEndDate!)}
              </div>
            </div>
          </div>
          <div className="text-muted-foreground text-sm max-w-3xl">
            <div className={cn("leading-relaxed whitespace-pre-line", !isDescriptionExpanded && "line-clamp-2")}>
              {ticket.description || "No description provided."}
            </div>
            {ticket.description && ticket.description.length > 150 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-primary text-xs font-medium hover:underline mt-1 flex items-center gap-1 focus:outline-none"
              >
                {isDescriptionExpanded ? (
                  <>Show Less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Read More <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        </div>
        <Link href={`/dashboard/creator/ticket-form/edit/${eventId}/${ticketId}`}>
          <Button size="lg">
            <Edit className="h-4 w-4 mr-2" />
            Edit Ticket
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Price"
          value={formatCurrency(ticket.price, ticket.currency)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Tickets Sold"
          value={soldQuantity}
          description={`${soldPercentage.toFixed(0)}% of total`}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Available"
          value={availableQuantity}
          description={`of ${ticket.totalQuantity} total`}
          icon={TicketIcon}
          color="purple"
          footer={
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-medium text-muted-foreground">
                <span>Capacity&nbsp;</span>
                <span>{availabilityPercentage.toFixed(0)}% Left</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    availabilityPercentage > 50 ? "bg-purple-500" :
                      availabilityPercentage > 20 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${availabilityPercentage}%` }}
                />
              </div>
            </div>
          }
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue.toString(), ticket.currency)}
          icon={TrendingUp}
          color="amber"
        />
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
            <Separator />
            {ticket.allowRefunds ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" /> Refunds are allowed
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <span className="text-xs text-muted-foreground block mb-1">Refund Amount</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg text-primary">
                        {formatCurrency(refundValue.toString(), ticket.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({((ticket.refundPercentageBeforeCutoff || 0) * 100).toFixed(0)}% of price)
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md border">
                    <span className="text-xs text-muted-foreground block mb-1">Eligibility Period</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">
                        {ticket.refundCutoffHoursAfterPayment} hours
                      </span>
                      <span className="text-xs text-muted-foreground">
                        after purchase
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted/30 rounded-md">
                <XCircle className="h-4 w-4" /> This ticket is non-refundable.
              </div>
            )}
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
    </div>
  );
}


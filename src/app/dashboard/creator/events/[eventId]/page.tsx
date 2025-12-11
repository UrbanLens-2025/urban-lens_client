"use client";

import type React from "react";
import { use, useState } from "react";
import { useEventById } from "@/hooks/events/useEventById";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { useEventAttendance } from "@/hooks/events/useEventAttendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  MapPin,
  User,
  ImageIcon,
  Layers,
  Users,
  Globe,
  FileText,
  Calendar,
  Phone,
  Ticket,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function InfoRow({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ComponentType<{ className?: string }> }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 mb-4">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default function EventOverviewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [visibleTagsCount, setVisibleTagsCount] = useState(10);

  const { data: event, isLoading: isLoadingEvent } = useEventById(eventId);
  const { data: tickets, isLoading: isLoadingTickets } = useEventTickets(eventId);
  const { data: attendanceData, isLoading: isLoadingAttendance } = useEventAttendance(eventId, {
    page: 1,
    limit: 100,
    sortBy: "createdAt:DESC",
  });

  const formatCurrency = (amount: string | number, currency: string = "VND") => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
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

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 text-red-500">
        <p className="font-medium">Error loading event details</p>
      </div>
    );
  }

  // Calculate statistics
  const attendances = attendanceData?.data || [];
  const totalTicketsSold = attendances.reduce(
    (sum, attendance) =>
      sum +
      attendance.order.orderDetails.reduce(
        (detailSum, detail) => detailSum + detail.quantity,
        0
      ),
    0
  );

  const totalRevenue = attendances.reduce(
    (sum, attendance) => sum + parseFloat(attendance.order.totalPaymentAmount || "0"),
    0
  );

  const paidOrders = attendances.filter(
    (a) => a.order.status?.toUpperCase() === "PAID"
  ).length;

  const totalTicketsAvailable = tickets?.reduce(
    (sum, ticket) => sum + ticket.totalQuantityAvailable,
    0
  ) || 0;

  const ticketsSoldPercentage = totalTicketsAvailable > 0 
    ? (totalTicketsSold / totalTicketsAvailable) * 100 
    : 0;

  const isEventPast = event.endDate ? new Date(event.endDate) < new Date() : false;
  const isEventUpcoming = event.startDate ? new Date(event.startDate) > new Date() : true;
  const isEventOngoing = !isEventPast && !isEventUpcoming;

  // Truncate description to 200 characters
  const truncatedDescription = event.description && event.description.length > 200
    ? event.description.substring(0, 200) + "..."
    : event.description;

  // Handle tag pagination
  const allTags = event.tags || [];
  const visibleTags = allTags.slice(0, visibleTagsCount);
  const hasMoreTags = allTags.length > visibleTagsCount;

  return (
    <div className="space-y-6">

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAttendance ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(totalRevenue)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {paidOrders} paid order{paidOrders !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Tickets Sold */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAttendance ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${totalTicketsSold} / ${totalTicketsAvailable}`
              )}
            </div>
            <Progress value={ticketsSoldPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {ticketsSoldPercentage.toFixed(1)}% sold
            </p>
          </CardContent>
        </Card>

        {/* Total Attendees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingAttendance ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                totalTicketsSold
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {attendances.length} total order{attendances.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Ticket Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Types</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingTickets ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                tickets?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tickets?.filter(t => t.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Side Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Social Links */}
          {event.social && event.social.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.social.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Badge variant={social.isMain ? "default" : "outline"}>
                        {social.platform}
                      </Badge>
                      <span className="text-sm truncate flex-1 text-muted-foreground group-hover:text-foreground">
                        {social.url}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Event Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <img 
                  src={event.createdBy?.avatarUrl || "/default-avatar.svg"} 
                  alt="avatar" 
                  className="h-10 w-10 rounded-full object-cover border" 
                />
                <div>
                  <div className="font-medium">
                    {event.createdBy?.firstName} {event.createdBy?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.createdBy?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> {event.createdBy?.phoneNumber}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Request Link */}
          {event.referencedEventRequestId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Related Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/creator/request/${event.referencedEventRequestId}`}>
                  <Button variant="outline" className="w-full">
                    View Event Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Description & Tags Combined */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description Section */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">Description</p>
                {event.description ? (
                  <div>
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                      {isDescriptionExpanded ? event.description : truncatedDescription}
                    </p>
                    {event.description.length > 200 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="mt-2 p-0 h-auto font-normal text-primary hover:text-primary/80"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Read more
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No description provided</p>
                )}
              </div>

              {/* Separator */}
              {event.tags && event.tags.length > 0 && (
                <div className="border-t" />
              )}

              {/* Tags Section */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {visibleTags.map((tag) => (
                      <Badge 
                        key={tag.id} 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        className="flex items-center gap-1 text-sm px-3 py-1"
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.displayName}</span>
                      </Badge>
                    ))}
                  </div>
                  {hasMoreTags && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleTagsCount(prev => prev + 10)}
                      className="mt-3 p-0 h-auto font-normal text-primary hover:text-primary/80"
                    >
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Load 10 more tags
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policies */}
          {(event.refundPolicy || event.termsAndConditions) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policies & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.refundPolicy && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Refund Policy</p>
                    <p className="text-base text-foreground">{event.refundPolicy}</p>
                  </div>
                )}
                {event.termsAndConditions && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Terms and Conditions</p>
                    <p className="text-base text-foreground">{event.termsAndConditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Details - Only show if location booking exists */}
          {event.locationBookings && event.locationBookings.length > 0 && event.location && (
            <Card className="overflow-hidden">
              {/* Featured Location Image */}
              {event.location?.imageUrl && event.location.imageUrl.length > 0 && (
                <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 to-muted">
                  <img
                    src={event.location.imageUrl[0] || "/placeholder.svg"}
                    alt={event.location?.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="h-5 w-5" />
                      <h3 className="text-xl font-bold">{event.location?.name}</h3>
                    </div>
                  </div>
                </div>
              )}

              <CardHeader className={event.location?.imageUrl && event.location.imageUrl.length > 0 ? "pb-3" : ""}>
                {(!event.location?.imageUrl || event.location.imageUrl.length === 0) && (
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {event.location?.name || "Event Location"}
                  </CardTitle>
                )}
                <CardDescription>
                  {event.location?.description || "Where this event will take place"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Description (if no images at top) */}
                {(!event.location?.imageUrl || event.location.imageUrl.length === 0) && event.location?.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {event.location.description}
                  </p>
                )}

                {/* Address */}
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{event.location?.addressLine}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.location?.addressLevel1}, {event.location?.addressLevel2}
                    </p>
                  </div>
                </div>
                
                {/* Additional Location Images Gallery */}
                {event.location?.imageUrl && event.location.imageUrl.length > 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Location Gallery</p>
                      <Badge variant="secondary" className="text-xs">
                        {event.location.imageUrl.length} photo{event.location.imageUrl.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className={`grid gap-2 ${
                      event.location.imageUrl.length === 2 ? 'grid-cols-2' :
                      event.location.imageUrl.length === 3 ? 'grid-cols-3' :
                      'grid-cols-4'
                    }`}>
                      {event.location.imageUrl.slice(1, 5).map((url, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-square overflow-hidden rounded-md border group cursor-pointer"
                        >
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`${event.location?.name} - View ${index + 2}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {index === 3 && event.location.imageUrl.length > 5 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                +{event.location.imageUrl.length - 5}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ticket Sales Breakdown */}
      {tickets && tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ticket Sales Breakdown
            </CardTitle>
            <CardDescription>
              Performance of each ticket type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const soldCount = attendances.reduce((sum, attendance) => {
                  const ticketOrders = attendance.order.orderDetails.filter(
                    detail => detail.ticket.id === ticket.id
                  );
                  return sum + ticketOrders.reduce((s, order) => s + order.quantity, 0);
                }, 0);
                
                const soldPercentage = (soldCount / ticket.totalQuantityAvailable) * 100;
                const revenue = soldCount * parseFloat(ticket.price);

                return (
                  <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{ticket.displayName}</h4>
                          <Badge variant={ticket.isActive ? "default" : "secondary"}>
                            {ticket.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(ticket.price, ticket.currency)} per ticket
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{soldCount}</p>
                        <p className="text-sm text-muted-foreground">sold</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {soldCount} / {ticket.totalQuantityAvailable} tickets
                        </span>
                        <span className="font-medium">{soldPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={soldPercentage} />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="font-semibold">{formatCurrency(revenue, ticket.currency)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/events/useEventById";
import { usePublishEvent } from "@/hooks/events/usePublishEvent";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DisplayTags } from "@/components/shared/DisplayTags";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  User,
  ImageIcon,
  Layers,
  Users,
  Tag as TagIcon,
  Globe,
  FileText,
  Calendar,
  Phone,
  Edit,
  Send,
  Ticket,
  DollarSign,
  Hash,
  Clock,
  CheckCircle,
  XCircle,
  Pencil,
  UserCheck,
  Megaphone,
  CalendarDays,
  CalendarClock,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

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

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  const { data: event, isLoading, isError } = useEventById(eventId);
  const { data: tickets, isLoading: isLoadingTickets } = useEventTickets(eventId);
  const publishEvent = usePublishEvent();

  const handlePublish = () => {
    if (event && event.status === "DRAFT") {
      publishEvent.mutate(eventId);
    }
  };

  // Check if event is ready to be published
  const canPublish = event?.displayName && event?.startDate && event?.endDate && event?.locationId;
  const publishDisabledReason = !event?.displayName 
    ? "Event name is required" 
    : !event?.startDate 
    ? "Start date is required" 
    : !event?.endDate 
    ? "End date is required" 
    : !event?.locationId 
    ? "Location is required" 
    : null;

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  const formatCompactDateTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const statusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PUBLISHED' || s === 'ACTIVE') return 'default' as const;
    if (s === 'DRAFT') return 'outline' as const;
    if (s === 'COMPLETED') return 'secondary' as const;
    if (s === 'CANCELLED') return 'destructive' as const;
    return 'secondary' as const;
  };

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading event details</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const truncatedDescription = event.description 
    ? (event.description.length > 150 ? event.description.substring(0, 150) + "..." : event.description)
    : null;

  // Limit tags to show
  const MAX_VISIBLE_TAGS = 4;
  const visibleTags = event.tags?.slice(0, MAX_VISIBLE_TAGS) || [];
  const remainingTagsCount = (event.tags?.length || 0) - MAX_VISIBLE_TAGS;

  return (
    <div className="space-y-0">
      {/* Cover Banner */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-primary/20 via-primary/10 to-muted overflow-hidden rounded-b-3xl">
        {event.coverUrl ? (
          <img
            src={event.coverUrl}
            alt={event.displayName}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(event.coverUrl!)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-2">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No cover image</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        
        {/* Back Button - Overlay */}
        <div className="absolute top-4 left-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/creator/events')} className="bg-background/90 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="space-y-8 p-6 -mt-20 relative z-10">
        {/* Header Section with Avatar and Key Info */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {event.avatarUrl ? (
                <img
                  src={event.avatarUrl}
                  alt={event.displayName}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background shadow-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(event.avatarUrl!)}
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-background shadow-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Key Information */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold">{event.displayName}</h1>
                  <Badge variant={statusVariant(event.status)} className="text-sm">{event.status}</Badge>
                </div>
                
                {truncatedDescription && (
                  <p className="text-base text-muted-foreground leading-relaxed max-w-3xl line-clamp-2">
                    {truncatedDescription}
                  </p>
                )}

                {/* Date and Tags Information */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {/* Compact Date Range */}
                  <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-lg">
                    <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {event.startDate || event.endDate ? (
                      <span className="font-medium whitespace-nowrap">
                        {event.startDate ? formatCompactDateTime(event.startDate) : "Not set"}
                        {event.endDate && (
                          <>
                            <span className="text-muted-foreground mx-1.5">→</span>
                            {formatCompactDateTime(event.endDate)}
                          </>
                        )}
                        {!event.endDate && event.startDate && (
                          <span className="text-muted-foreground ml-1.5">(end date not set)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Dates not set</span>
                    )}
                  </div>

                  {/* Limited Tags */}
                  {visibleTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {visibleTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          style={{
                            backgroundColor: `${tag.color}15`,
                            borderColor: tag.color,
                            color: tag.color,
                          }}
                          className="text-xs border"
                        >
                          <span className="mr-1">{tag.icon}</span>
                          {tag.displayName}
                        </Badge>
                      ))}
                      {remainingTagsCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{remainingTagsCount} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                {event.status === "DRAFT" && (
                  <div className="w-full sm:w-auto">
                    <Button
                      onClick={handlePublish}
                      disabled={publishEvent.isPending || !canPublish}
                      className="w-full"
                      size="lg"
                    >
                      {publishEvent.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Publish Event
                        </>
                      )}
                    </Button>
                    {!canPublish && publishDisabledReason && (
                      <p className="text-xs text-destructive mt-1">
                        {publishDisabledReason}
                      </p>
                    )}
                  </div>
                )}
                
                <Link href={`/dashboard/creator/events/${eventId}/edit`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full" size="lg">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Event
                  </Button>
                </Link>
              </div>

              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <MoreVertical className="h-4 w-4 mr-2" />
                    <span className="sm:inline">Quick Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <Link href={`/dashboard/creator/events/${eventId}/tickets/create`}>
                    <DropdownMenuItem>
                      <Ticket className="h-4 w-4 mr-2" />
                      Create Ticket
                    </DropdownMenuItem>
                  </Link>
                  <Link href={`/dashboard/creator/events/${eventId}/attendance`}>
                    <DropdownMenuItem>
                      <UserCheck className="h-4 w-4 mr-2" />
                      View Attendance
                    </DropdownMenuItem>
                  </Link>
                  <Link href={`/dashboard/creator/events/${eventId}/announcements`}>
                    <DropdownMenuItem>
                      <Megaphone className="h-4 w-4 mr-2" />
                      Announcements
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b">
          <nav className="flex gap-1 overflow-x-auto">
            <Link href={`/dashboard/creator/events/${eventId}`}>
              <Button
                variant="ghost"
                className="gap-2 rounded-b-none border-b-2 border-transparent data-[active=true]:border-primary data-[active=true]:bg-muted"
                data-active="true"
              >
                <Layers className="h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/tickets`}>
              <Button
                variant="ghost"
                className="gap-2 rounded-b-none border-b-2 border-transparent hover:border-muted-foreground/50"
              >
                <Ticket className="h-4 w-4" />
                Tickets
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/attendance`}>
              <Button
                variant="ghost"
                className="gap-2 rounded-b-none border-b-2 border-transparent hover:border-muted-foreground/50"
              >
                <UserCheck className="h-4 w-4" />
                Attendance
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/announcements`}>
              <Button
                variant="ghost"
                className="gap-2 rounded-b-none border-b-2 border-transparent hover:border-muted-foreground/50"
              >
                <Megaphone className="h-4 w-4" />
                Announcements
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/settings`}>
              <Button
                variant="ghost"
                className="gap-2 rounded-b-none border-b-2 border-transparent hover:border-muted-foreground/50"
              >
                <Edit className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </nav>
        </div>

        {/* Overview Content */}
        <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers /> Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Full Description</p>
                    <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
                  </div>
                )}
              
              {event.tags && event.tags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge 
                        key={tag.id} 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        className="flex items-center gap-1"
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.displayName}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {event.social && event.social.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Social Links
                  </p>
                  <div className="space-y-2">
                    {event.social.map((social, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{social.platform}</Badge>
                        <a 
                          href={social.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {social.url}
                        </a>
                        {social.isMain && (
                          <Badge variant="secondary" className="text-xs">Main</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.refundPolicy && (
                <InfoRow label="Refund Policy" value={event.refundPolicy} icon={FileText} />
              )}

              {event.termsAndConditions && (
                <InfoRow label="Terms and Conditions" value={event.termsAndConditions} icon={FileText} />
              )}
            </CardContent>
          </Card>

          {/* Tickets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Tickets
                </div>
                <Link href={`/dashboard/creator/events/${eventId}/tickets/create`}>
                  <Button variant="outline" size="sm">
                    <Ticket className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !tickets || tickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No tickets created yet
                  </p>
                  <Link href={`/dashboard/creator/events/${eventId}/tickets/create`}>
                    <Button variant="default" size="sm">
                      <Ticket className="h-4 w-4 mr-2" />
                      Create Your First Ticket
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tickets.map((ticket) => {
                    const formatCurrency = (price: string, currency: string) => {
                      const numPrice = parseFloat(price);
                      if (currency === "VND") {
                        return new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                          minimumFractionDigits: 0,
                        }).format(numPrice);
                      }
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      }).format(numPrice);
                    };

                    const formatDate = (dateString: string) => {
                      return new Date(dateString).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    };

                    const availableQuantity = ticket.totalQuantityAvailable - ticket.quantityReserved;
                    const isSaleActive = new Date(ticket.saleStartDate) <= new Date() && 
                                       new Date(ticket.saleEndDate) >= new Date();
                    const availabilityPercentage = (availableQuantity / ticket.totalQuantityAvailable) * 100;

                    return (
                      <div
                        key={ticket.id}
                        className="group relative border-2 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                      >
                        {/* Status Badge - Top Right */}
                        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                          {ticket.isActive ? (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-md">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-400 text-white border-0">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          {!isSaleActive && ticket.isActive && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              Not On Sale
                            </Badge>
                          )}
                        </div>

                        {/* Ticket Image */}
                        {ticket.imageUrl && (
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                            <img
                              src={ticket.imageUrl}
                              alt={ticket.displayName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                        )}

                        {/* Ticket Content */}
                        <div className="p-5 space-y-4">
                          {/* Ticket Name */}
                          <div>
                            <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-1">
                              {ticket.displayName}
                            </h3>
                            {ticket.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {ticket.description}
                              </p>
                            )}
                          </div>

                          {/* Price - Prominent Display */}
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Ticket Price</p>
                            <p className="text-3xl font-bold text-primary">
                              {formatCurrency(ticket.price, ticket.currency)}
                            </p>
                          </div>

                          {/* Key Information */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Available
                              </span>
                              <span className="font-semibold text-gray-900">
                                {availableQuantity} / {ticket.totalQuantityAvailable}
                              </span>
                            </div>

                            {/* Availability Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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

                            <div className="flex items-center justify-between text-sm pt-1">
                              <span className="text-gray-600 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Per Order
                              </span>
                              <span className="font-semibold text-gray-900">
                                {ticket.minQuantityPerOrder} - {ticket.maxQuantityPerOrder}
                              </span>
                            </div>
                          </div>

                          {/* Sale Period */}
                          <div className="pt-3 border-t border-gray-200 space-y-2">
                            <div className="flex items-start gap-2 text-xs text-gray-600">
                              <Calendar className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-700 mb-1">Sale Period</p>
                                <p className="leading-relaxed">
                                  <span className="block">Start: {formatDate(ticket.saleStartDate)}</span>
                                  <span className="block">End: {formatDate(ticket.saleEndDate)}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Terms */}
                          {ticket.tos && (
                            <div className="pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-600 line-clamp-2">
                                <span className="font-medium">Terms: </span>
                                {ticket.tos}
                              </p>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-3 border-t border-gray-200">
                            <Link href={`/dashboard/creator/events/${eventId}/tickets/${ticket.id}/edit`}>
                              <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Ticket
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Location Name" value={event.location?.name} />
              <InfoRow label="Description" value={event.location?.description} />
              <InfoRow label="Address" value={event.location?.addressLine} />
              <InfoRow label="Area" value={`${event.location?.addressLevel1}, ${event.location?.addressLevel2}`} />
              <InfoRow label="Coordinates" value={`${event.location?.latitude}, ${event.location?.longitude}`} />
              <InfoRow label="Visibility" value={event.location?.isVisibleOnMap ? "Visible on map" : "Hidden"} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User /> Creator
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

          {/* Location Images */}
          {event.location?.imageUrl && event.location.imageUrl.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon /> Location Images
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {event.location.imageUrl.slice(0, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Location ${index + 1}`}
                    onClick={() => handleImageClick(url)}
                    className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Event Request Link */}
          {event.referencedEventRequestId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar /> Related Request
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
      </div>
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt="Enlarged preview"
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}


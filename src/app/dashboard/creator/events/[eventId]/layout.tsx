"use client";

import type React from "react";
import { use, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEventById } from "@/hooks/events/useEventById";
import { usePublishEvent } from "@/hooks/events/usePublishEvent";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { EventWelcomeModal } from "@/components/shared/EventWelcomeModal";
import { EventTabProvider, useEventTabs } from "@/contexts/EventTabContext";
import {
  Loader2,
  ArrowLeft,
  ImageIcon,
  Layers,
  Edit,
  Send,
  Ticket,
  UserCheck,
  Megaphone,
  CalendarDays,
  MoreVertical,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";

function EventDetailLayoutContent({
  eventId,
  children,
}: {
  eventId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ticketDetailsTab, openTicketDetailsTab, closeTicketDetailsTab } = useEventTabs();
  const [preventAutoOpenTicketId, setPreventAutoOpenTicketId] = useState<string | null>(null);

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  const { data: event, isLoading, isError } = useEventById(eventId);
  const { data: tickets } = useEventTickets(eventId);
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

  const isActiveTab = (path: string) => {
    // Check if ticket details tab is open and active
    if (path === 'ticket-details' && ticketDetailsTab.isOpen) {
      return pathname.includes('/tickets/') && pathname !== `/dashboard/creator/events/${eventId}/tickets`;
    }
    
    if (path === `/dashboard/creator/events/${eventId}`) {
      return pathname === path;
    }
    // For tickets tab, check if we're on the tickets list (not details)
    if (path === `/dashboard/creator/events/${eventId}/tickets`) {
      return pathname === path;
    }
    return pathname.startsWith(path) && !(pathname.includes('/tickets/') && pathname !== `/dashboard/creator/events/${eventId}/tickets`);
  };

  const isTicketDetailsRoute = pathname.includes('/tickets/') && pathname !== `/dashboard/creator/events/${eventId}/tickets`;

  // Show ticket details content if we're on a ticket details route
  const shouldShowTicketDetails = ticketDetailsTab.isOpen && isTicketDetailsRoute;

  // Auto-open ticket details tab when on a ticket details route
  useEffect(() => {
    // Only auto-open if we're actually on a ticket details route
    // and not navigating to the tickets list
    if (isTicketDetailsRoute && pathname !== `/dashboard/creator/events/${eventId}/tickets`) {
      // Extract ticket ID from pathname
      const pathParts = pathname.split('/');
      const ticketId = pathParts[pathParts.length - 1];
      
      // Find the ticket to get its name
      if (tickets && ticketId) {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
          if (preventAutoOpenTicketId === ticketId) {
            return;
          }
          // Only update if it's a different ticket or tab is not open
          if (!ticketDetailsTab.isOpen || ticketDetailsTab.ticketId !== ticketId) {
            openTicketDetailsTab(ticketId, ticket.displayName);
          }
        }
      }
    }
  }, [
    isTicketDetailsRoute,
    pathname,
    tickets,
    ticketDetailsTab.isOpen,
    ticketDetailsTab.ticketId,
    openTicketDetailsTab,
    eventId,
    preventAutoOpenTicketId,
  ]);

  // Reset prevent flag when leaving ticket details routes
  useEffect(() => {
    if (!isTicketDetailsRoute && preventAutoOpenTicketId) {
      setPreventAutoOpenTicketId(null);
    }
  }, [isTicketDetailsRoute, preventAutoOpenTicketId]);

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
      {/* Welcome Modal */}
      <EventWelcomeModal eventId={eventId} eventName={event.displayName} />
      
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
                
                <Link href={`/dashboard/creator/event-form/edit/${eventId}`} className="w-full sm:w-auto">
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
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/creator/events/${eventId}`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Layers className="h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/tickets`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/creator/events/${eventId}/tickets`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Ticket className="h-4 w-4" />
                Tickets
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/attendance`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/creator/events/${eventId}/attendance`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <UserCheck className="h-4 w-4" />
                Attendance
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/announcements`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/creator/events/${eventId}/announcements`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Megaphone className="h-4 w-4" />
                Announcements
              </Button>
            </Link>
            <Link href={`/dashboard/creator/events/${eventId}/settings`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/creator/events/${eventId}/settings`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Edit className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            
            {/* Dynamic Ticket Details Tab */}
            {ticketDetailsTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('ticket-details')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    if (ticketDetailsTab.ticketId) {
                      router.push(`/dashboard/creator/events/${eventId}/tickets/${ticketDetailsTab.ticketId}`);
                    }
                  }}
                >
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close the tab immediately
                    const wasOnDetailsPage = isTicketDetailsRoute;
                    const closingTicketId = ticketDetailsTab.ticketId;
                    closeTicketDetailsTab();
                    if (wasOnDetailsPage && closingTicketId) {
                      setPreventAutoOpenTicketId(closingTicketId);
                      // Navigate to Overview tab after state update
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/creator/events/${eventId}`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </nav>
        </div>

        {/* Page Content */}
        <div className="mt-6">
          {children}
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

export default function EventDetailLayout({
  params,
  children,
}: {
  params: Promise<{ eventId: string }>;
  children: React.ReactNode;
}) {
  const { eventId } = use(params);
  
  return (
    <EventTabProvider>
      <EventDetailLayoutContent eventId={eventId}>
        {children}
      </EventDetailLayoutContent>
    </EventTabProvider>
  );
}


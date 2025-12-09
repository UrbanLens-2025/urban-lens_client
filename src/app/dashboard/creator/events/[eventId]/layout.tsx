"use client";

import type React from "react";
import { use, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEventById } from "@/hooks/events/useEventById";
import { usePublishEvent } from "@/hooks/events/usePublishEvent";
import { useFinishEvent } from "@/hooks/events/useFinishEvent";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { EventWelcomeModal } from "@/components/shared/EventWelcomeModal";
import { EventTabProvider, useEventTabs } from "@/contexts/EventTabContext";
import { useEventRequestById } from "@/hooks/events/useEventRequestById";
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
  MapPin,
  Building2,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function EventDetailLayoutContent({
  eventId,
  children,
}: {
  eventId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    ticketDetailsTab, 
    openTicketDetailsTab, 
    closeTicketDetailsTab,
    ticketCreateTab,
    openTicketCreateTab,
    closeTicketCreateTab,
    announcementTab,
    openAnnouncementTab,
    closeAnnouncementTab,
    editEventTab,
    openEditEventTab,
    closeEditEventTab,
    bookLocationTab,
    closeBookLocationTab,
  } = useEventTabs();
  const [preventAutoOpenTicketId, setPreventAutoOpenTicketId] = useState<string | null>(null);
  const [preventAutoOpenTicketCreate, setPreventAutoOpenTicketCreate] = useState(false);
  const [preventAutoOpenAnnouncementId, setPreventAutoOpenAnnouncementId] = useState<string | null>(null);
  const [preventAutoOpenEditEvent, setPreventAutoOpenEditEvent] = useState(false);
  
  // Use refs to track if we've already opened tabs to prevent infinite loops
  const ticketCreateTabOpenedRef = useRef(false);
  const announcementTabOpenedRef = useRef<string | null>(null);
  const editEventTabOpenedRef = useRef(false);

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);

  const { data: event, isLoading, isError } = useEventById(eventId);
  const { data: tickets } = useEventTickets(eventId);
  const publishEvent = usePublishEvent();
  const finishEvent = useFinishEvent();

  const handlePublishClick = () => {
    setIsPublishDialogOpen(true);
  };

  const handlePublishConfirm = () => {
    if (event && event.status === "DRAFT") {
      // Double-check payment status before publishing
      if (!hasPaymentMade) {
        toast.error("Payment must be completed before publishing the event. Please complete the payment for your location booking first.");
        setIsPublishDialogOpen(false);
        return;
      }
      publishEvent.mutate(eventId);
      setIsPublishDialogOpen(false);
    }
  };

  const handleFinishClick = () => {
    setIsFinishDialogOpen(true);
  };

  const handleFinishConfirm = () => {
    if (event && event.status === "PUBLISHED") {
      finishEvent.mutate(eventId);
      setIsFinishDialogOpen(false);
    }
  };

  const isEventEnded = event?.endDate ? new Date(event.endDate) < new Date() : false;
  const isPublished = event?.status?.toUpperCase() === "PUBLISHED";

  
  // Checklist items for publishing
  const hasNameAndDescription = !!(event?.displayName && event?.description);
  const hasDates = !!(event?.startDate && event?.endDate);
  const hasLocation = !!event?.locationId;
  const hasDocuments = !!(event?.eventValidationDocuments && event.eventValidationDocuments.length > 0);
  
  // Check if payment has been made for location booking
  // Payment is confirmed if at least one locationBooking has a referencedTransactionId
  const hasPaymentMade = event?.locationBookings && event.locationBookings.length > 0
    ? event.locationBookings.some(booking => booking.referencedTransactionId !== null)
    : false;
  
  const isDraft = event?.status?.toUpperCase() === "DRAFT";
  const canPublish = hasNameAndDescription && hasDates && hasLocation && hasDocuments && hasPaymentMade;

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
      return pathname.includes('/tickets/') && 
        pathname !== `/dashboard/creator/events/${eventId}/tickets` &&
        !pathname.includes('/tickets/create');
    }
    
    // Check if ticket create tab is open and active
    if (path === 'ticket-create' && ticketCreateTab.isOpen) {
      return pathname.includes('/tickets/create');
    }
    
    // Check if announcement tab is open and active
    if (path === 'announcement-tab' && announcementTab.isOpen) {
      return pathname.includes('/announcements/') && pathname !== `/dashboard/creator/events/${eventId}/announcements`;
    }
    
    // Check if edit event tab is open and active
    if (path === 'edit-event-tab' && editEventTab.isOpen) {
      return pathname === `/dashboard/creator/events/${eventId}/edit`;
    }
    
    // Check if book location tab is open and active
    if (path === 'book-location-tab' && bookLocationTab.isOpen) {
      return pathname.includes('/location/book');
    }
    
    if (path === `/dashboard/creator/events/${eventId}`) {
      return pathname === path;
    }
    // For tickets tab, check if we're on the tickets list (not details or create)
    if (path === `/dashboard/creator/events/${eventId}/tickets`) {
      return pathname === path;
    }
    // For announcements tab, check if we're on the announcements list (not create/edit)
    if (path === `/dashboard/creator/events/${eventId}/announcements`) {
      return pathname === path;
    }
    return pathname.startsWith(path) && 
      !(pathname.includes('/tickets/') && pathname !== `/dashboard/creator/events/${eventId}/tickets`) &&
      !(pathname.includes('/announcements/') && pathname !== `/dashboard/creator/events/${eventId}/announcements`);
  };

  const isTicketDetailsRoute = pathname.includes('/tickets/') && 
    pathname !== `/dashboard/creator/events/${eventId}/tickets` &&
    !pathname.includes('/tickets/create');
  const isTicketCreateRoute = pathname.includes('/tickets/create');
  const isAnnouncementRoute = pathname.includes('/announcements/') && pathname !== `/dashboard/creator/events/${eventId}/announcements`;
  const isEditEventRoute = pathname === `/dashboard/creator/events/${eventId}/edit`;

  const normalizedEventStatus = event?.status?.toUpperCase();
  const canAccessAttendanceTab = normalizedEventStatus
    ? ['PUBLISHED', 'FINISHED', 'COMPLETED'].includes(normalizedEventStatus)
    : false;

  const renderAttendanceTabButton = () => {
    const button = (
      <Button
        variant="ghost"
        disabled={!canAccessAttendanceTab}
        aria-disabled={!canAccessAttendanceTab}
        className={cn(
          "gap-2 rounded-b-none border-b-2 transition-colors",
          canAccessAttendanceTab
            ? isActiveTab(`/dashboard/creator/events/${eventId}/attendance`)
              ? "border-primary bg-muted"
              : "border-transparent hover:border-muted-foreground/50"
            : "border-transparent text-muted-foreground opacity-60 cursor-not-allowed"
        )}
      >
        <UserCheck className="h-4 w-4" />
        Attendance
      </Button>
    );

    if (!canAccessAttendanceTab) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>This tab is only available after you publish the event</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

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

  // Auto-open ticket create tab when on ticket create route
  useEffect(() => {
    if (isTicketCreateRoute && !preventAutoOpenTicketCreate && !ticketCreateTabOpenedRef.current) {
      ticketCreateTabOpenedRef.current = true;
      openTicketCreateTab();
    } else if (!isTicketCreateRoute) {
      ticketCreateTabOpenedRef.current = false;
    }
  }, [isTicketCreateRoute, preventAutoOpenTicketCreate, openTicketCreateTab]);

  // Reset prevent flag when leaving ticket create route
  useEffect(() => {
    if (!isTicketCreateRoute && preventAutoOpenTicketCreate) {
      setPreventAutoOpenTicketCreate(false);
    }
  }, [isTicketCreateRoute, preventAutoOpenTicketCreate]);

  // Auto-open announcement tab when on an announcement route
  useEffect(() => {
    if (!isAnnouncementRoute || pathname === `/dashboard/creator/events/${eventId}/announcements`) {
      announcementTabOpenedRef.current = null;
      return;
    }

    const pathParts = pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const currentTabKey = lastPart === 'new' ? 'new' : lastPart;
    
    // Only open if we haven't already opened for this route
    if (announcementTabOpenedRef.current === currentTabKey) {
      return;
    }
    
    if (lastPart === 'new') {
      // Create mode
      if (preventAutoOpenAnnouncementId === 'new') {
        return;
      }
      announcementTabOpenedRef.current = 'new';
      openAnnouncementTab('create');
    } else if (lastPart !== 'announcements') {
      // Edit mode - last part is the announcement ID
      const announcementId = lastPart;
      if (preventAutoOpenAnnouncementId === announcementId) {
        return;
      }
      announcementTabOpenedRef.current = announcementId;
      // Try to get announcement name from path or use a default
      const announcementName = announcementTab.announcementName || 'Edit Announcement';
      openAnnouncementTab('edit', announcementId, announcementName);
    }
  }, [
    isAnnouncementRoute,
    pathname,
    eventId,
    announcementTab.announcementName,
    openAnnouncementTab,
    preventAutoOpenAnnouncementId,
  ]);

  // Reset prevent flag when leaving announcement routes
  useEffect(() => {
    if (!isAnnouncementRoute && preventAutoOpenAnnouncementId) {
      setPreventAutoOpenAnnouncementId(null);
    }
  }, [isAnnouncementRoute, preventAutoOpenAnnouncementId]);

  // Auto-open edit event tab when on edit event route
  useEffect(() => {
    if (isEditEventRoute && !preventAutoOpenEditEvent && event) {
      // Only open if tab is not already open or if it's a different event name
      if (!editEventTab.isOpen || editEventTab.eventName !== event.displayName) {
        editEventTabOpenedRef.current = true;
        openEditEventTab(event.displayName);
      }
    } else if (!isEditEventRoute) {
      editEventTabOpenedRef.current = false;
    }
  }, [isEditEventRoute, preventAutoOpenEditEvent, openEditEventTab, event, editEventTab.isOpen, editEventTab.eventName]);

  // Reset prevent flag when leaving edit event route
  useEffect(() => {
    if (!isEditEventRoute && preventAutoOpenEditEvent) {
      setPreventAutoOpenEditEvent(false);
    }
  }, [isEditEventRoute, preventAutoOpenEditEvent]);

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
        <div className="absolute top-4 left-4 z-10">
          <Button 
            variant="default" 
            size="icon" 
            onClick={() => router.push('/dashboard/creator/events')} 
            className="bg-background/98 border-2 border-foreground/30 shadow-2xl backdrop-blur-lg hover:bg-background min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5 text-foreground stroke-2" />
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

            {/* Finish Event Button - Show only if PUBLISHED */}
            {isPublished && (
              <div className="pt-4">
                <Button
                  onClick={handleFinishClick}
                  // TODO: Re-add `!isEventEnded` validation once found a way to demo
                  disabled={finishEvent.isPending}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {finishEvent.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finish Event
                    </>
                  )}
                </Button>
                {/* TODO: Re-add this message once validation is restored */}
                {/* {!isEventEnded && (
                  <p className="text-xs text-muted-foreground mt-2">
                    You can finish the event after the end date has passed.
                  </p>
                )} */}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4">
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                {event.status === "DRAFT" && (
                  <>
                    <div className="w-full sm:w-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button
                              onClick={handlePublishClick}
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
                          </div>
                        </TooltipTrigger>
                        {!canPublish && (
                          <TooltipContent>
                            <p>
                              {!hasPaymentMade 
                                ? "Complete payment for location booking before publishing"
                                : "Complete all checklist items to publish your event"}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>

                    <div className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={(e) => {
                          e.preventDefault();
                          openEditEventTab(event.displayName);
                          router.push(`/dashboard/creator/events/${eventId}/edit`);
                        }}
                        className="w-full gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Event
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Publishing Checklist - Show when event is DRAFT */}
        {isDraft && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Complete these steps to publish your event
              </CardTitle>
              <CardDescription>
                Make sure all required information is provided before publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {hasNameAndDescription ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      hasNameAndDescription ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Provide event name and description
                    </p>
                    {!hasNameAndDescription && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add a name and description for your event
                      </p>
                    )}
                  </div>
                  {!hasNameAndDescription && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditEventTab(event.displayName);
                        router.push(`/dashboard/creator/events/${eventId}/edit`);
                      }}
                    >
                      Add
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {hasDates ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      hasDates ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Provide event start date time and end date time
                    </p>
                    {!hasDates && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Set when your event starts and ends
                      </p>
                    )}
                  </div>
                  {!hasDates && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditEventTab(event.displayName);
                        router.push(`/dashboard/creator/events/${eventId}/edit`);
                      }}
                    >
                      Add
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {hasLocation ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      hasLocation ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Book location for event
                    </p>
                    {!hasLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Select and book a venue for your event
                      </p>
                    )}
                  </div>
                  {!hasLocation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/dashboard/creator/events/${eventId}/location`);
                      }}
                    >
                      Book
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {hasDocuments ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      hasDocuments ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Submit event documents
                    </p>
                    {!hasDocuments && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload required validation documents
                      </p>
                    )}
                  </div>
                  {!hasDocuments && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        openEditEventTab(event.displayName);
                        router.push(`/dashboard/creator/events/${eventId}/edit`);
                      }}
                    >
                      Add
                    </Button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {hasPaymentMade ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      hasPaymentMade ? "text-foreground" : "text-muted-foreground"
                    )}>
                      Complete payment for location booking
                    </p>
                    {!hasPaymentMade && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Payment must be completed before publishing the event
                      </p>
                    )}
                  </div>
                  {!hasPaymentMade && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/dashboard/creator/events/${eventId}/location`);
                      }}
                    >
                      Pay
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            <Link href={`/dashboard/creator/events/${eventId}/location`}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 rounded-b-none border-b-2 transition-colors",
                  isActiveTab(`/dashboard/creator/events/${eventId}/location`)
                    ? "border-primary bg-muted"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <MapPin className="h-4 w-4" />
                Location
              </Button>
            </Link>
            {canAccessAttendanceTab ? (
              <Link href={`/dashboard/creator/events/${eventId}/attendance`}>
                {renderAttendanceTabButton()}
              </Link>
            ) : (
              <span className="inline-flex">{renderAttendanceTabButton()}</span>
            )}
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
            
            {/* Dynamic Ticket Create Tab */}
            {ticketCreateTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('ticket-create')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    router.push(`/dashboard/creator/events/${eventId}/tickets/create`);
                  }}
                >
                  Create Ticket
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close the tab immediately
                    const wasOnCreatePage = isTicketCreateRoute;
                    closeTicketCreateTab();
                    if (wasOnCreatePage) {
                      setPreventAutoOpenTicketCreate(true);
                      // Navigate to tickets list after state update
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/creator/events/${eventId}/tickets`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

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
                        router.push(`/dashboard/creator/events/${eventId}/tickets`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Announcement Tab */}
            {announcementTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('announcement-tab')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    if (announcementTab.mode === 'create') {
                      router.push(`/dashboard/creator/events/${eventId}/announcements/new`);
                    } else if (announcementTab.mode === 'edit' && announcementTab.announcementId) {
                      router.push(`/dashboard/creator/events/${eventId}/announcements/${announcementTab.announcementId}/edit`);
                    }
                  }}
                >
                  {announcementTab.mode === 'create' ? 'Create Announcement' : announcementTab.announcementName || 'Edit Announcement'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close the tab immediately
                    const wasOnAnnouncementPage = isAnnouncementRoute;
                    const closingAnnouncementId = announcementTab.mode === 'create' ? 'new' : announcementTab.announcementId;
                    closeAnnouncementTab();
                    if (wasOnAnnouncementPage && closingAnnouncementId) {
                      setPreventAutoOpenAnnouncementId(closingAnnouncementId);
                      // Navigate to announcements list after state update
                      requestAnimationFrame(() => {
                        router.push(`/dashboard/creator/events/${eventId}/announcements`);
                      });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Book Location Tab */}
            {bookLocationTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('book-location-tab')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    router.push(`/dashboard/creator/events/${eventId}/location/book`);
                  }}
                >
                  Book location
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeBookLocationTab();
                    // If we're currently on the book location page, navigate back to location tab
                    if (pathname.includes('/location/book')) {
                      router.push(`/dashboard/creator/events/${eventId}/location`);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Dynamic Edit Event Tab */}
            {editEventTab.isOpen && (
              <div className="relative flex items-center">
                <Button
                  variant="ghost"
                  className={cn(
                    "rounded-b-none border-b-2 transition-colors pr-7",
                    isActiveTab('edit-event-tab')
                      ? "border-primary bg-muted"
                      : "border-transparent hover:border-muted-foreground/50"
                  )}
                  onClick={() => {
                    // Reset prevent flag to allow tab to stay open when navigating
                    setPreventAutoOpenEditEvent(false);
                    // Ensure tab is open if navigating to edit route
                    if (event && (!editEventTab.isOpen || editEventTab.eventName !== event.displayName)) {
                      openEditEventTab(event.displayName);
                    }
                    router.push(`/dashboard/creator/events/${eventId}/edit`);
                  }}
                >
                  Edit event
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close the tab immediately
                    const wasOnEditPage = isEditEventRoute;
                    closeEditEventTab();
                    if (wasOnEditPage) {
                      setPreventAutoOpenEditEvent(true);
                      // Navigate to event overview after state update
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

      {/* Publish Event Confirmation Dialog */}
      <AlertDialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-primary" />
              Publish Event
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-sm">
                Are you sure you want to publish this event? By publishing the event:
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Eye className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Be discoverable</p>
                    <p className="text-muted-foreground">
                      Users will be able to view and discover your event.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ticket className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Enable ticket sales</p>
                    <p className="text-muted-foreground">
                      Attendees can purchase tickets and register.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Megaphone className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Join public listings</p>
                    <p className="text-muted-foreground">
                      The event will appear in public event listings.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <UserCheck className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Manage attendance</p>
                    <p className="text-muted-foreground">
                      Track attendance and manage registrations with live data.
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-1 font-medium text-sm text-muted-foreground">
                Once published, you can still edit event details, but the event will be visible to the public.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishEvent.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublishConfirm}
              disabled={publishEvent.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finish Event Confirmation Dialog */}
      <AlertDialog open={isFinishDialogOpen} onOpenChange={setIsFinishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Finish Event
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-sm">
                Are you sure you want to finish this event? By finishing the event:
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Event status will change to FINISHED</p>
                    <p className="text-muted-foreground">
                      The event will no longer be active and ticket sales will stop.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Payment processing begins</p>
                    <p className="text-muted-foreground">
                      You will get paid after 1 week from the event end date.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Final attendance records</p>
                    <p className="text-muted-foreground">
                      Attendance data will be finalized and cannot be modified.
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-1 font-medium text-sm text-muted-foreground">
                This action cannot be undone. Make sure all event activities are completed before finishing.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finishEvent.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishConfirm}
              disabled={finishEvent.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {finishEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Finish
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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


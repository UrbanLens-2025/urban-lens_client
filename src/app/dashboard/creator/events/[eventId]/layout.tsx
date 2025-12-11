"use client";

import type React from "react";
import { use, useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEventById } from "@/hooks/events/useEventById";
import { usePublishEvent } from "@/hooks/events/usePublishEvent";
import { useFinishEvent } from "@/hooks/events/useFinishEvent";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { useEventLocationBookings } from "@/hooks/events/useEventLocationBookings";
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
  Sparkles,
  Calendar,
  FileCheck,
  CreditCard,
  AlertCircle,
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

  const { data: event, isLoading, isError, refetch: refetchEvent } = useEventById(eventId);
  const { data: tickets } = useEventTickets(eventId);
  const { data: locationBookings } = useEventLocationBookings(eventId);
  const publishEvent = usePublishEvent();
  const finishEvent = useFinishEvent();

  const handlePublishClick = () => {
    setIsPublishDialogOpen(true);
  };

  const handlePublishConfirm = () => {
    if (event && event.status === "DRAFT") {
      // Double-check all requirements before publishing
      if (!hasNameAndDescription) {
        toast.error("Please add event name and description before publishing.");
        setIsPublishDialogOpen(false);
        return;
      }
      if (!hasDates) {
        toast.error("Please set event dates and times before publishing.");
        setIsPublishDialogOpen(false);
        return;
      }
      // Location is required for publishing
      if (!hasLocation) {
        toast.error("Please select a location before publishing the event.");
        setIsPublishDialogOpen(false);
        return;
      }
      // If location bookings exist, they must be approved and paid
      if (hasLocationBookings && !hasBusinessApproval) {
        toast.error("Business owner must approve the location booking before publishing the event. Please wait for approval.");
        setIsPublishDialogOpen(false);
        return;
      }
      if (hasLocationBookings && !hasPaymentMade) {
        toast.error("Payment must be completed before publishing the event. Please complete the payment for your location booking first.");
        setIsPublishDialogOpen(false);
        return;
      }
      if (!hasDocuments) {
        toast.error("Please submit event validation documents before publishing.");
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
  // Check if event has locationId OR if there's an active (non-cancelled) location booking
  const hasLocationFromEvent = !!event?.locationId;
  const hasLocationFromBooking = useMemo(() => {
    if (locationBookings && locationBookings.length > 0) {
      return locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        // Exclude cancelled bookings
        if (status === "CANCELLED") return false;
        return !!booking.location?.id;
      });
    }
    if (event?.locationBookings && event.locationBookings.length > 0) {
      return event.locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        // Exclude cancelled bookings
        if (status === "CANCELLED") return false;
        return !!booking.location?.id;
      });
    }
    return false;
  }, [locationBookings, event?.locationBookings]);
  const hasLocation = hasLocationFromEvent || hasLocationFromBooking;
  const hasDocuments = !!(event?.eventValidationDocuments && event.eventValidationDocuments.length > 0);
  
  // Check if payment has been made for location booking
  // Payment is confirmed if at least one active (non-cancelled) locationBooking has a referencedTransactionId OR status is PAYMENT_RECEIVED
  // Check both event.locationBookings (from event API) and locationBookings (from location bookings API)
  const hasPaymentMade = useMemo(() => {
    // First check locationBookings from the dedicated API (most up-to-date)
    if (locationBookings && locationBookings.length > 0) {
      const hasPaidInLocationBookings = locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        if (status === "CANCELLED") return false;
        return booking.referencedTransactionId !== null || 
               status === "PAYMENT_RECEIVED";
      });
      if (hasPaidInLocationBookings) return true;
    }
    
    // Fallback to event.locationBookings if available
    if (event?.locationBookings && event.locationBookings.length > 0) {
      return event.locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        if (status === "CANCELLED") return false;
        return booking.referencedTransactionId !== null || 
               status === "PAYMENT_RECEIVED";
      });
    }
    
    return false;
  }, [locationBookings, event?.locationBookings]);

  // Check if there are any active location bookings (exclude cancelled)
  const hasLocationBookings = useMemo(() => {
    if (locationBookings && locationBookings.length > 0) {
      return locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        return status !== "CANCELLED";
      });
    }
    if (event?.locationBookings && event.locationBookings.length > 0) {
      return event.locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        return status !== "CANCELLED";
      });
    }
    return false;
  }, [locationBookings, event?.locationBookings]);

  // Check if business owner has approved the location booking
  // Approval is confirmed if at least one active (non-cancelled) locationBooking has status APPROVED
  const hasBusinessApproval = useMemo(() => {
    // First check locationBookings from the dedicated API (most up-to-date)
    if (locationBookings && locationBookings.length > 0) {
      const hasApprovedBooking = locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        return status !== "CANCELLED" && status === "APPROVED";
      });
      if (hasApprovedBooking) return true;
    }
    
    // Fallback to event.locationBookings if available
    if (event?.locationBookings && event.locationBookings.length > 0) {
      return event.locationBookings.some(booking => {
        const status = booking.status?.toUpperCase();
        return status !== "CANCELLED" && status === "APPROVED";
      });
    }
    
    return false;
  }, [locationBookings, event?.locationBookings]);
  
  const isDraft = event?.status?.toUpperCase() === "DRAFT";
  // Location is required for publishing - must have locationId or location booking
  // Payment is only required if location booking exists and payment hasn't been made
  // If no location booking, payment requirement is skipped
  const paymentRequired = hasLocationBookings ? hasPaymentMade : true;
  // Business approval is only required if location bookings exist
  // If no location bookings, approval requirement is skipped
  const approvalRequired = hasLocationBookings ? hasBusinessApproval : true;
  // Location is required for publishing
  const canPublish = hasNameAndDescription && hasDates && hasLocation && hasDocuments && paymentRequired && approvalRequired;

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

  // Refetch event data when page becomes visible (e.g., after returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchEvent();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchEvent]);

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
                              {!hasNameAndDescription
                                ? "Add event name and description"
                                : !hasDates
                                ? "Set event dates and times"
                                : !hasLocation
                                ? "Select a location before publishing"
                                : hasLocationBookings && !hasBusinessApproval
                                ? "Business owner must approve the location booking before publishing"
                                : hasLocationBookings && !hasPaymentMade
                                ? "Complete payment for location booking before publishing"
                                : !hasDocuments
                                ? "Submit event validation documents"
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
        {isDraft && (() => {
          // Calculate total steps - location is now required
          // Base steps: Name/Description, Dates, Location, Documents (always required)
          const baseSteps = 4;
          // Business approval step: only show if location bookings exist
          const hasBusinessApprovalStep = hasLocationBookings;
          // Payment step: only show if location bookings exist AND payment failed
          const hasPaymentStep = hasLocationBookings && !hasPaymentMade;
          
          const totalSteps = baseSteps + (hasBusinessApprovalStep ? 1 : 0) + (hasPaymentStep ? 1 : 0);
          
          // Only count steps that are actually displayed
          const completedSteps = [
            hasNameAndDescription,
            hasDates,
            // Location is required - check if location is selected
            hasLocation,
            hasDocuments,
            // Only count business approval if the step is shown
            hasBusinessApprovalStep ? hasBusinessApproval : undefined,
            // Only count payment if the step is shown
            hasPaymentStep ? hasPaymentMade : undefined,
          ].filter(step => step !== undefined).filter(Boolean).length;
          
          const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/5 to-primary/10 shadow-lg overflow-hidden">
              <CardHeader className="pb-3 px-4 pt-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      {progressPercentage === 100 && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background flex items-center justify-center">
                          <CheckCircle2 className="h-1.5 w-1.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold leading-tight">
                        Ready to Publish?
                      </CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        Complete all steps below
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-background/80 backdrop-blur-sm border border-primary/20 shadow-sm flex-shrink-0">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-bold text-primary">
                        {completedSteps}
                      </span>
                      <span className="text-xs text-muted-foreground">/</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {totalSteps}
                      </span>
                    </div>
                    <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                      Steps
                    </div>
                  </div>
                </div>
                {/* Compact Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground">Progress</span>
                    <span className="text-[10px] font-bold text-primary">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full bg-muted/50 rounded-full overflow-hidden border border-border/50">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        progressPercentage === 100 
                          ? "bg-gradient-to-r from-green-500 to-green-600" 
                          : "bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                      )}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-3 px-4 pb-4">
                <div className="space-y-2.5">
                  {/* Event Details Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-1">
                        <div className="p-0.5 rounded bg-primary/10">
                          <FileText className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Event Details</span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn(
                        "group flex items-center gap-2 p-2 rounded-md border transition-all duration-200",
                        hasNameAndDescription 
                          ? "bg-gradient-to-br from-green-50/70 to-green-50/30 dark:from-green-950/15 dark:to-green-950/8 border-green-300/60 dark:border-green-800/60" 
                          : "bg-background border-border/50 hover:border-primary/30 hover:bg-accent/20"
                      )}>
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 text-[10px]",
                          hasNameAndDescription 
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary font-semibold"
                        )}>
                          {hasNameAndDescription ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <span>1</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <FileText className={cn(
                              "h-3 w-3 transition-colors flex-shrink-0",
                              hasNameAndDescription ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            )} />
                            <p className={cn(
                              "text-[11px] font-medium leading-tight",
                              hasNameAndDescription ? "text-foreground" : "text-muted-foreground"
                            )}>
                              Event Name & Description
                            </p>
                          </div>
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
                            className="shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground h-6 text-[10px] px-2 py-0"
                          >
                            Add
                          </Button>
                        )}
                      </div>

                      <div className={cn(
                        "group flex items-center gap-2 p-2 rounded-md border transition-all duration-200",
                        hasDates 
                          ? "bg-gradient-to-br from-green-50/70 to-green-50/30 dark:from-green-950/15 dark:to-green-950/8 border-green-300/60 dark:border-green-800/60" 
                          : "bg-background border-border/50 hover:border-primary/30 hover:bg-accent/20"
                      )}>
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 text-[10px]",
                          hasDates 
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary font-semibold"
                        )}>
                          {hasDates ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <span>2</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Calendar className={cn(
                              "h-3 w-3 transition-colors flex-shrink-0",
                              hasDates ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            )} />
                            <p className={cn(
                              "text-[11px] font-medium leading-tight",
                              hasDates ? "text-foreground" : "text-muted-foreground"
                            )}>
                              Event Dates & Times
                            </p>
                          </div>
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
                            className="shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground h-6 text-[10px] px-2 py-0"
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location & Booking Section - Location is required */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-1">
                        <div className="p-0.5 rounded bg-primary/10">
                          <MapPin className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Location & Booking</span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Select Location step - required */}
                      <div className={cn(
                        "group flex items-center gap-2 p-2 rounded-md border transition-all duration-200",
                        hasLocation
                          ? "bg-gradient-to-br from-green-50/70 to-green-50/30 dark:from-green-950/15 dark:to-green-950/8 border-green-300/60 dark:border-green-800/60" 
                          : "bg-background border-border/50 hover:border-primary/30 hover:bg-accent/20"
                      )}>
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 text-[10px]",
                          hasLocation
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" 
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary font-semibold"
                        )}>
                          {hasLocation ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <span>3</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <MapPin className={cn(
                              "h-3 w-3 transition-colors flex-shrink-0",
                              hasLocation ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                            )} />
                            <p className={cn(
                              "text-[11px] font-medium leading-tight",
                              hasLocation ? "text-foreground" : "text-muted-foreground"
                            )}>
                              Select Location
                            </p>
                          </div>
                        </div>
                        {!hasLocation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/creator/events/${eventId}/location`);
                            }}
                            className="shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground h-6 text-[10px] px-2 py-0"
                          >
                            Select
                          </Button>
                        )}
                      </div>

                      {/* Business Owner Approval - Only show if bookings exist */}
                      {hasLocationBookings && (
                        <div className={cn(
                          "group flex items-center gap-2 p-2 rounded-md border transition-all duration-200",
                          hasBusinessApproval 
                            ? "bg-gradient-to-br from-green-50/70 to-green-50/30 dark:from-green-950/15 dark:to-green-950/8 border-green-300/60 dark:border-green-800/60" 
                            : "bg-gradient-to-br from-amber-50/70 to-amber-50/30 dark:from-amber-950/15 dark:to-amber-950/8 border-amber-300/60 dark:border-amber-800/60"
                        )}>
                          <div className={cn(
                            "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 text-[10px]",
                            hasBusinessApproval 
                              ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" 
                              : "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm"
                          )}>
                            {hasBusinessApproval ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-2.5 w-2.5 animate-pulse" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className={cn(
                                "h-3 w-3 transition-colors flex-shrink-0",
                                hasBusinessApproval ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                              )} />
                              <p className={cn(
                                "text-[11px] font-medium leading-tight",
                                hasBusinessApproval ? "text-foreground" : "text-amber-700 dark:text-amber-300"
                              )}>
                                Business Owner Approval
                              </p>
                            </div>
                            {!hasBusinessApproval && (
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium ml-4.5 mt-0.5">
                                Awaiting approval
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Payment step - Only show if bookings exist and payment failed */}
                      {hasLocationBookings && !hasPaymentMade && (
                        <div className={cn(
                          "group flex items-center gap-2 p-2 rounded-md border transition-all duration-200",
                          "bg-gradient-to-br from-amber-50/70 to-amber-50/30 dark:from-amber-950/15 dark:to-amber-950/8 border-amber-300/60 dark:border-amber-800/60"
                        )}>
                          <div className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm text-[10px]">
                            <AlertCircle className="h-2.5 w-2.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <CreditCard className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                              <p className="text-[11px] font-medium leading-tight text-amber-700 dark:text-amber-300">
                                Complete Payment
                              </p>
                            </div>
                            <p className="text-[9px] text-amber-600 dark:text-amber-400 ml-4.5 mt-0.5">
                              Payment failed
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(`/dashboard/creator/events/${eventId}/location`);
                            }}
                            className="shrink-0 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 h-6 text-[10px] px-2 py-0"
                          >
                            Pay Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-1">
                        <div className="p-0.5 rounded bg-primary/10">
                          <FileCheck className="h-2.5 w-2.5 text-primary" />
                        </div>
                        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Documents</span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                    <div className={cn(
                      "group flex items-center gap-2 p-2 rounded-md border transition-all duration-200",
                      hasDocuments 
                        ? "bg-gradient-to-br from-green-50/70 to-green-50/30 dark:from-green-950/15 dark:to-green-950/8 border-green-300/60 dark:border-green-800/60" 
                        : "bg-background border-border/50 hover:border-primary/30 hover:bg-accent/20"
                    )}>
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 text-[10px]",
                        hasDocuments 
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm" 
                          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary font-semibold"
                      )}>
                        {hasDocuments ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <span>4</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <FileCheck className={cn(
                            "h-3 w-3 transition-colors flex-shrink-0",
                            hasDocuments ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                          )} />
                          <p className={cn(
                            "text-[11px] font-medium leading-tight",
                            hasDocuments ? "text-foreground" : "text-muted-foreground"
                          )}>
                            Submit Event Documents
                          </p>
                        </div>
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
                          className="shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground h-6 text-[10px] px-2 py-0"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

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


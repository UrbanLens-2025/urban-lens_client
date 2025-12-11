"use client";

import type React from "react";
import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocationBookingById } from "@/hooks/locations/useLocationBookingById";
import { useApproveLocationBooking } from "@/hooks/locations/useApproveLocationBooking";
import { useRejectLocationBookings } from "@/hooks/locations/useRejectLocationBookings";
import { useOwnerEventById } from "@/hooks/events/useOwnerEventById";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ImageViewer } from "@/components/shared/ImageViewer";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  User,
  ImageIcon,
  Calendar,
  Phone,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Globe,
  CreditCard,
  X,
  Sparkles,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
} from "lucide-react";
import Link from "next/link";
import { format, isSameDay, eachDayOfInterval, startOfDay, endOfDay, startOfMonth, endOfMonth, addMonths, subMonths, getDay, isSameMonth } from "date-fns";
import { formatDocumentType, cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageContainer, PageHeader } from "@/components/shared";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-3 mb-4">
      {Icon && (
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  );
}

const getStatusBadge = (status: string) => {
  const statusUpper = status?.toUpperCase();
  switch (statusUpper) {
    case "PAYMENT_RECEIVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Payment Received
        </Badge>
      );
    case "AWAITING_BUSINESS_PROCESSING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Processing
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    case "SOFT_LOCKED":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
        >
          <Clock className="h-3 w-3 mr-1" />
          Soft Locked
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() ||
            status}
        </Badge>
      );
  }
};

import { formatCurrency as formatCurrencyUtil, CurrencyDisplay } from "@/components/ui/currency-display";

// Keep local formatCurrency for backward compatibility
const formatCurrency = (amount: string, currency: string = "VND") => {
  return formatCurrencyUtil(amount, currency);
};

const formatDateTime = (iso: string) => {
  return format(new Date(iso), "MMM dd, yyyy HH:mm");
};

const formatBookingObject = (bookingObject: string | null | undefined): string => {
  if (!bookingObject) return "N/A";
  
  // Convert FOR_EVENT, FOR_OTHER, etc. to user-friendly format
  const formatted = bookingObject
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  
  return formatted;
};


export default function LocationBookingDetailPage({
  params,
}: {
  params: Promise<{ locationBookingId: string }>;
}) {
  const { locationBookingId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const { data: booking, isLoading, isError } =
    useLocationBookingById(locationBookingId);
  const approveBooking = useApproveLocationBooking();
  const rejectBookings = useRejectLocationBookings();

  // Calculate total hours
  const totalHours = useMemo(() => {
    if (!booking?.dates || booking.dates.length === 0) return 0;
    let totalMs = 0;
    booking.dates.forEach(date => {
      const start = new Date(date.startDateTime);
      const end = new Date(date.endDateTime);
      totalMs += (end.getTime() - start.getTime());
    });
    return Math.round(totalMs / (1000 * 60 * 60));
  }, [booking?.dates]);

  const canProcess = booking?.status === "AWAITING_BUSINESS_PROCESSING";

  // Get targetId from booking (could be targetId field or event.id)
  const targetId = (booking as any)?.targetId || booking?.event?.id;
  const { data: fetchedEventData, isLoading: isLoadingEvent } = useOwnerEventById(targetId);

  // Use fetched event data if available, otherwise fall back to referencedEventRequest or mock data
  const eventData = useMemo(() => {
    if (fetchedEventData) {
      return {
        eventName: fetchedEventData.displayName || "N/A",
        eventDescription: fetchedEventData.description || "",
        expectedNumberOfParticipants: fetchedEventData.expectedNumberOfParticipants || 0,
        allowTickets: fetchedEventData.allowTickets ?? false,
        status: fetchedEventData.status || "DRAFT",
        specialRequirements: booking?.referencedEventRequest?.specialRequirements || "",
        startDate: fetchedEventData.startDate,
        endDate: fetchedEventData.endDate,
        tags: fetchedEventData.tags || [],
        avatarUrl: fetchedEventData.avatarUrl,
        coverUrl: fetchedEventData.coverUrl,
        organizer: fetchedEventData.createdBy ? {
          name: `${fetchedEventData.createdBy.firstName} ${fetchedEventData.createdBy.lastName}`,
          email: fetchedEventData.createdBy.email,
          phoneNumber: fetchedEventData.createdBy.phoneNumber,
          avatarUrl: fetchedEventData.createdBy.avatarUrl,
        } : null,
        socialLinks: fetchedEventData.social || [],
        eventSocialLinks: fetchedEventData.social || [],
        createdAt: fetchedEventData.createdAt,
        updatedAt: fetchedEventData.updatedAt,
        totalReviews: fetchedEventData.totalReviews || 0,
        avgRating: fetchedEventData.avgRating || 0,
      };
    }
    
    // Fallback to referencedEventRequest if available
    if (booking?.referencedEventRequest) {
      return {
        eventName: booking.referencedEventRequest.eventName || "N/A",
        eventDescription: booking.referencedEventRequest.eventDescription || "",
        expectedNumberOfParticipants: booking.referencedEventRequest.expectedNumberOfParticipants || 0,
        allowTickets: booking.referencedEventRequest.allowTickets ?? false,
        status: booking.referencedEventRequest.status || "PENDING",
        specialRequirements: booking.referencedEventRequest.specialRequirements || "",
        organizer: booking?.createdBy ? {
          name: `${booking.createdBy.firstName} ${booking.createdBy.lastName}`,
          email: booking.createdBy.email,
          phoneNumber: booking.createdBy.phoneNumber,
        } : null,
        socialLinks: [],
        eventSocialLinks: [],
      };
    }
    
    // Final fallback to mock data
    return {
      eventName: "Bún Đậu Mẹt Tre - Food Festival 2025",
      eventDescription: "Join us for an amazing food festival featuring traditional Vietnamese cuisine. Experience the authentic flavors of bún đậu mẹt tre and other local delicacies. This event brings together food lovers and culinary enthusiasts for a day of delicious discoveries.",
      expectedNumberOfParticipants: 150,
      allowTickets: true,
      status: "APPROVED",
      specialRequirements: "Need outdoor space for food stalls, access to electricity for cooking equipment, and parking for vendors.",
      organizer: booking?.createdBy ? {
        name: `${booking.createdBy.firstName} ${booking.createdBy.lastName}`,
        email: booking.createdBy.email,
        phoneNumber: booking.createdBy.phoneNumber,
      } : null,
      socialLinks: [],
      eventSocialLinks: [],
    };
  }, [fetchedEventData, booking?.referencedEventRequest]);

  const handleProcessClick = (status: "APPROVED" | "REJECTED") => {
    setPendingStatus(status);
    setProcessDialogOpen(true);
  };

  // UUID validation helper
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleProcessConfirm = () => {
    if (!pendingStatus || !booking) return;

    const bookingId = booking.id;
    if (!bookingId || typeof bookingId !== 'string' || !isValidUUID(bookingId)) {
      console.error('Invalid booking ID:', bookingId);
      return;
    }

    if (pendingStatus === "APPROVED") {
          approveBooking.mutate(bookingId, {
            onSuccess: () => {
              setProcessDialogOpen(false);
              setPendingStatus(null);
          },
        });
    } else {
      // Reject the current booking
      rejectBookings.mutate([bookingId], {
        onSuccess: () => {
          setProcessDialogOpen(false);
          setPendingStatus(null);
        },
      });
    }
  };

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading booking details...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError || !booking) {
    return (
      <PageContainer>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-1">Error loading booking details</h3>
                <p className="text-sm text-muted-foreground">
                  Please try refreshing the page or contact support if the problem persists.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="2xl">
      {/* Header */}
      <PageHeader
        title="Booking Details"
        description={
          eventData.eventName && eventData.eventName !== "N/A"
            ? `For event: ${eventData.eventName}`
            : booking.dates && booking.dates.length > 0
            ? `${totalHours}h`
            : `Booking ID: ${booking.id.substring(0, 8)}...`
        }
        icon={Calendar}
        actions={
          <div className="flex items-center gap-3">
            {getStatusBadge(booking.status)}
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Amount</p>
                <CurrencyDisplay 
                  amount={booking.amountToPay} 
                  size="xl" 
                  variant="primary"
                  className="text-2xl"
                />
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10 shadow-md">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{totalHours} hrs</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden">
            {/* Cover Image */}
            {eventData.coverUrl && (
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={eventData.coverUrl}
                  alt="Event cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
              </div>
            )}
            
            <CardHeader className={cn("bg-white border-b border-primary/20 py-3", !eventData.coverUrl && "border-b")}>
              <div className="flex items-start gap-4">
                {/* Event Avatar */}
                {eventData.avatarUrl ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={eventData.avatarUrl}
                      alt="Event avatar"
                      className={cn(
                        "rounded-lg object-cover border-2 border-background shadow-md",
                        eventData.coverUrl ? "h-20 w-20 -mt-10" : "h-16 w-16"
                      )}
                    />
                  </div>
                ) : (
                  <div className={cn(
                    "rounded-lg bg-primary/20 flex items-center justify-center border-2 border-background shadow-md flex-shrink-0",
                    eventData.coverUrl ? "h-20 w-20 -mt-10" : "h-16 w-16"
                  )}>
                    <Sparkles className={cn("text-primary", eventData.coverUrl ? "h-8 w-8" : "h-6 w-6")} />
                  </div>
                )}
                
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-xl font-bold text-foreground">
                      {eventData.eventName}
                    </CardTitle>
                    {!fetchedEventData && !booking?.referencedEventRequest && (
                      <Badge variant="secondary" className="text-xs">Mock Data</Badge>
                    )}
                    {isLoadingEvent && (
                      <Badge variant="outline" className="text-xs">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </Badge>
                    )}
                  </div>
                  {eventData.status && (
                    <Badge variant="outline" className="mt-1.5 text-xs">
                      {eventData.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 pb-4">
              <div className="space-y-4">
                {/* Description */}
                {eventData.eventDescription && (
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {eventData.eventDescription}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Event Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Expected participants</p>
                      <p className="text-sm font-semibold">{eventData.expectedNumberOfParticipants}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={eventData.allowTickets ? "default" : "outline"} className="font-medium">
                      {eventData.allowTickets ? "Tickets Enabled" : "No Tickets"}
                    </Badge>
                  </div>
                </div>

                {/* Ratings */}
                {(eventData.avgRating > 0 || eventData.totalReviews > 0) && (
                  <div className="flex items-center gap-4">
                    {eventData.avgRating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold">{eventData.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                    {eventData.totalReviews > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {eventData.totalReviews} {eventData.totalReviews === 1 ? 'review' : 'reviews'}
                      </span>
                    )}
                  </div>
                )}

                {/* Dates */}
                {eventData.startDate && eventData.endDate && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Start Date</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(eventData.startDate), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">End Date</p>
                        <p className="text-sm text-foreground">
                          {format(new Date(eventData.endDate), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Special Requirements */}
                {eventData.specialRequirements && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Special Requirements</p>
                      <p className="text-sm text-foreground">{eventData.specialRequirements}</p>
                    </div>
                  </>
                )}

                {/* Event Social Media */}
                {eventData.eventSocialLinks && eventData.eventSocialLinks.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Social Media</p>
                      <div className="flex flex-wrap gap-2">
                        {eventData.eventSocialLinks.map((link: any, index: number) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            {link.platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Organizer */}
                {eventData.organizer && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Organizer</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {eventData.organizer.avatarUrl ? (
                            <img
                              src={eventData.organizer.avatarUrl}
                              alt="Organizer avatar"
                              className="h-10 w-10 rounded-full object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {eventData.organizer.name && (
                              <p className="text-sm font-semibold text-foreground">{eventData.organizer.name}</p>
                            )}
                            {eventData.organizer.email && (
                              <a 
                                href={`mailto:${eventData.organizer.email}`}
                                className="text-xs text-primary hover:underline block truncate"
                              >
                                {eventData.organizer.email}
                              </a>
                            )}
                            {eventData.organizer.phoneNumber && (
                              <a 
                                href={`tel:${eventData.organizer.phoneNumber}`}
                                className="text-xs text-primary hover:underline block"
                              >
                                {eventData.organizer.phoneNumber}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event Request Information */}
          {booking.referencedEventRequest && (
            <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-white border-b border-primary/20 py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  Event Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-3">
                <InfoRow
                  label="Event Name"
                  value={booking.referencedEventRequest.eventName}
                />
                <InfoRow
                  label="Event Description"
                  value={booking.referencedEventRequest.eventDescription}
                />
                <InfoRow
                  label="Expected Participants"
                  value={
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {booking.referencedEventRequest.expectedNumberOfParticipants}{" "}
                      people
                    </div>
                  }
                  icon={Users}
                />
                <InfoRow
                  label="Allow Tickets"
                  value={
                    <Badge variant={booking.referencedEventRequest.allowTickets ? "default" : "outline"}>
                      {booking.referencedEventRequest.allowTickets ? "Yes" : "No"}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Special Requirements"
                  value={booking.referencedEventRequest.specialRequirements || "None"}
                />
                <InfoRow
                  label="Event Status"
                  value={
                    <Badge variant="outline">
                      {booking.referencedEventRequest.status}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Event Request ID"
                  value={
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {booking.referencedEventRequest.id.substring(0, 8)}...
                    </span>
                  }
                />
                <InfoRow
                  label="Created At"
                  value={formatDateTime(booking.referencedEventRequest.createdAt)}
                  icon={Calendar}
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDateTime(booking.referencedEventRequest.updatedAt)}
                  icon={Clock}
                />
              </div>

              <Separator className="my-4" />
              
              {/* Event Validation Documents */}
                {booking.referencedEventRequest.eventValidationDocuments &&
                  booking.referencedEventRequest.eventValidationDocuments.length >
                    0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">
                          Event Validation Documents
                        </p>
                      </div>
                      <div className="space-y-3">
                        {booking.referencedEventRequest.eventValidationDocuments.map(
                          (doc, docIndex) => (
                            <div key={docIndex} className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/20">
                              <Badge variant="outline" className="font-medium">
                                {formatDocumentType(doc.documentType)}
                              </Badge>
                              <div className="grid grid-cols-2 gap-2">
                                {doc.documentImageUrls.map((url, imgIndex) => (
                                  <div key={imgIndex} className="relative group">
                                    <img
                                      src={url}
                                      alt={`${formatDocumentType(doc.documentType)} ${imgIndex + 1}`}
                                      onClick={() => handleImageClick(url)}
                                      className="w-full h-32 object-cover rounded-lg border-2 border-border/40 cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Location Card */}
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {booking.location.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground pl-8">
                  {booking.location.addressLine}, {booking.location.addressLevel1}
                </p>
                <Link href={`/dashboard/business/locations/${booking.locationId}`}>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Location Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Booking Calendar */}
          {booking.dates && booking.dates.length > 0 && (() => {
            // Get all unique booking dates and map them to time ranges
            const bookingDates = new Set<string>();
            const dateTimeRanges = new Map<string, Array<{ start: Date; end: Date }>>();
            
            booking.dates.forEach(dateRange => {
              const start = new Date(dateRange.startDateTime);
              const end = new Date(dateRange.endDateTime);
              const days = eachDayOfInterval({ start, end });
              
              days.forEach(day => {
                const dayKey = format(day, "yyyy-MM-dd");
                bookingDates.add(dayKey);
                
                // Calculate the time range for this specific day
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                
                // Get the actual start and end times for this day
                const actualStart = start > dayStart ? start : dayStart;
                const actualEnd = end < dayEnd ? end : dayEnd;
                
                if (!dateTimeRanges.has(dayKey)) {
                  dateTimeRanges.set(dayKey, []);
                }
                dateTimeRanges.get(dayKey)!.push({ start: actualStart, end: actualEnd });
              });
            });

            // Merge continuous time ranges for each date
            dateTimeRanges.forEach((ranges, dayKey) => {
              if (ranges.length <= 1) return;
              
              // Sort ranges by start time
              const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime());
              const merged: Array<{ start: Date; end: Date }> = [];
              
              let current = sorted[0];
              
              for (let i = 1; i < sorted.length; i++) {
                const next = sorted[i];
                // Check if current range is adjacent or overlapping with next
                // Adjacent: current.end === next.start, Overlapping: current.end >= next.start
                if (current.end.getTime() >= next.start.getTime()) {
                  // Merge: extend current range to include next
                  current = {
                    start: current.start,
                    end: current.end.getTime() > next.end.getTime() ? current.end : next.end
                  };
                } else {
                  // Not continuous, save current and start new
                  merged.push(current);
                  current = next;
                }
              }
              
              // Add the last range
              merged.push(current);
              
              // Update the map with merged ranges
              dateTimeRanges.set(dayKey, merged);
            });

            // Get calendar days for current month
            const monthStart = startOfMonth(calendarMonth);
            const monthEnd = endOfMonth(calendarMonth);
            const calendarStart = startOfDay(monthStart);
            const calendarEnd = endOfDay(monthEnd);
            
            // Get first day of week (0 = Sunday, 1 = Monday, etc.)
            const firstDayOfWeek = getDay(monthStart);
            const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
            
            // Add padding days at the start
            const paddingStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
            const allDays: (Date | null)[] = [];
            for (let i = 0; i < paddingStart; i++) {
              allDays.push(null);
            }
            daysInMonth.forEach(day => allDays.push(day));

            const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

            return (
              <TooltipProvider>
                <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-white border-b border-primary/20 py-2 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 text-base">
                      <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-primary" />
                      </div>
                      Booking Dates
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-3 px-4">
                  <div className="space-y-2">
                    <div className="text-center text-xs font-semibold text-foreground">
                      {format(calendarMonth, "MMMM yyyy")}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-0.5">
                          {day}
                        </div>
                      ))}
                      {allDays.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="aspect-square" />;
                        }
                        const dayKey = format(day, "yyyy-MM-dd");
                        const isBookingDate = bookingDates.has(dayKey);
                        const isCurrentMonth = isSameMonth(day, calendarMonth);
                        const isToday = isSameDay(day, new Date());
                        const timeRanges = isBookingDate ? dateTimeRanges.get(dayKey) || [] : [];

                        const dateCell = (
                          <div
                            key={dayKey}
                            className={cn(
                              "aspect-square flex items-center justify-center text-xs font-medium rounded transition-colors",
                              !isCurrentMonth && "text-muted-foreground/40",
                              isCurrentMonth && !isBookingDate && !isToday && "text-foreground hover:bg-muted/50",
                              isToday && !isBookingDate && "bg-primary/10 text-primary font-semibold",
                              isBookingDate && "bg-primary text-primary-foreground font-semibold"
                            )}
                          >
                            {format(day, "d")}
                          </div>
                        );

                        if (isBookingDate && timeRanges.length > 0) {
                          return (
                            <Tooltip key={dayKey}>
                              <TooltipTrigger asChild>
                                {dateCell}
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-semibold text-xs mb-1">
                                    {format(day, "MMM dd, yyyy")}
                                  </div>
                                  {timeRanges.map((range, idx) => (
                                    <div key={idx} className="text-xs">
                                      {format(range.start, "HH:mm")} - {format(range.end, "HH:mm")}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return dateCell;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </TooltipProvider>
            );
          })()}

          {/* Quick Actions */}
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="bg-white border-b border-primary/20 py-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4 space-y-3">
              <Link href={`/dashboard/business/locations/${booking.locationId}`}>
                <Button variant="outline" className="w-full font-medium" size="lg">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Location
                </Button>
              </Link>

              {/* Process Booking Actions */}
              {canProcess && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <Button
                      variant="default"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                      size="lg"
                      onClick={() => handleProcessClick("APPROVED")}
                      disabled={approveBooking.isPending || rejectBookings.isPending}
                    >
                      {approveBooking.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Booking
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full font-semibold shadow-md"
                      size="lg"
                      onClick={() => handleProcessClick("REJECTED")}
                      disabled={approveBooking.isPending || rejectBookings.isPending}
                    >
                      {rejectBookings.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Reject Booking
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ImageViewer
        src={currentImageSrc}
        alt="Enlarged preview"
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />

      {/* Process Booking Dialog */}
      <AlertDialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
            <AlertDialogHeader className="flex-1 p-0">
              <AlertDialogTitle className="text-xl font-bold text-foreground">
                {pendingStatus === "APPROVED" ? "Approve Booking" : "Reject Booking"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground mt-1">
                {pendingStatus === "APPROVED" 
                  ? "Confirm approval of this location booking request"
                  : "Confirm rejection of this location booking request"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setProcessDialogOpen(false)}
              disabled={approveBooking.isPending || rejectBookings.isPending}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-6 pt-6">
            <div className="space-y-4 pb-4">
              <div className={`flex items-center gap-3 p-4 rounded-xl ${
                pendingStatus === "APPROVED" 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" 
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
              }`}>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  pendingStatus === "APPROVED"
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-red-100 dark:bg-red-900/40"
                }`}>
                  {pendingStatus === "APPROVED" ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {pendingStatus === "APPROVED" ? "Ready to approve this booking?" : "Ready to reject this booking?"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Review the details below before confirming your decision.
                  </p>
                </div>
              </div>

              {/* Warning Message */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">Important:</span> This action cannot be undone. Please review the booking details below before confirming.
                </p>
              </div>

              {/* Booking Summary */}
              <div className="space-y-4 pt-2 pb-6">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Booking Summary</h3>
                </div>

                {/* Event Name Card */}
                <Card className="border-2 border-primary/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Event</p>
                        <p className="text-sm font-semibold text-foreground break-words">
                          {booking?.referencedEventRequest?.eventName || formatBookingObject(booking?.bookingObject) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Time Slots Card - Compact Table Format */}
                <Card className="border-2 border-primary/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Time Slots</p>
                      </div>
                    </div>
                    {(() => {
                      if (!booking?.dates || booking.dates.length === 0) {
                        return (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            No time slots available
                          </div>
                        );
                      }

                      const sortedDates = [...(booking.dates || [])].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
                      
                      // Group slots by date
                      const groupedByDate: Record<string, Array<{ start: Date; end: Date }>> = {};
                      sortedDates.forEach((dateSlot) => {
                        const startDate = new Date(dateSlot.startDateTime);
                        const endDate = new Date(dateSlot.endDateTime);
                        const dateKey = format(startDate, "yyyy-MM-dd");
                        
                        if (!groupedByDate[dateKey]) {
                          groupedByDate[dateKey] = [];
                        }
                        groupedByDate[dateKey].push({ start: startDate, end: endDate });
                      });

                      // Calculate ranges and durations for each date
                      const dateGroups = Object.entries(groupedByDate).map(([dateKey, slots]) => {
                        const sortedSlots = slots.sort((a, b) => a.start.getTime() - b.start.getTime());
                        const earliestStart = sortedSlots[0].start;
                        const latestEnd = sortedSlots[sortedSlots.length - 1].end;
                        
                        // Calculate total duration for the day
                        let totalMinutes = 0;
                        sortedSlots.forEach(slot => {
                          totalMinutes += (slot.end.getTime() - slot.start.getTime()) / (1000 * 60);
                        });
                        const totalHours = Math.round(totalMinutes / 60);
                        
                        return {
                          date: new Date(dateKey + "T00:00:00"),
                          startTime: earliestStart,
                          endTime: latestEnd,
                          duration: totalHours,
                        };
                      }).sort((a, b) => a.date.getTime() - b.date.getTime());

                      // Calculate total booking time
                      const totalBookingHours = dateGroups.reduce((sum, group) => sum + group.duration, 0);

                      return (
                        <div className="border-2 border-border/40 rounded-lg overflow-hidden shadow-sm">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold text-xs">Date</TableHead>
                                <TableHead className="font-semibold text-xs">Time Range</TableHead>
                                <TableHead className="font-semibold text-xs text-right">Duration</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dateGroups.map((group, idx) => (
                                <TableRow key={idx} className="hover:bg-muted/30">
                                  <TableCell className="font-medium text-sm">
                                    {format(group.date, "MMM dd, yyyy")}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {format(group.startTime, "HH:mm")} → {format(group.endTime, "HH:mm")}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-sm">
                                    {group.duration}h
                                  </TableCell>
                                </TableRow>
                              ))}
                              {/* Total Row */}
                              <TableRow className="bg-muted/30 border-t-2 border-border font-semibold">
                                <TableCell className="font-semibold text-sm">
                                  Total Booking Time
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm italic">
                                  {dateGroups.length} {dateGroups.length === 1 ? 'day' : 'days'}
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm text-primary">
                                  {Math.round(totalBookingHours)}h
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Amount Card */}
                <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Total Amount</p>
                          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(booking?.amountToPay || "0")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Footer at Bottom */}
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 px-6 pb-6 border-t bg-background mt-auto">
            <AlertDialogCancel 
              disabled={approveBooking.isPending || rejectBookings.isPending}
              className="min-w-[100px]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessConfirm}
              disabled={approveBooking.isPending || rejectBookings.isPending}
              className={`min-w-[140px] font-semibold shadow-md ${
                pendingStatus === "REJECTED"
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  : "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              }`}
            >
              {approveBooking.isPending || rejectBookings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingStatus === "APPROVED" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Confirm Rejection
                    </>
                  )}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}


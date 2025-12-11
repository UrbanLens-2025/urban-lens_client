"use client";

import type React from "react";
import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocationBookingById } from "@/hooks/locations/useLocationBookingById";
import { useApproveLocationBooking } from "@/hooks/locations/useApproveLocationBooking";
import { useRejectLocationBookings } from "@/hooks/locations/useRejectLocationBookings";
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
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatDocumentType } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { PageContainer, PageHeader } from "@/components/shared";
import { Separator } from "@/components/ui/separator";

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
    return Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
  }, [booking?.dates]);

  const canProcess = booking?.status === "AWAITING_BUSINESS_PROCESSING";

  // Mock event data (to be replaced when API returns event information)
  const mockEventData = {
    eventName: booking?.referencedEventRequest?.eventName || "Bún Đậu Mẹt Tre - Food Festival 2025",
    eventDescription: booking?.referencedEventRequest?.eventDescription || "Join us for an amazing food festival featuring traditional Vietnamese cuisine. Experience the authentic flavors of bún đậu mẹt tre and other local delicacies. This event brings together food lovers and culinary enthusiasts for a day of delicious discoveries.",
    expectedNumberOfParticipants: booking?.referencedEventRequest?.expectedNumberOfParticipants || 150,
    allowTickets: booking?.referencedEventRequest?.allowTickets ?? true,
    status: booking?.referencedEventRequest?.status || "APPROVED",
    specialRequirements: booking?.referencedEventRequest?.specialRequirements || "Need outdoor space for food stalls, access to electricity for cooking equipment, and parking for vendors.",
  };

  // Use mock data if referencedEventRequest doesn't exist or is missing data
  const eventData = booking?.referencedEventRequest ? {
    eventName: booking.referencedEventRequest.eventName || mockEventData.eventName,
    eventDescription: booking.referencedEventRequest.eventDescription || mockEventData.eventDescription,
    expectedNumberOfParticipants: booking.referencedEventRequest.expectedNumberOfParticipants || mockEventData.expectedNumberOfParticipants,
    allowTickets: booking.referencedEventRequest.allowTickets ?? mockEventData.allowTickets,
    status: booking.referencedEventRequest.status || mockEventData.status,
    specialRequirements: booking.referencedEventRequest.specialRequirements || mockEventData.specialRequirements,
  } : mockEventData;

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
        description={`Booking ID: ${booking.id.substring(0, 8)}...`}
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
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="bg-white border-b border-primary/20 py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                Event Information
                {!booking?.referencedEventRequest && (
                  <Badge variant="secondary" className="ml-2 text-xs">Mock Data</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {eventData.eventName}
                  </h3>
                  {eventData.eventDescription && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {eventData.eventDescription}
                    </p>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Participants</p>
                      <p className="text-sm font-semibold">{eventData.expectedNumberOfParticipants}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={eventData.allowTickets ? "default" : "outline"} className="font-medium">
                      {eventData.allowTickets ? "Tickets Enabled" : "No Tickets"}
                    </Badge>
                  </div>
                </div>
                {eventData.specialRequirements && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Special Requirements</p>
                      <p className="text-sm text-foreground">{eventData.specialRequirements}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Information */}
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="bg-white border-b border-primary/20 py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <InfoRow
                  label="Booking Type"
                  value={formatBookingObject(booking.bookingObject)}
                />
                <InfoRow
                  label="Created At"
                  value={formatDateTime(booking.createdAt)}
                  icon={Calendar}
                />
                <InfoRow
                  label="Last Updated"
                  value={formatDateTime(booking.updatedAt)}
                  icon={Clock}
                />
                {booking.softLockedUntil && (
                  <InfoRow
                    label="Soft Locked Until"
                    value={formatDateTime(booking.softLockedUntil)}
                    icon={Clock}
                  />
                )}
              </div>

              <Separator className="my-4" />
              
              {/* Booking Time Slots Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Booking Time Slots
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {booking.dates.length} slot{booking.dates.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="border-2 border-border/40 rounded-lg overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="h-9 hover:bg-muted/50">
                        <TableHead className="w-[120px] text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Time Range</TableHead>
                        <TableHead className="w-[80px] text-xs text-right font-semibold">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const sortedDates = [...booking.dates].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
                        
                        // Group by date and merge consecutive slots
                        const groupedByDate = sortedDates.reduce((acc, slot) => {
                          const dateKey = format(new Date(slot.startDateTime), "yyyy-MM-dd");
                          if (!acc[dateKey]) {
                            acc[dateKey] = [];
                          }
                          acc[dateKey].push(slot);
                          return acc;
                        }, {} as Record<string, typeof sortedDates>);
                        
                        const rows: Array<{ date: string; dateFormatted: string; ranges: Array<{ start: Date; end: Date }> }> = [];
                        
                        Object.entries(groupedByDate).forEach(([dateKey, slots]) => {
                          const firstSlot = slots[0];
                          const date = new Date(firstSlot.startDateTime);
                          const dateFormatted = format(date, "MMM dd, yyyy");
                          
                          // Sort slots by start time
                          const sortedSlots = [...slots].sort((a, b) => 
                            new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
                          );
                          
                          // Merge consecutive slots into ranges
                          const ranges: Array<{ start: Date; end: Date }> = [];
                          
                          for (let i = 0; i < sortedSlots.length; i++) {
                            const currentSlot = sortedSlots[i];
                            const currentStart = new Date(currentSlot.startDateTime);
                            const currentEnd = new Date(currentSlot.endDateTime);
                            
                            if (ranges.length === 0) {
                              ranges.push({ start: currentStart, end: currentEnd });
                            } else {
                              const lastRange = ranges[ranges.length - 1];
                              const lastEndTime = lastRange.end.getTime();
                              const currentStartTime = currentStart.getTime();
                              
                              // Check if consecutive (end time equals start time)
                              if (lastEndTime === currentStartTime) {
                                lastRange.end = currentEnd;
                              } else {
                                ranges.push({ start: currentStart, end: currentEnd });
                              }
                            }
                          }
                          
                          rows.push({ date: dateKey, dateFormatted, ranges });
                        });
                        
                        return rows.flatMap((row, rowIndex) => 
                          row.ranges.map((range, rangeIndex) => {
                            const durationMs = range.end.getTime() - range.start.getTime();
                            const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
                            const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                            const durationText = durationHours > 0 
                              ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`
                              : `${durationMinutes}m`;
                            
                            const isFirstRange = rangeIndex === 0;
                            
                            return (
                              <TableRow key={`${row.date}-${rangeIndex}`} className="h-8 transition-colors hover:bg-muted/30">
                                {isFirstRange && (
                                  <TableCell 
                                    rowSpan={row.ranges.length} 
                                    className="font-semibold text-sm align-top pt-2"
                                  >
                                    {row.dateFormatted}
                                  </TableCell>
                                )}
                                <TableCell className="font-mono text-sm font-semibold text-primary">
                                  {format(range.start, "HH:mm")} → {format(range.end, "HH:mm")}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  <Badge variant="outline" className="font-medium text-xs bg-primary/5 border-primary/20 text-primary">
                                    {durationText}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
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

          {/* Location Details */}
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="bg-white border-b border-primary/20 py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-3">
                <InfoRow
                  label="Full Address"
                  value={`${booking.location.addressLine}, ${booking.location.addressLevel1}, ${booking.location.addressLevel2}`}
                  icon={MapPin}
                />
                <InfoRow
                  label="Radius"
                  value={<span className="font-semibold">{booking.location.radiusMeters} meters</span>}
                />
              </div>

              <Separator className="my-4" />
              
              {/* Location Map */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    Location on Map
                  </p>
                </div>
                <div className="h-64 w-full rounded-lg overflow-hidden border-2 border-border/40 shadow-sm">
                  <GoogleMapsPicker
                    position={{
                      lat: parseFloat(booking.location.latitude),
                      lng: parseFloat(booking.location.longitude),
                    }}
                    onPositionChange={() => {}}
                    radiusMeters={booking.location.radiusMeters}
                    center={{
                      lat: parseFloat(booking.location.latitude),
                      lng: parseFloat(booking.location.longitude),
                    }}
                  />
                </div>
              </div>

              <Separator className="my-4" />
              
              {/* Location Images */}
              {booking.location.imageUrl && booking.location.imageUrl.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Location Images
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {booking.location.imageUrl.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Location ${index + 1}`}
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Creator Information */}
          <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader className="bg-white border-b border-primary/20 py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                Creator
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
                <img
                  src={
                    booking.createdBy.avatarUrl ||
                    booking.createdBy.creatorProfile?.avatarUrl ||
                    "/default-avatar.svg"
                  }
                  alt="avatar"
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate">
                    {booking.createdBy.firstName} {booking.createdBy.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {booking.createdBy.email}
                  </div>
                </div>
              </div>
              <div className="space-y-3">

              {booking.createdBy.phoneNumber && (
                <InfoRow
                  label="Phone"
                  value={booking.createdBy.phoneNumber}
                  icon={Phone}
                />
              )}

                {booking.createdBy.creatorProfile && (
                  <>
                    <InfoRow
                      label="Display Name"
                      value={booking.createdBy.creatorProfile.displayName}
                    />
                    {booking.createdBy.creatorProfile.description && (
                      <InfoRow
                        label="Description"
                        value={<span className="text-sm leading-relaxed">{booking.createdBy.creatorProfile.description}</span>}
                      />
                    )}
                    {booking.createdBy.creatorProfile.social &&
                      booking.createdBy.creatorProfile.social.length > 0 && (
                        <div className="pt-3 border-t border-border/40">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5" />
                            Social Links
                          </p>
                          <div className="space-y-2">
                            {booking.createdBy.creatorProfile.social.map(
                              (social, index) => (
                                <Link
                                  key={index}
                                  href={social.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                  <Globe className="h-3.5 w-3.5" />
                                  <span className="truncate">
                                    {social.platform}
                                    {social.isMain && <Badge variant="outline" className="ml-2 text-xs">Main</Badge>}
                                  </span>
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Information */}
          {booking.referencedTransaction && (
            <Card className="border-2 border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="bg-white border-b border-primary/20 py-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <div className="space-y-3">
                  <InfoRow
                    label="Transaction ID"
                    value={
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {booking.referencedTransaction.id.substring(0, 8)}...
                      </span>
                    }
                  />
                  <InfoRow
                    label="Amount"
                    value={
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(
                          booking.referencedTransaction.amount,
                          booking.referencedTransaction.currency
                        )}
                      </span>
                    }
                    icon={DollarSign}
                  />
                  <InfoRow
                    label="Type"
                    value={<span className="font-semibold">{booking.referencedTransaction.type}</span>}
                  />
                  <InfoRow
                    label="Status"
                    value={
                      <Badge
                        variant={
                          booking.referencedTransaction.status === "COMPLETED"
                            ? "default"
                            : "outline"
                        }
                        className="font-medium"
                      >
                        {booking.referencedTransaction.status}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Created At"
                    value={formatDateTime(booking.referencedTransaction.createdAt)}
                    icon={Calendar}
                  />
                </div>
                <Separator className="my-4" />
                <Link
                  href={`/dashboard/business/wallet/${booking.referencedTransaction.id}`}
                >
                  <Button variant="outline" className="w-full font-medium">
                    <CreditCard className="h-4 w-4 mr-2" />
                    View Transaction Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

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
                        const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
                        
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
                                  {Math.round(totalBookingHours * 10) / 10}h
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


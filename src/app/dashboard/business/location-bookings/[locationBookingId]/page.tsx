"use client";

import type React from "react";
import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocationBookingById } from "@/hooks/locations/useLocationBookingById";
import { useApproveLocationBooking } from "@/hooks/locations/useApproveLocationBooking";
import { useRejectLocationBookings } from "@/hooks/locations/useRejectLocationBookings";
import { useConflictingBookings } from "@/hooks/locations/useConflictingBookings";
import { useUser } from "@/hooks/user/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

const formatCurrency = (amount: string, currency: string = "VND") => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
  }).format(num);
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

// Component to display conflict item with user name fetching
function ConflictItem({ 
  conflict, 
  index 
}: { 
  conflict: { booking: any; conflictingSlots: any[] }; 
  index: number;
}) {
  // Try to get user info from createdBy first, if not available, fetch by ID
  const hasCreatedBy = conflict.booking.createdBy && 
    (conflict.booking.createdBy.firstName || conflict.booking.createdBy.email);
  
  const { user: fetchedUser, isLoading: isLoadingUser } = useUser(
    !hasCreatedBy && conflict.booking.createdById ? conflict.booking.createdById : null
  );

  const customerName = useMemo(() => {
    // First try to get from existing createdBy object
    if (conflict.booking?.createdBy) {
      const createdBy = conflict.booking.createdBy;
      if ((createdBy as any)?.creatorProfile?.displayName) {
        return (createdBy as any).creatorProfile.displayName;
      }
      if (createdBy.firstName && createdBy.lastName) {
        return `${createdBy.firstName} ${createdBy.lastName}`;
      }
      if (createdBy.email) {
        return createdBy.email;
      }
    }
    
    // If not available, try fetched user
    if (fetchedUser) {
      if (fetchedUser.firstName && fetchedUser.lastName) {
        return `${fetchedUser.firstName} ${fetchedUser.lastName}`;
      }
      if (fetchedUser.email) {
        return fetchedUser.email;
      }
    }
    
    // Fallback
    if (isLoadingUser) {
      return "Loading...";
    }
    
    return "Unknown";
  }, [conflict.booking?.createdBy, fetchedUser, isLoadingUser]);

  const eventName =
    conflict.booking?.referencedEventRequest?.eventName ||
    formatBookingObject(conflict.booking?.bookingObject) ||
    "Unknown Event";

  const bookingId = conflict.booking?.id;
  if (!bookingId) return null;

  return (
    <Link
      href={`/dashboard/business/location-bookings/${bookingId}`}
      className="flex items-start gap-2 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 rounded-md p-2 -m-2 transition-colors group"
    >
      <span className="font-medium">•</span>
      <div className="flex-1">
        <span className="font-semibold group-hover:text-orange-700 dark:group-hover:text-orange-300">
          {eventName}
        </span>
        {" "}by <span className="font-medium">{customerName}</span>
                                <span className="text-xs ml-2">
                                  ({getStatusBadge(conflict.booking?.status || "")})
                                </span>
        <span className="text-xs text-blue-600 dark:text-blue-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </span>
      </div>
    </Link>
  );
}

// Component for conflict item in dialog
function ConflictDialogItem({ 
  conflict, 
  index 
}: { 
  conflict: { booking: any; conflictingSlots: any[] }; 
  index: number;
}) {
  // Try to get user info from createdBy first, if not available, fetch by ID
  const hasCreatedBy = conflict.booking?.createdBy && 
    (conflict.booking.createdBy.firstName || conflict.booking.createdBy.email);
  
  const userIdToFetch = !hasCreatedBy && conflict.booking?.createdById 
    ? conflict.booking.createdById 
    : null;
  
  const { user: fetchedUser, isLoading: isLoadingUser } = useUser(userIdToFetch);

  const customerName = useMemo(() => {
    // First try to get from existing createdBy object
    if (conflict.booking?.createdBy) {
      const createdBy = conflict.booking.createdBy;
      if ((createdBy as any)?.creatorProfile?.displayName) {
        return (createdBy as any).creatorProfile.displayName;
      }
      if (createdBy.firstName && createdBy.lastName) {
        return `${createdBy.firstName} ${createdBy.lastName}`;
      }
      if (createdBy.email) {
        return createdBy.email;
      }
    }
    
    // If not available, try fetched user
    if (fetchedUser) {
      if (fetchedUser.firstName && fetchedUser.lastName) {
        return `${fetchedUser.firstName} ${fetchedUser.lastName}`;
      }
      if (fetchedUser.email) {
        return fetchedUser.email;
      }
    }
    
    // Fallback
    if (isLoadingUser) {
      return "Loading...";
    }
    
    return "Unknown";
  }, [conflict.booking?.createdBy, fetchedUser, isLoadingUser]);

  const eventName =
    conflict.booking?.referencedEventRequest?.eventName ||
    formatBookingObject(conflict.booking?.bookingObject) ||
    "Unknown Event";

  const bookingId = conflict.booking?.id;
  if (!bookingId) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm text-orange-900 dark:text-orange-200 truncate">{eventName}</span>
            {getStatusBadge(conflict.booking?.status || "")}
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{customerName}</span>
          </div>
        </div>
        <Link
          href={`/dashboard/business/location-bookings/${bookingId}`}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          View →
        </Link>
      </div>
      <div className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
        {conflict.conflictingSlots.slice(0, 2).map((slot, slotIdx) => (
          <div key={slotIdx} className="flex items-center gap-2">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{format(slot.start, "MMM dd, HH:mm")} - {format(slot.end, "HH:mm")}</span>
          </div>
        ))}
        {conflict.conflictingSlots.length > 2 && (
          <div className="text-xs text-muted-foreground italic pl-5">
            +{conflict.conflictingSlots.length - 2} more time slot{conflict.conflictingSlots.length - 2 > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [rejectConflictingBookings, setRejectConflictingBookings] = useState(false);

  const { data: booking, isLoading, isError } =
    useLocationBookingById(locationBookingId);
  const approveBooking = useApproveLocationBooking();
  const rejectBookings = useRejectLocationBookings();

  const canProcess = booking?.status === "AWAITING_BUSINESS_PROCESSING";

  // Fetch conflicting bookings using the dedicated API
  const { data: conflictingBookingsData } = useConflictingBookings(locationBookingId);

  // Transform conflicting bookings data for display
  const conflictingBookings = useMemo(() => {
    if (!conflictingBookingsData || conflictingBookingsData.length === 0) return [];

    // Filter out the current booking from the conflicting bookings list
    const otherConflictingBookings = conflictingBookingsData.filter(
      (conflictBooking) => conflictBooking.id !== locationBookingId
    );

    return otherConflictingBookings.map((conflictBooking) => {
      // Extract conflicting slots (all dates from the conflicting booking)
      const conflictingSlots = conflictBooking.dates?.map(d => ({
        start: new Date(d.startDateTime),
        end: new Date(d.endDateTime),
      })) || [];

      return {
        booking: conflictBooking,
        conflictingSlots,
      };
    });
  }, [conflictingBookingsData, locationBookingId]);

  const handleProcessClick = (status: "APPROVED" | "REJECTED") => {
    setPendingStatus(status);
    setRejectConflictingBookings(false);
    setProcessDialogOpen(true);
  };

  const handleProcessConfirm = () => {
    if (!pendingStatus || !booking) return;

    const bookingId = booking.id;
    if (!bookingId) return;

    if (pendingStatus === "APPROVED") {
      // If approving with conflicts and user wants to reject conflicting bookings
      if (rejectConflictingBookings && conflictingBookings.length > 0) {
        const conflictingIds = conflictingBookings.map(c => c.booking.id).filter((id): id is string => !!id);
        // First reject conflicting bookings, then approve the current one
        rejectBookings.mutate(conflictingIds, {
          onSuccess: () => {
            approveBooking.mutate(bookingId, {
              onSuccess: () => {
                setProcessDialogOpen(false);
                setPendingStatus(null);
                setRejectConflictingBookings(false);
              },
            });
          },
        });
      } else {
        // Just approve the current booking
        approveBooking.mutate(bookingId, {
          onSuccess: () => {
            setProcessDialogOpen(false);
            setPendingStatus(null);
            setRejectConflictingBookings(false);
          },
        });
      }
    } else {
      // Reject the current booking
      rejectBookings.mutate([bookingId], {
        onSuccess: () => {
          setProcessDialogOpen(false);
          setPendingStatus(null);
          setRejectConflictingBookings(false);
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading booking details</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar /> Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conflict Warning */}
              {conflictingBookings.length > 0 && (
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertTitle className="text-orange-800 dark:text-orange-300">
                    Time Slot Conflict Detected
                  </AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-400 mt-2">
                    <div className="space-y-2">
                      <p>
                        This booking overlaps with {conflictingBookings.length} other booking{conflictingBookings.length > 1 ? "s" : ""} at the same time slot{conflictingBookings.length > 1 ? "s" : ""}.
                      </p>
                      <div className="space-y-1 text-sm">
                        {conflictingBookings.map((conflict, idx) => (
                          <ConflictItem key={idx} conflict={conflict} index={idx} />
                        ))}
                      </div>
                      <p className="text-xs mt-2 italic">
                        Please review carefully before approving this booking.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <InfoRow
                label="Booking Status"
                value={getStatusBadge(booking.status)}
              />
              <InfoRow
                label="Amount"
                value={
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(booking.amountToPay)}
                  </span>
                }
                icon={DollarSign}
              />
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
                icon={Calendar}
              />
              {booking.softLockedUntil && (
                <InfoRow
                  label="Soft Locked Until"
                  value={formatDateTime(booking.softLockedUntil)}
                  icon={Clock}
                />
              )}

              {/* Booking Dates */}
              <div className="mt-6">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Booking Time Slots
                </p>
                <div className="space-y-2">
                  {booking.dates.map((dateSlot, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatDateTime(dateSlot.startDateTime)} -{" "}
                          {format(new Date(dateSlot.endDateTime), "HH:mm")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(dateSlot.startDateTime), "EEEE, MMMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Request Information */}
          {booking.referencedEventRequest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText /> Event Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  value={booking.referencedEventRequest.specialRequirements}
                />
                <InfoRow
                  label="Event Status"
                  value={
                    <Badge variant="outline">
                      {booking.referencedEventRequest.status}
                    </Badge>
                  }
                />

                {/* Event Validation Documents */}
                {booking.referencedEventRequest.eventValidationDocuments &&
                  booking.referencedEventRequest.eventValidationDocuments.length >
                    0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">
                        Event Validation Documents
                      </p>
                      <div className="space-y-4">
                        {booking.referencedEventRequest.eventValidationDocuments.map(
                          (doc, docIndex) => (
                            <div key={docIndex} className="space-y-2">
                              <Badge variant="outline">{doc.documentType}</Badge>
                              <div className="grid grid-cols-2 gap-2">
                                {doc.documentImageUrls.map((url, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={url}
                                    alt={`${doc.documentType} ${imgIndex + 1}`}
                                    onClick={() => handleImageClick(url)}
                                    className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                  />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Location Name" value={booking.location.name} />
              <InfoRow
                label="Description"
                value={booking.location.description}
              />
              <InfoRow label="Address" value={booking.location.addressLine} />
              <InfoRow
                label="Full Address"
                value={`${booking.location.addressLine}, ${booking.location.addressLevel1}, ${booking.location.addressLevel2}`}
              />
              <InfoRow
                label="Coordinates"
                value={`${booking.location.latitude}, ${booking.location.longitude}`}
              />
              <InfoRow
                label="Ownership Type"
                value={booking.location.ownershipType}
              />
              <InfoRow
                label="Radius"
                value={`${booking.location.radiusMeters} meters`}
              />
              <InfoRow
                label="Visible on Map"
                value={
                  <Badge
                    variant={booking.location.isVisibleOnMap ? "default" : "outline"}
                  >
                    {booking.location.isVisibleOnMap ? "Yes" : "No"}
                  </Badge>
                }
              />

              {/* Location Images */}
              {booking.location.imageUrl && booking.location.imageUrl.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    Location Images
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {booking.location.imageUrl.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Location ${index + 1}`}
                        onClick={() => handleImageClick(url)}
                        className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                      />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User /> Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={
                    booking.createdBy.avatarUrl ||
                    booking.createdBy.creatorProfile?.avatarUrl ||
                    "/default-avatar.svg"
                  }
                  alt="avatar"
                  className="h-12 w-12 rounded-full object-cover border"
                />
                <div>
                  <div className="font-medium">
                    {booking.createdBy.firstName} {booking.createdBy.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {booking.createdBy.email}
                  </div>
                </div>
              </div>

              {booking.createdBy.phoneNumber && (
                <InfoRow
                  label="Phone"
                  value={booking.createdBy.phoneNumber}
                  icon={Phone}
                />
              )}

              {booking.createdBy.creatorProfile && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <InfoRow
                    label="Display Name"
                    value={booking.createdBy.creatorProfile.displayName}
                  />
                  {booking.createdBy.creatorProfile.description && (
                    <InfoRow
                      label="Description"
                      value={booking.createdBy.creatorProfile.description}
                    />
                  )}
                  {booking.createdBy.creatorProfile.social &&
                    booking.createdBy.creatorProfile.social.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Social Links
                        </p>
                        <div className="space-y-1">
                          {booking.createdBy.creatorProfile.social.map(
                            (social, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Link
                                  href={social.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline truncate"
                                >
                                  {social.platform}: {social.url}
                                  {social.isMain && " (Main)"}
                                </Link>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Information */}
          {booking.referencedTransaction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard /> Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Transaction ID"
                  value={
                    <span className="font-mono text-sm">
                      {booking.referencedTransaction.id.substring(0, 8)}...
                    </span>
                  }
                />
                <InfoRow
                  label="Amount"
                  value={
                    <span className="text-lg font-semibold text-green-600">
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
                  value={booking.referencedTransaction.type}
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
                <Link
                  href={`/dashboard/business/wallet/${booking.referencedTransaction.id}`}
                >
                  <Button variant="outline" className="w-full">
                    View Transaction Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/business/locations/${booking.locationId}`}>
                <Button variant="outline" className="w-full mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Location
                </Button>
              </Link>

              {/* Process Booking Actions */}
              {canProcess && (
                <>
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleProcessClick("APPROVED")}
                    disabled={approveBooking.isPending || rejectBookings.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Booking
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleProcessClick("REJECTED")}
                    disabled={approveBooking.isPending || rejectBookings.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Booking
                  </Button>
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
        <AlertDialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingStatus === "APPROVED" ? (
                <>
                  {conflictingBookings.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {conflictingBookings.length > 0 
                    ? `Approve Booking (${conflictingBookings.length} Conflict${conflictingBookings.length > 1 ? "s" : ""})`
                    : "Approve Booking"}
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-red-600" />
                  Reject Booking
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {conflictingBookings.length === 0 && (
                <p>
                  Are you sure you want to{" "}
                  <span className="font-semibold">
                    {pendingStatus === "APPROVED" ? "approve" : "reject"}
                  </span>{" "}
                  this location booking? This action cannot be undone.
                </p>
              )}

              {/* Conflict Warning in Dialog */}
              {pendingStatus === "APPROVED" && conflictingBookings.length > 0 && (
                <div className="space-y-3">
                  {/* Main Conflict Alert */}
                  <Alert className="border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <AlertTitle className="text-orange-900 dark:text-orange-200 text-base font-bold">
                      ⚠️ Time Slot Conflict Detected
                    </AlertTitle>
                    <AlertDescription className="text-orange-800 dark:text-orange-300 mt-2">
                      <p className="font-semibold">
                        This booking overlaps with {conflictingBookings.length} other active booking{conflictingBookings.length > 1 ? "s" : ""} at the same time slot{conflictingBookings.length > 1 ? "s" : ""}.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Conflicting Bookings List */}
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-semibold text-orange-900 dark:text-orange-200 text-sm">
                        Conflicting Booking{conflictingBookings.length > 1 ? "s" : ""} ({conflictingBookings.length})
                      </span>
                    </div>
                    <div className="space-y-2 max-h-28 overflow-y-auto">
                      {conflictingBookings.map((conflict, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-md p-2 border border-orange-200 dark:border-orange-800">
                          <ConflictDialogItem conflict={conflict} index={idx} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Warning and Action Box */}
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-400 dark:border-yellow-700 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1.5 text-xs">
                          ⚠️ Important Considerations
                        </p>
                        <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-0.5 list-disc list-inside">
                          <li>Approving will create a <strong>double-booking situation</strong></li>
                          <li>Both bookings will be <strong>active simultaneously</strong> at overlapping times</li>
                          <li>Consider <strong>rejecting this booking</strong> or the conflicting one(s) instead</li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* Auto-Reject Option */}
                    <div className="mt-2 pt-2 border-t border-yellow-300 dark:border-yellow-700">
                      <div className="flex items-start gap-2 bg-white dark:bg-gray-800 rounded-md p-2 border border-yellow-400 dark:border-yellow-600">
                        <Checkbox
                          id="reject-conflicts"
                          checked={rejectConflictingBookings}
                          onCheckedChange={(checked) => setRejectConflictingBookings(checked === true)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor="reject-conflicts"
                            className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 cursor-pointer block mb-1"
                          >
                            Auto-resolve: Reject {conflictingBookings.length} conflicting booking{conflictingBookings.length > 1 ? "s" : ""}
                          </label>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            The conflicting booking{conflictingBookings.length > 1 ? "s will" : " will"} be rejected first, then this booking will be approved.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Summary - Only show when no conflicts */}
              {conflictingBookings.length === 0 && (
                <div className="border-t pt-3 space-y-1.5">
                  <div className="text-sm font-semibold">Booking Summary:</div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>
                      <span className="font-medium">Event:</span>{" "}
                      {booking?.referencedEventRequest?.eventName || formatBookingObject(booking?.bookingObject) || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Time Slots:</span>
                      <div className="ml-4 mt-0.5 space-y-0.5">
                        {booking?.dates.map((dateSlot, idx) => (
                          <div key={idx} className="text-xs">
                            • {formatDateTime(dateSlot.startDateTime)} - {format(new Date(dateSlot.endDateTime), "HH:mm")}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Amount:</span>{" "}
                      {formatCurrency(booking?.amountToPay || "0")}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveBooking.isPending || rejectBookings.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessConfirm}
              disabled={approveBooking.isPending || rejectBookings.isPending}
              className={
                pendingStatus === "REJECTED"
                  ? "bg-red-600 hover:bg-red-700"
                  : conflictingBookings.length > 0 && pendingStatus === "APPROVED"
                  ? "bg-orange-600 hover:bg-orange-700"
                  : ""
              }
            >
              {approveBooking.isPending || rejectBookings.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingStatus === "APPROVED" && conflictingBookings.length > 0 && (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  Confirm {pendingStatus === "APPROVED" ? "Approval" : "Rejection"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


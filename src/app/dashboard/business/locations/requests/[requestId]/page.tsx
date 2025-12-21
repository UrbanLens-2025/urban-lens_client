"use client";

import { use, useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Building,
  Globe,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { PageContainer, PageHeader } from "@/components/shared";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import { formatDocumentType } from "@/lib/utils";
import { useCancelLocationRequest } from "@/hooks/locations/useCancelLocationRequest";

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
    <div className="flex gap-3">
      {Icon && <Icon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          {label}
        </p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default function LocationRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<{
    type: string;
    images: string[];
  } | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const { mutate: cancelRequest, isPending: isCancelling } = useCancelLocationRequest();

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  const {
    data: request,
    isLoading: isLoadingRequest,
    isError,
  } = useLocationRequestById(requestId);

  const images = request?.locationImageUrls || [];

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + images.length) % images.length
      );
    }
  };

  // If request is approved, try to find the corresponding location
  const { data: locationsData } = useMyLocations(1, "");
  const approvedLocation =
    request?.status === "APPROVED"
      ? locationsData?.data?.find(
          (loc) =>
            loc.name === request?.name &&
            Math.abs(loc.latitude - (request?.latitude || 0)) < 0.0001 &&
            Math.abs(loc.longitude - (request?.longitude || 0)) < 0.0001
        )
      : undefined;

  // Redirect to location detail if approved and location found
  useEffect(() => {
    if (request?.status === "APPROVED" && approvedLocation) {
      // Use replace with clean URL (no query parameters)
      router.replace(`/dashboard/business/locations/${approvedLocation.id}`, {
        scroll: false,
      });
    }
  }, [request?.status, approvedLocation, router]);

  if (isLoadingRequest) {
    return (
      <PageContainer>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </PageContainer>
    );
  }
  if (isError || !request) {
    return (
      <PageContainer>
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <div className="text-center py-20 text-red-500">
              Error loading request details.
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // If this request has already resulted in an approved location,
  // show a lightweight redirect state instead of the full detail UI
  // to avoid a flash before navigating to the location detail page.
  if (request.status === "APPROVED" && approvedLocation) {
    return (
      <PageContainer>
        <div className="flex h-screen flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Opening your approved location details…
          </p>
        </div>
      </PageContainer>
    );
  }

  const position = {
    lat: request.latitude,
    lng: request.longitude,
  };

  const getStatusBadge = () => {
    const statusConfig = {
      AWAITING_ADMIN_REVIEW: {
        label: "Pending Review",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      NEEDS_MORE_INFO: {
        label: "Needs Info",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      APPROVED: {
        label: "Approved",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      REJECTED: {
        label: "Rejected",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
      CANCELLED_BY_BUSINESS: {
        label: "Cancelled",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      },
      AUTO_VALIDATING: {
        label: "Validating",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
    };

    const config = statusConfig[request.status as keyof typeof statusConfig];
    if (config) {
      return <Badge className={config.className}>{config.label}</Badge>;
    }
    return <Badge>{request.status}</Badge>;
  };

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={"Location Request Details"}
        description={getStatusBadge()}
        icon={MapPin}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                router.push("/dashboard/business/location-requests")
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
          </div>
        }
      />

      {/* Rejection Alert */}
      {request.status === "REJECTED" && request.adminNotes && (
        <div className="mt-6 rounded-lg bg-red-600 text-white p-6 shadow-lg border-2 border-red-700">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-base font-semibold">
                Your report has been rejected by our admin for reason:{" "}
                <span className="font-bold bg-red-700/50 px-2 py-1 rounded">
                  {request.adminNotes}
                </span>
              </p>
              <p className="text-sm text-red-100">
                Please create another report.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="border-2 shadow-lg py-0">
              <CardContent className="p-6 space-y-6">
                {/* Image Carousel - At the top */}
                {images.length > 0 && (
                  <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden border-2 border-primary/20 shadow-md">
                    <img
                      src={images[currentImageIndex] || "/placeholder.svg"}
                      alt={`${request.name} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                      onClick={() =>
                        handleImageClick(
                          images[currentImageIndex],
                          `${request.name} - Image ${currentImageIndex + 1}`
                        )
                      }
                    />

                    {/* Carousel Navigation */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground border-2 border-primary/30 shadow-lg transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground border-2 border-primary/30 shadow-lg transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>

                        {/* Image Indicators */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? "w-8 bg-primary shadow-md"
                                  : "w-2 bg-background/60 hover:bg-primary/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Location Name and Description */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-bold text-foreground">
                      {request.name}
                    </h1>
                    <p
                      className="text-sm text-muted-foreground flex-shrink-0"
                      title={new Date(request.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    >
                      Created{" "}
                      {Math.floor(
                        (Date.now() - new Date(request.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) === 0
                        ? "today"
                        : Math.floor(
                            (Date.now() -
                              new Date(request.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          ) === 1
                        ? "1 day ago"
                        : `${Math.floor(
                            (Date.now() -
                              new Date(request.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )} days ago`}
                    </p>
                  </div>
                  {request.description && (
                    <p className="text-base text-foreground leading-relaxed text-muted-foreground">
                      {request.description}
                    </p>
                  )}
                </div>

                {/* Business Information */}
                {request.createdBy?.businessProfile && (
                  <div className="pt-4 mt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {request.createdBy.businessProfile.name && (
                        <InfoRow
                          label="Business Name"
                          value={request.createdBy.businessProfile.name}
                          icon={Building}
                        />
                      )}
                      {request.createdBy.businessProfile.email && (
                        <InfoRow
                          label="Email"
                          value={request.createdBy.businessProfile.email}
                          icon={Mail}
                        />
                      )}
                      {request.createdBy.businessProfile.phone && (
                        <InfoRow
                          label="Phone"
                          value={request.createdBy.businessProfile.phone}
                          icon={Phone}
                        />
                      )}
                      {request.createdBy.businessProfile.website && (
                        <InfoRow
                          label="Website"
                          value={
                            <a
                              href={request.createdBy.businessProfile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {request.createdBy.businessProfile.website}
                            </a>
                          }
                          icon={Globe}
                        />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-6 p-0 border-2 shadow-lg">
              <div className="h-[350px] rounded-t-lg overflow-hidden border-b-2 border-primary/20">
                <GoogleMapsPicker
                  position={position}
                  onPositionChange={() => {}}
                  readOnly={true}
                />
              </div>
              <div className="p-5 pt-0">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Address
                  </p>
                  <p className="text-sm text-foreground pl-5">
                    {request.addressLine}, {request.addressLevel1},{" "}
                    {request.addressLevel2}
                  </p>
                </div>
              </div>
            </Card>

            {/* Validation Documents Card */}
            {request.locationValidationDocuments &&
              request.locationValidationDocuments.length > 0 && (
                <Card className="border-2 shadow-lg py-0">
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        Validation Documents
                      </p>
                      <div className="space-y-2">
                        {request.locationValidationDocuments.map(
                          (doc, index) => (
                            <button
                              key={index}
                              onClick={() =>
                                setSelectedDocument({
                                  type: doc.documentType,
                                  images: doc.documentImageUrls,
                                })
                              }
                              className="w-full text-left p-3 rounded-lg border hover:border-primary/40 hover:bg-primary/80 bg-primary transition-all flex items-center gap-3 cursor-pointer"
                            >
                              <div>
                                <FileText className="size-7 text-primary-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-primary-foreground">
                                  {formatDocumentType(doc.documentType)}
                                </p>
                                <p className="text-xs text-primary-foreground mt-0.5">
                                  {doc.documentImageUrls.length} image
                                  {doc.documentImageUrls.length !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
      {/* Validation Documents Modal */}
      <Dialog
        open={selectedDocument !== null}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {selectedDocument
              ? formatDocumentType(selectedDocument.type)
              : "Validation Documents"}
          </DialogTitle>
          {selectedDocument && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {selectedDocument.images.map((url, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() =>
                    handleImageClick(
                      url,
                      `${formatDocumentType(selectedDocument.type)} - Image ${
                        index + 1
                      }`
                    )
                  }
                >
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`${formatDocumentType(
                      selectedDocument.type
                    )} - Image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Cancel Request Confirmation Modal */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will cancel your location request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                cancelRequest(requestId, {
                  onSuccess: () => {
                    setIsCancelDialogOpen(false);
                    router.push("/dashboard/business/location-requests");
                  },
                });
              }}
              disabled={isCancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, cancel request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

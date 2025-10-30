"use client"; // <-- Rất quan trọng: Phải là Client Component

import type React from "react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Hooks ---
import { useLocationRequestByIdForAdmin } from "@/hooks/admin/useLocationRequestByIdForAdmin";
import { useTags } from "@/hooks/tags/useTags";
import { useProcessLocationRequest } from "@/hooks/admin/useProcessLocationRequest";

// --- Types ---
import { LocationRequest, PaginatedData, Tag } from "@/types";

// --- UI Components ---
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  ImageIcon,
  Layers,
  Phone,
  Mail,
  Building,
  Globe,
  Tag as TagIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
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
import { Textarea } from "@/components/ui/textarea";
import { DisplayTags } from "@/components/shared/DisplayTags";

// --- Component con: InfoRow ---
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

// --- Component con: Định dạng ngày tháng ---
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Component Trang Chính ---
export default function AdminLocationRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>; // <-- Sửa: Không phải Promise
}) {
  const { requestId } = use(params); // <-- Truy cập trực tiếp
  const router = useRouter();
  const queryClient = useQueryClient(); // State cho các Modals

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState(""); // Hooks

  const {
    data: request,
    isLoading: isLoadingRequest,
    isError,
  } = useLocationRequestByIdForAdmin(requestId);
  const { data: allTagsResponse, isLoading: isLoadingTags } = useTags();
  const { mutate: processRequest, isPending: isProcessing } =
    useProcessLocationRequest();

  const isLoading = isLoadingRequest || isLoadingTags;

  // Xử lý Tags
  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTagsResponse]);

  const tags = useMemo(() => {
    if (!request?.tags || !tagsMap) {
      return [];
    }
    return request.tags
      .map((tagLink) => tagsMap.get(tagLink.tagId))
      .filter((tag): tag is Tag => !!tag)
      .map((tag) => ({ tag: tag }));
  }, [request?.tags, tagsMap]);

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  const handleApprove = () => {
    if (!request) return;
    processRequest(
      { id: request.id, payload: { status: "APPROVED" } },
      {
        onSuccess: () => {
          toast.success("Request approved!");
          queryClient.invalidateQueries({
            queryKey: ["pendingLocationRequests"],
          });
          setShowApproveDialog(false);
          router.push("/admin/locations");
        },
      }
    );
  };

  const handleReject = () => {
    if (!request) return;
    processRequest(
      {
        id: request.id,
        payload: { status: "REJECTED", adminNotes: adminNotes },
      },
      {
        onSuccess: () => {
          toast.success("Request rejected.");
          queryClient.invalidateQueries({
            queryKey: ["pendingLocationRequests"],
          });
          setShowRejectDialog(false);
          router.push("/admin/locations");
        },
      }
    );
  };

  // --- Xử lý Loading / Error ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (isError || !request) {
    return (
      <div className="text-center py-20 text-red-500">
        Error loading request details.
      </div>
    );
  }

  // Parse tọa độ (string -> number) cho bản đồ
  const position = {
    lat: request.latitude,
    lng: request.longitude,
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{request.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{request.type}</p>
          </div>
          <Badge
            className={cn({
              "bg-yellow-100 text-yellow-800":
                request.status === "AWAITING_ADMIN_REVIEW" ||
                request.status === "NEEDS_MORE_INFO",
              "bg-green-100 text-green-800": request.status === "APPROVED",
              "bg-red-100 text-red-800": request.status === "REJECTED",
            })}
          >
            {request.status}
          </Badge>
        </div>
        {request.status === "AWAITING_ADMIN_REVIEW" && (
          <div className="space-x-2">
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={isProcessing}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowApproveDialog(true)}
              disabled={isProcessing}
            >
              Approve
            </Button>
          </div>
        )}
      </div>
      {/* --- Grid Nội dung --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers /> Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={request.description} />
              <InfoRow
                label="Radius"
                value={`${request.radiusMeters} meters`}
              />
              <InfoRow label="Request Type" value={request.type} />
            </CardContent>
          </Card>
          {request.tags && request.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TagIcon /> Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisplayTags tags={tags} maxCount={4} />
              </CardContent>
            </Card>
          )}
          {request.adminNotes && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900 flex items-center gap-2">
                  <FileText /> Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-900">{request.adminNotes}</p>
              </CardContent>
            </Card>
          )}
          {request.createdBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User /> Creator Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Name"
                  value={`${request.createdBy.firstName} ${request.createdBy.lastName}`}
                />
                <InfoRow
                  label="Email"
                  value={request.createdBy.email}
                  icon={Mail}
                />
                <InfoRow
                  label="Phone Number"
                  value={request.createdBy.phoneNumber}
                  icon={Phone}
                />
                {request.createdBy.businessProfile && (
                  <div className="border-t pt-4 mt-4">
                    <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Building /> Business Profile
                    </p>
                    <div className="space-y-3 ml-3">
                      <InfoRow
                        label="Business Name"
                        value={request.createdBy.businessProfile.name}
                      />
                      <InfoRow
                        label="Business Email"
                        value={request.createdBy.businessProfile.email}
                        icon={Mail}
                      />
                      <InfoRow
                        label="Category"
                        value={request.createdBy.businessProfile.category}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {request.locationValidationDocuments &&
            request.locationValidationDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText /> Validation Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {request.locationValidationDocuments.map((doc, docIndex) => (
                    <div
                      key={docIndex}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <p className="font-semibold mb-3 text-sm">
                        {doc.documentType}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {doc.documentImageUrls.map((url, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={url || "/placeholder.svg"}
                            alt={`Document ${imgIndex + 1}`}
                            onClick={() =>
                              handleImageClick(url, `Document ${imgIndex + 1}`)
                            }
                            className="w-48 h-48 object-cover rounded-md border cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
        </div>
        {/* Cột Phải */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Address" value={request.addressLine} />
              <InfoRow label="District" value={request.addressLevel1} />
              <InfoRow label="City/Province" value={request.addressLevel2} />
              <InfoRow label="Latitude" value={request.latitude} />
              <InfoRow label="Longitude" value={request.longitude} />
            </CardContent>
          </Card>
          {request.locationImageUrls &&
            request.locationImageUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon /> Location Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {request.locationImageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Location ${index + 1}`}
                      onClick={() =>
                        handleImageClick(url, `Location ${index + 1}`)
                      }
                      className="w-full h-36 object-cover rounded-md border cursor-pointer"
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Map
              </CardTitle>
            </CardHeader>
            <CardContent className="h-96 rounded-lg overflow-hidden">
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* --- Modals --- */}
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this request?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This action will make the location public. Are you sure?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this request?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={isProcessing}>
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

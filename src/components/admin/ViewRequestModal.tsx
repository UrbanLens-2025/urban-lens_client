"use client";

import { useLocationRequestByIdForAdmin } from "@/hooks/admin/useLocationRequestByIdForAdmin";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { DisplayTags } from "../shared/DisplayTags";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="text-base">{value}</div>
    </div>
  );
}

interface ViewRequestModalProps {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewRequestModal({
  requestId,
  open,
  onOpenChange,
}: ViewRequestModalProps) {
  const { data: request, isLoading: isLoadingRequest } =
    useLocationRequestByIdForAdmin(requestId);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLoadingRequest ? "Loading..." : request?.name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Reviewing details for this location request.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoadingRequest || !request ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
            {/* Thông tin cơ bản */}
            <div className="p-4 border rounded-md space-y-4">
              <InfoRow
                label="Submitted By"
                value={
                  `${request.createdBy?.firstName} ${request.createdBy?.lastName}` ||
                  "N/A"
                }
              />
              <InfoRow label="Business Name" value={request.createdBy?.businessProfile?.name || "N/A"} />
              <InfoRow label="Description" value={request.description} />
              <InfoRow label="Radius (meters)" value={request.radiusMeters} />
              <InfoRow
                label="Tags"
                value={
                  <DisplayTags tags={request.tags} maxCount={4} />
                }
              />
            </div>

            {/* Thông tin địa chỉ */}
            <div className="p-4 border rounded-md space-y-4">
              <InfoRow label="Province / City" value={request.addressLevel2} />
              <InfoRow label="District / Ward" value={request.addressLevel1} />
              <InfoRow label="Street Address" value={request.addressLine} />
              <InfoRow
                label="Coordinates"
                value={`Lat: ${request.latitude}, Lng: ${request.longitude}`}
              />
            </div>

            {/* Hình ảnh */}
            <div className="p-4 border rounded-md space-y-4">
              <InfoRow
                label="Location Images"
                value={
                  <div className="flex flex-wrap gap-2">
                    {request.locationImageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Location ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                }
              />
              <InfoRow
                label="Validation Documents"
                value={
                  <div className="flex flex-wrap gap-2">
                    {request.locationValidationDocuments[0]?.documentImageUrls.map(
                      (url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Document ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-md border"
                        />
                      )
                    )}
                  </div>
                }
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useMemo } from "react";
import { useLocationRequestByIdForAdmin } from "@/hooks/useLocationRequestByIdForAdmin";
import { useTags } from "@/hooks/useTags"; // Hook để lấy tất cả tags
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
import { Badge } from "@/components/ui/badge";
import { LocationRequest, PaginatedData, Tag } from "@/types";

// --- Component con để hiển thị một dòng thông tin ---
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="text-base">{value}</div>
    </div>
  );
}

// --- Component con để hiển thị Tags ---
function DisplayTags({
  tagLinks,
  tagsMap,
}: {
  tagLinks: { tagId: number }[] | undefined;
  tagsMap: Map<number, Tag>;
}) {
  if (!tagLinks || tagLinks.length === 0)
    return <span className="text-muted-foreground">N/A</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tagLinks.map(({ tagId }) => {
        const tag = tagsMap.get(tagId);
        if (!tag)
          return (
            <Badge key={tagId} variant="destructive">
              Unknown Tag
            </Badge>
          );
        return (
          <Badge
            key={tag.id}
            variant="secondary"
            style={{ backgroundColor: tag.color, color: "#fff" }}
          >
            {tag.icon} {tag.displayName}
          </Badge>
        );
      })}
    </div>
  );
}

// --- Component Modal Chính ---
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
  // 1. Fetch dữ liệu chi tiết của request
  const { data: request, isLoading: isLoadingRequest } =
    useLocationRequestByIdForAdmin(requestId);
  // 2. Fetch tất cả tags để tra cứu
  const { data: allTagsResponse, isLoading: isLoadingTags } = useTags();

  const isLoading = isLoadingRequest || isLoadingTags;

  // 3. Tạo bảng tra cứu cho tags
  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTagsResponse]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isLoading ? "Loading..." : request?.name}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Reviewing details for this location request.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoading || !request ? (
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
                  <DisplayTags tagLinks={request.tags} tagsMap={tagsMap} />
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

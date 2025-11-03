"use client";

import type React from "react";
import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// --- Hooks ---
import { useEventRequestById } from "@/hooks/events/useEventRequestById";
import { useTags } from "@/hooks/tags/useTags"; // Vẫn cần hook này (nếu `BookableLocation` có `tags`)

// --- Types ---
import { EventRequest, PaginatedData, Tag, BookableLocation } from "@/types";

// --- UI Components ---
import { Loader2, ArrowLeft, Calendar, MapPin, User, FileText, ImageIcon, Layers, Zap, Users, Building, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { useBookableLocationById } from "@/hooks/events/useBookableLocationById";

// --- Component con: InfoRow ---
function InfoRow({ label, value, icon: Icon }: { label: string, value: React.ReactNode, icon?: React.ComponentType<{ className?: string }> }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 mb-4">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  );
}

// --- Component Trang Chính ---
export default function EventRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  // 1. Gọi hook chính để lấy Event Request
  const { data: request, isLoading: isLoadingRequest, isError } = useEventRequestById(requestId);
  
  // 2. Lấy locationId từ request
  const locationId = request?.referencedLocationBooking?.locationId;

  // 3. Gọi hook phụ để lấy chi tiết Location (tên, địa chỉ, v.v.)
  const { data: location, isLoading: isLoadingLocation } = useBookableLocationById(locationId);
  
  const { data: allTagsResponse, isLoading: isLoadingTags } = useTags();

  const isLoading = isLoadingRequest || isLoadingLocation || isLoadingTags;

  // Xử lý Tags (nếu `location` có `tags`)
//   const tagsMap = useMemo(() => {
//       const map = new Map<number, Tag>();
//       const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
//       allTags.forEach((tag) => map.set(tag.id, tag));
//       return map;
//     }, [allTagsResponse]);
  
//     const tags = useMemo(() => {
//       if (!request?.tags || !tagsMap) {
//         return [];
//       }
//       return request.tags
//         .map((tagLink) => tagsMap.get(tagLink.tagId))
//         .filter((tag): tag is Tag => !!tag)
//         .map((tag) => ({ tag: tag }));
//     }, [request?.tags, tagsMap]);


  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (isError || !request || !location) {
    return <div className="text-center py-20 text-red-500">Error loading details.</div>;
  }

//   const position = {
//     lat: location.latitude,
//     lng: location.longitude,
//   };

  return (
    <div className="space-y-8 p-6">
      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{request.eventName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Booking for: <strong>{location.name}</strong>
            </p>
          </div>
          <Badge>{request.status}</Badge>
        </div>
      </div>

      {/* --- Grid Nội dung --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Layers /> Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={request.eventDescription} />
              <InfoRow label="Expected Attendees" value={request.expectedNumberOfParticipants} icon={Users} />
              <InfoRow label="Allow Ticketing" value={request.allowTickets ? "Yes" : "No"} icon={Ticket} />
              <InfoRow label="Special Requirements" value={request.specialRequirements} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building /> Venue Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Venue Name" value={location.name} />
              <InfoRow label="Venue Address" value={location.addressLine} />
              <InfoRow label="Booking Status" value={<Badge>{request.referencedLocationBooking.status}</Badge>} />
              <InfoRow label="Amount to Pay" value={`${parseFloat(request.referencedLocationBooking.amountToPay).toLocaleString()} ${location.bookingConfig.currency}`} />
            </CardContent>
          </Card>

          {request.eventValidationDocuments && request.eventValidationDocuments.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Validation Documents</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {request.eventValidationDocuments[0]?.documentImageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Document ${index + 1}`}
                    onClick={() => handleImageClick(url)}
                    className="w-48 h-48 object-cover rounded-md border cursor-pointer"
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cột Phải */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> Location Images</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {location.imageUrl.slice(0, 4).map((url, index) => ( // Chỉ hiển thị 4 ảnh
                <img
                  key={index}
                  src={url || "/placeholder.svg"}
                  alt={`Location ${index + 1}`}
                  onClick={() => handleImageClick(url)}
                  className="w-full h-32 object-cover rounded-md border cursor-pointer"
                />
              ))}
            </CardContent>
          </Card>
          
          <Card className="sticky top-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin /> Location Map</CardTitle></CardHeader>
            <CardContent className="h-80 rounded-lg overflow-hidden">
              {/* <GoogleMapsPicker 
                position={position}
                onPositionChange={() => {}} // Chế độ chỉ xem
              /> */}
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
    </div>
  );
}
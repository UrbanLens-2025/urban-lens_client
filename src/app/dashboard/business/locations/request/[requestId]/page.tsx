"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DisplayTags } from "@/components/shared/DisplayTags";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="text-base">{value}</div>
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

  const {
    data: request,
    isLoading: isLoadingRequest,
    isError,
  } = useLocationRequestById(requestId);

  if (isLoadingRequest) {
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

  const position = {
    lat: request.latitude,
    lng: request.longitude,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{request.name}</h1>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={request.description} />
              <InfoRow
                label="Radius"
                value={`${request.radiusMeters} meters`}
              />
              <InfoRow
                label="Tags"
                value={<DisplayTags tags={request.tags} maxCount={4} />}
              />
              {request.adminNotes && (
                <InfoRow
                  label="Admin Feedback"
                  value={
                    <p className="text-destructive font-medium">
                      {request.adminNotes}
                    </p>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location Images</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {request.locationImageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Location ${index + 1}`}
                  className="w-40 h-40 object-cover rounded-md border"
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Map</CardTitle>
            </CardHeader>
            <CardContent className="h-80 rounded-lg overflow-hidden">
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

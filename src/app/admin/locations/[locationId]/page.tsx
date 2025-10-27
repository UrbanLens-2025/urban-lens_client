"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocationByIdForAdmin } from "@/hooks/admin/useLocationByIdForAdmin"; // <-- Hook của Admin
import { useTags } from "@/hooks/tags/useTags";
import { Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Location, PaginatedData, Tag } from "@/types";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="text-base">{value}</div>
    </div>
  );
}

function DisplayTags({
  tags,
  tagsMap,
}: {
  tags: { tag: Tag }[] | undefined;
  tagsMap: Map<number, Tag>;
}) {
  if (!tags || tags.length === 0)
    return <span className="text-muted-foreground">N/A</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(({ tag }) => (
        <Badge
          key={tag.id}
          variant="secondary"
          style={{ backgroundColor: tag.color, color: "#fff" }}
        >
          {tag.icon} {tag.displayName}
        </Badge>
      ))}
    </div>
  );
}

export default function AdminLocationDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();

  const { data: location, isLoading: isLoadingLocation } =
    useLocationByIdForAdmin(locationId);
  const { data: allTagsResponse, isLoading: isLoadingTags } = useTags();

  const isLoading = isLoadingLocation || isLoadingTags;

  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTagsResponse]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!location) {
    return (
      <div className="text-center py-20 text-red-500">
        Error loading location details.
      </div>
    );
  }

  const position = {
    lat: location.latitude,
    lng: location.longitude,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{location.name}</h1>
          <Badge
            variant={
              location.ownershipType === "PUBLIC_PLACE"
                ? "secondary"
                : "default"
            }
          >
            {location.ownershipType}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Description" value={location.description} />
              <InfoRow
                label="Tags"
                value={<DisplayTags tags={location.tags} tagsMap={tagsMap} />}
              />
              <InfoRow label="Address" value={location.addressLine} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Location Images</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {location.imageUrl.map((url, index) => (
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
          {location.business && (
            <Card>
              <CardHeader>
                <CardTitle>Owned By</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Business Name" value={location.business.name} />
                <InfoRow
                  label="Business Email"
                  value={location.business.email}
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Map</CardTitle>
            </CardHeader>
            <CardContent className="h-80 rounded-lg overflow-hidden">
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}} // Chế độ chỉ xem
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

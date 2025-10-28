"use client";

import { useLocationById } from "@/hooks/locations/useLocationById";
import { ArrowLeft, CalendarDays, FilePenLine, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use } from "react";

// Component con để hiển thị Tags
function DisplayTags({ tags }: { tags: { tag: Tag }[] | undefined }) {
  if (!tags || tags.length === 0) return <span className="text-muted-foreground">No tags</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(({ tag }) => (
        <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>
          {tag.icon} {tag.displayName}
        </Badge>
      ))}
    </div>
  );
}

export default function LocationDetailsPage({ params }: { params: Promise<{ locationId: string }> }) {
  const {locationId} = use(params);
  const { data: location, isLoading, isError } = useLocationById(locationId);
  const router = useRouter();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }
  if (isError || !location) {
    return <div className="text-center py-20 text-red-500">Error loading location details.</div>;
  }

  const position = {
      lat: location.latitude,
      lng: location.longitude,
  };

  return (
    <div className="space-y-8">
      {/* Header (Tên và nút Edit) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-3xl font-bold">{location.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/business/locations/${location.id}/availability`}>
            <Button variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Manage Availability
            </Button>
          </Link>
          <Link href={`/dashboard/business/locations/${location.id}/edit`}>
            <Button>
              <FilePenLine className="mr-2 h-4 w-4" />
              Edit Location
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Location Images</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {location.imageUrl.map((url, index) => (
                    <img key={index} src={url} alt={`Location image ${index + 1}`} className="w-40 h-40 object-cover rounded-md border"/>
                ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p>{location.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{location.business?.addressLine}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <Badge variant="outline">{location.business?.category}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tags</p>
                <DisplayTags tags={location.tags} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CỘT PHẢI: BẢN ĐỒ */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Map</CardTitle></CardHeader>
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
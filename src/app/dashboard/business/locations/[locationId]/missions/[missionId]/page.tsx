"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocationMissionById } from "@/hooks/missions/useLocationMissionById";
import Link from "next/link";

// --- Import UI Components ---
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Building,
  ImageIcon,
  Layers,
  Zap,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer"; // Giả sử bạn đã có
import { format } from "date-fns"; // Import date-fns

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

// --- Component Trang Chính ---
export default function MissionDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string; missionId: string }>;
}) {
  const { locationId, missionId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");

  const {
    data: mission,
    isLoading,
    isError,
  } = useLocationMissionById(missionId);

  const handleImageClick = (src: string, alt: string) => {
    setCurrentImageSrc(src);
    setCurrentImageAlt(alt);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (isError || !mission) {
    return (
      <div className="text-center py-20 text-red-500">
        Error loading mission details.
      </div>
    );
  }

  // Lấy tọa độ từ `location` lồng nhau
  const position = {
    lat: mission.location?.latitude,
    lng: mission.location?.longitude,
  };

  const now = new Date();
  const isExpired = new Date(mission.endDate) < now;
  const isScheduled = new Date(mission.startDate) > now;
  const isActive = !isExpired && !isScheduled;

  return (
    <div className="space-y-8">
      {/* --- Header --- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {isActive && <Badge className="bg-green-600">Active</Badge>}
          {isScheduled && <Badge variant="outline">Scheduled</Badge>}
          {isExpired && <Badge variant="secondary">Completed</Badge>}
        </div>
        <Link
          href={`/dashboard/business/locations/${locationId}/missions/${missionId}/edit`}
        >
          <Button>Edit Mission</Button>
        </Link>
      </div>

      {/* --- Grid Nội dung --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers /> Mission Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={mission.description} />
              <InfoRow
                label="Metric (How to complete)"
                value={<Badge variant="outline">{mission.metric}</Badge>}
                icon={Zap}
              />
              <InfoRow label="Target" value={mission.target} icon={Zap} />
              <InfoRow
                label="Reward"
                value={`${mission.reward} points`}
                icon={Star}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar /> Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <InfoRow
                label="Start Date"
                value={format(new Date(mission.startDate), "PPP p")}
              />
              <InfoRow
                label="End Date"
                value={format(new Date(mission.endDate), "PPP p")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon /> Mission Images
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {mission.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Mission image ${index + 1}`}
                  className="w-40 h-40 object-cover rounded-md border cursor-pointer"
                  onClick={() =>
                    handleImageClick(url, `Mission image ${index + 1}`)
                  }
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building /> Associated Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Address" value={mission.location?.addressLine} />
              <InfoRow
                label="District/Ward"
                value={mission.location?.addressLevel1 || "N/A"}
              />
              <InfoRow
                label="Province/City"
                value={mission.location?.addressLevel2 || "N/A"}
              />
              <InfoRow
                label="Service Radius"
                value={`${mission.location?.radiusMeters} meters`}
              />
            </CardContent>
          </Card>

          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Map
              </CardTitle>
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

      {/* --- Modal Phóng to ảnh --- */}
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}

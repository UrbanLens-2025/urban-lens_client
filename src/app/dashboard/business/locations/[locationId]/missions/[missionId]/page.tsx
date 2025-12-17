"use client";

import type React from "react";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocationMissionById } from "@/hooks/missions/useLocationMissionById";
import { useLocationTabs } from "@/contexts/LocationTabContext";

// --- Import UI Components ---
import {
  Loader2,
  CalendarDays as CalendarDaysIcon,
  Layers,
  Zap,
  Star,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DetailViewLayout } from "@/components/shared/DetailViewLayout";
import { format } from "date-fns";

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
    <div className='flex gap-3 mb-4'>
      {Icon && (
        <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1'>
        <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
        <div className='text-base text-foreground break-words'>{value}</div>
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
  const { openMissionDetailTab } = useLocationTabs();

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

  // Update tab name when mission data loads
  useEffect(() => {
    if (mission && mission.title) {
      openMissionDetailTab(missionId, 'View Mission');
    }
  }, [mission, missionId, openMissionDetailTab]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !mission) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
        <p>We couldn&apos;t load this mission. It may have been removed.</p>
      </div>
    );
  }

  const now = new Date();
  const isExpired = new Date(mission.endDate) < now;
  const isScheduled = new Date(mission.startDate) > now;
  const isActive = !isExpired && !isScheduled;

  const badges = (
    <>
      {isActive && <Badge className='bg-green-600'>Active</Badge>}
      {isScheduled && <Badge variant='outline'>Scheduled</Badge>}
      {isExpired && <Badge variant='secondary'>Completed</Badge>}
    </>
  );

  const mainContent = (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Layers /> Mission Details
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <InfoRow label='Description' value={mission.description} />
          <InfoRow label='Target' value={mission.target} icon={Zap} />
          <InfoRow
            label='Reward'
            value={`${mission.reward} points`}
            icon={Star}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CalendarDaysIcon /> Duration
          </CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-4'>
          <InfoRow
            label='Start Date'
            value={format(new Date(mission.startDate), 'PPP p')}
          />
          <InfoRow
            label='End Date'
            value={format(new Date(mission.endDate), 'PPP p')}
          />
        </CardContent>
      </Card>

      {mission.imageUrls && mission.imageUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ImageIcon /> Mission Images
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-wrap gap-2'>
            {mission.imageUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Mission image ${index + 1}`}
                className='w-40 h-40 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity'
                onClick={() =>
                  handleImageClick(url, `Mission image ${index + 1}`)
                }
              />
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );

  return (
    <>
      <DetailViewLayout
        title={mission.title}
        badges={badges}
        onClose={() => {
          router.push(`/dashboard/business/locations/${locationId}/missions`);
        }}
        onEdit={() => {
          router.push(
            `/dashboard/business/locations/${locationId}/missions/${missionId}/edit`
          );
        }}
        editLabel='Edit Mission'
        mainContent={mainContent}
        location={mission.location}
        onImageClick={(src) => handleImageClick(src, 'Mission image')}
      />
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </>
  );
}

"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAnnouncementById } from "@/hooks/announcements/useAnnouncementById";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { useLocationTabs } from "@/contexts/LocationTabContext";
import {
    Loader2,
    CalendarDays as CalendarDaysIcon,
    Clock,
    Megaphone,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { useState, useEffect } from "react";
import { DetailViewLayout } from "@/components/shared/DetailViewLayout";

export default function AnnouncementDetailPage({
    params,
}: {
    params: Promise<{ locationId: string; announcementId: string }>;
}) {
    const { locationId, announcementId } = use(params);
    const router = useRouter();
    const { openAnnouncementDetailTab } = useLocationTabs();
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [currentImageSrc, setCurrentImageSrc] = useState<string>("");

    const {
        data: announcement,
        isLoading,
        isError,
    } = useAnnouncementById(announcementId);
    const {
        data: location,
        isLoading: isLoadingLocation,
    } = useLocationById(locationId);

    const handleImageClick = (url: string) => {
        setCurrentImageSrc(url);
        setIsImageViewerOpen(true);
    };

    // Update tab name when announcement data loads - use generic name
    useEffect(() => {
        if (announcement) {
            openAnnouncementDetailTab(announcementId, 'View Announcement');
        }
    }, [announcement, announcementId, openAnnouncementDetailTab]);

    if (isLoading || isLoadingLocation) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (isError || !announcement) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center text-muted-foreground">
                <p>We couldn&apos;t load this announcement. It may have been removed.</p>
            </div>
        );
    }

    const isActive =
        announcement.startDate &&
        announcement.endDate &&
        new Date(announcement.startDate) <= new Date() &&
        new Date(announcement.endDate) >= new Date();

    const isUpcoming =
        announcement.startDate && new Date(announcement.startDate) > new Date();

    const isExpired =
        announcement.endDate && new Date(announcement.endDate) < new Date();

    function InfoRow({
        label,
        value,
        icon: Icon,
    }: {
        label: string;
        value: React.ReactNode;
        icon?: React.ComponentType<{ className?: string }>;
    }) {
        if (value === undefined || value === null || value === '') return null;
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

    const badges = (
        <Badge
            variant={
                announcement.isHidden
                    ? "secondary"
                    : isActive
                        ? "default"
                        : isUpcoming
                            ? "outline"
                            : "destructive"
            }
            className="shrink-0"
        >
            {announcement.isHidden
                ? "Hidden"
                : isActive
                    ? "Active"
                    : isUpcoming
                        ? "Upcoming"
                        : "Expired"}
        </Badge>
    );

    const mainContent = (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Megaphone /> Announcement Details
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <InfoRow label='Description' value={announcement.description} />
                    {announcement.imageUrl && (
                        <div>
                            <p className='text-sm font-semibold text-muted-foreground mb-2'>
                                Image
                            </p>
                            <img
                                src={announcement.imageUrl}
                                alt={announcement.title}
                                className='w-full max-w-md h-auto object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity'
                                onClick={() => handleImageClick(announcement.imageUrl!)}
                            />
                            <p className='text-xs text-muted-foreground mt-2 text-center'>
                                Click image to view larger
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <CalendarDaysIcon /> Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent className='grid grid-cols-2 gap-4'>
                    <InfoRow
                        label='Start Date'
                        value={
                            announcement.startDate
                                ? formatDateTime(announcement.startDate)
                                : '—'
                        }
                    />
                    <InfoRow
                        label='End Date'
                        value={
                            announcement.endDate
                                ? formatDateTime(announcement.endDate)
                                : '—'
                        }
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Clock /> Metadata
                    </CardTitle>
                </CardHeader>
                <CardContent className='grid grid-cols-2 gap-4'>
                    <InfoRow
                        label='Created'
                        value={formatDateTime(announcement.createdAt)}
                    />
                    <InfoRow
                        label='Updated'
                        value={formatDateTime(announcement.updatedAt)}
                    />
                </CardContent>
            </Card>
        </>
    );

    return (
        <>
            <DetailViewLayout
                title={announcement.title}
                badges={badges}
                onClose={() => {
                    router.push(`/dashboard/business/locations/${locationId}/announcements`);
                }}
                onEdit={() => {
                    router.push(
                        `/dashboard/business/locations/${locationId}/announcements/${announcementId}/edit`
                    );
                }}
                editLabel='Edit Announcement'
                mainContent={mainContent}
                location={location}
                onImageClick={handleImageClick}
            />
            <ImageViewer
                src={currentImageSrc}
                alt={announcement.title}
                open={isImageViewerOpen}
                onOpenChange={setIsImageViewerOpen}
            />
        </>
    );
}

"use client";

import type React from "react";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useEventById } from "@/hooks/events/useEventById";
import { usePublishEvent } from "@/hooks/events/usePublishEvent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { DisplayTags } from "@/components/shared/DisplayTags";
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  User, 
  ImageIcon, 
  Layers, 
  Users, 
  Tag as TagIcon,
  Globe,
  FileText,
  Calendar,
  Phone,
  Edit,
  Send,
  Ticket,
} from "lucide-react";
import Link from "next/link";

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

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");

  const { data: event, isLoading, isError } = useEventById(eventId);
  const publishEvent = usePublishEvent();

  const handlePublish = () => {
    if (event && event.status === "DRAFT") {
      publishEvent.mutate(eventId);
    }
  };

  const formatDateTime = (iso: string) => new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const statusVariant = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PUBLISHED' || s === 'ACTIVE') return 'default' as const;
    if (s === 'DRAFT') return 'outline' as const;
    if (s === 'COMPLETED') return 'secondary' as const;
    if (s === 'CANCELLED') return 'destructive' as const;
    return 'secondary' as const;
  };

  const handleImageClick = (src: string) => {
    setCurrentImageSrc(src);
    setIsImageViewerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading event details</p>
          <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{event.displayName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created {formatDateTime(event.createdAt)}
            </p>
          </div>
          <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {event.status === "DRAFT" && (
            <Button
              variant="default"
              onClick={handlePublish}
              disabled={publishEvent.isPending}
            >
              {publishEvent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Event
                </>
              )}
            </Button>
          )}
          <Link href={`/dashboard/creator/events/${eventId}/tickets/create`}>
            <Button variant="default">
              <Ticket className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </Link>
          <Link href={`/dashboard/creator/events/${eventId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers /> Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={event.description} />
              
              {event.tags && event.tags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((eventTag) => (
                      <Badge 
                        key={eventTag.id} 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${eventTag.tag.color}20`,
                          borderColor: eventTag.tag.color,
                          color: eventTag.tag.color
                        }}
                        className="flex items-center gap-1"
                      >
                        <span>{eventTag.tag.icon}</span>
                        <span>{eventTag.tag.displayName}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {event.social && event.social.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Social Links
                  </p>
                  <div className="space-y-2">
                    {event.social.map((social, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{social.platform}</Badge>
                        <a 
                          href={social.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {social.url}
                        </a>
                        {social.isMain && (
                          <Badge variant="secondary" className="text-xs">Main</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.refundPolicy && (
                <InfoRow label="Refund Policy" value={event.refundPolicy} icon={FileText} />
              )}

              {event.termsAndConditions && (
                <InfoRow label="Terms and Conditions" value={event.termsAndConditions} icon={FileText} />
              )}
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin /> Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Location Name" value={event.location?.name} />
              <InfoRow label="Description" value={event.location?.description} />
              <InfoRow label="Address" value={event.location?.addressLine} />
              <InfoRow label="Area" value={`${event.location?.addressLevel1}, ${event.location?.addressLevel2}`} />
              <InfoRow label="Coordinates" value={`${event.location?.latitude}, ${event.location?.longitude}`} />
              <InfoRow label="Visibility" value={event.location?.isVisibleOnMap ? "Visible on map" : "Hidden"} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User /> Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <img 
                  src={event.createdBy?.avatarUrl || "/default-avatar.svg"} 
                  alt="avatar" 
                  className="h-10 w-10 rounded-full object-cover border" 
                />
                <div>
                  <div className="font-medium">
                    {event.createdBy?.firstName} {event.createdBy?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.createdBy?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> {event.createdBy?.phoneNumber}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Images */}
          {event.location?.imageUrl && event.location.imageUrl.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon /> Location Images
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {event.location.imageUrl.slice(0, 4).map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Location ${index + 1}`}
                    onClick={() => handleImageClick(url)}
                    className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Event Request Link */}
          {event.referencedEventRequestId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar /> Related Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/creator/request/${event.referencedEventRequestId}`}>
                  <Button variant="outline" className="w-full">
                    View Event Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
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


"use client";

import { useLocationById } from "@/hooks/locations/useLocationById";
import {
  ArrowLeft,
  CalendarDays,
  FilePenLine,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Eye,
  EyeOff,
  Layers,
  ImageIcon,
  Building,
  Calendar,
  Tag,
  Rocket,
  Ticket,
  DollarSign,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { DisplayTags } from "@/components/shared/DisplayTags";
import type React from "react";
import { ImageViewer } from "@/components/shared/ImageViewer";

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LocationDetailsPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const { data: location, isLoading, isError } = useLocationById(locationId);
  const router = useRouter();
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState("");
  const [currentImageAlt, setCurrentImageAlt] = useState("");

  const heroImage = useMemo(
    () => location?.imageUrl?.[0] ?? "",
    [location?.imageUrl]
  );

  const totalCheckIns = useMemo(() => {
    const parsed = Number(location?.totalCheckIns ?? "0");
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [location?.totalCheckIns]);

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
  if (isError || !location) {
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <p className="text-sm text-muted-foreground">Back to locations</p>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-lg">
        {heroImage && (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={location.name}
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/20" />
          </div>
        )}

        <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-white/35 backdrop-blur">
                  {location.isVisibleOnMap ? (
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Visible on map
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Hidden from map
                    </span>
                  )}
                </Badge>
                <Badge variant="secondary" className="bg-white/35 backdrop-blur">
                  Created {formatDate(location.createdAt)}
                </Badge>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {location.name}
                </h1>
                <p className="mt-3 max-w-xl text-base text-white/80 sm:text-lg">
                  {location.description || "No description provided for this location."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <MapPin className="h-4 w-4" />
                <span>{location.addressLine}</span>
                <span>•</span>
                <span>
                  {location.addressLevel2}, {location.addressLevel1}
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
              >
                <Link href={`/dashboard/business/locations/${location.id}/edit`}>
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Edit Location
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
              >
                <Link
                  href={`/dashboard/business/locations/${location.id}/booking-config`}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Booking Config
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={`/dashboard/business/locations/${location.id}/vouchers`}>
              <Button
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
              >
                <Ticket className="mr-2 h-4 w-4" />
                Manage Vouchers
              </Button>
            </Link>
            <Link href={`/dashboard/business/locations/${location.id}/missions`}>
              <Button
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Manage Missions
              </Button>
            </Link>
            <Link
              href={`/dashboard/business/locations/${location.id}/availability`}
            >
              <Button
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Manage Availability
              </Button>
            </Link>
            <Link
              href={`/dashboard/business/locations/${location.id}/booking-config`}
            >
              <Button
                variant="secondary"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Booking Config
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total check-ins
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <p className="text-2xl font-semibold">{totalCheckIns.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Visibility status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            {location.isVisibleOnMap ? (
              <>
                <Eye className="h-5 w-5 text-emerald-500" />
                <p className="text-lg font-semibold text-emerald-600">
                  Visible on map
                </p>
              </>
            ) : (
              <>
                <EyeOff className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Hidden from map
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Service radius
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="text-lg font-semibold">{location.radiusMeters} m</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last updated
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <p className="text-lg font-semibold">
              {formatDate(location.updatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: DETAILS */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <InfoRow
                label="Description"
                value={location.description || "No description"}
              />
              <InfoRow
                label="Category"
                value={location.business?.category || "N/A"}
              />
              <InfoRow
                label="Total Check-ins"
                value={location.totalCheckIns || "0"}
              />
              <InfoRow
                label="Visibility"
                value={
                  location.isVisibleOnMap ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Visible on map</span>
                      <Eye className="h-4 w-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Hidden from map</span>
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    </div>
                  )
                }
              />
            </CardContent>
          </Card>

          {/* Tags */}
          {location.tags && location.tags.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisplayTags tags={location.tags} maxCount={12} />
              </CardContent>
            </Card>
          )}

          {/* Business Information */}
          {location.business && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {location.business.avatar && (
                    <img
                      src={location.business.avatar || "/placeholder.svg"}
                      alt={location.business.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {location.business.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {location.business.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  {location.business.email && (
                    <InfoRow
                      label="Email"
                      value={location.business.email}
                      icon={Mail}
                    />
                  )}
                  {location.business.phone && (
                    <InfoRow
                      label="Phone"
                      value={location.business.phone}
                      icon={Phone}
                    />
                  )}
                  {location.business.website && (
                    <InfoRow
                      label="Website"
                      value={
                        <a
                          href={location.business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {location.business.website}
                        </a>
                      }
                      icon={Globe}
                    />
                  )}
                </div>

                {location.business.licenseNumber && (
                  <div className="space-y-3 pt-4 border-t">
                    <InfoRow
                      label="License Type"
                      value={location.business.licenseType}
                    />
                    <InfoRow
                      label="License Number"
                      value={location.business.licenseNumber}
                    />
                    <InfoRow
                      label="License Expiration"
                      value={formatDate(
                        location.business.licenseExpirationDate
                      )}
                    />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <InfoRow
                    label="Status"
                    value={
                      <Badge
                        variant={
                          location.business.status === "APPROVED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {location.business.status}
                      </Badge>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Created" value={formatDate(location.createdAt)} />
              <InfoRow
                label="Last Updated"
                value={formatDate(location.updatedAt)}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: ADDRESS, MAP, AND STATS */}
        <div className="space-y-6">
          {/* Address Information */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Address" value={location.addressLine} />
              <InfoRow
                label="District/Ward"
                value={location.addressLevel1 || "N/A"}
              />
              <InfoRow
                label="Province/City"
                value={location.addressLevel2 || "N/A"}
              />
              <InfoRow label="Latitude" value={location.latitude} />
              <InfoRow label="Longitude" value={location.longitude} />
              <InfoRow
                label="Service Radius"
                value={`${location.radiusMeters} meters`}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {location.imageUrl && location.imageUrl.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Location Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {location.imageUrl.map((url, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Location image ${index + 1}`}
                        onClick={() =>
                          handleImageClick(url, `Location ${index + 1}`)
                        }
                        className="w-full h-36 object-cover rounded-md border cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Image {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card className="border-border/60 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Map
              </CardTitle>
            </CardHeader>
            <CardContent className="h-96 rounded-lg overflow-hidden">
              <GoogleMapsPicker
                position={position}
                onPositionChange={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <ImageViewer
        src={currentImageSrc}
        alt={currentImageAlt}
        open={isImageViewerOpen}
        onOpenChange={setIsImageViewerOpen}
      />
    </div>
  );
}

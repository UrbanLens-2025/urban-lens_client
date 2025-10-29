"use client"

import { useLocationById } from "@/hooks/locations/useLocationById"
import { ArrowLeft, CalendarDays, FilePenLine, Loader2, MapPin, Phone, Mail, Globe, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker"
import { Badge } from "@/components/ui/badge"
import type { Tag } from "@/types"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { use } from "react"

function DisplayTags({ tags }: { tags: { tag: Tag }[] | undefined }) {
  if (!tags || tags.length === 0) return <span className="text-muted-foreground">No tags</span>
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag }) => (
        <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: "#fff" }}>
          {tag.icon} {tag.displayName}
        </Badge>
      ))}
    </div>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function LocationDetailsPage({ params }: { params: Promise<{ locationId: string }> }) {
  const { locationId } = use(params)
  const { data: location, isLoading, isError } = useLocationById(locationId)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  if (isError || !location) {
    return <div className="text-center py-20 text-red-500">Error loading location details.</div>
  }

  const position = {
    lat: location.latitude,
    lng: location.longitude,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {location.ownershipType === "OWNED_BY_BUSINESS" ? "Business Owned" : "User Owned"}
            </p>
          </div>
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
        {/* LEFT COLUMN: DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1">{location.description || "No description"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <Badge variant="outline" className="mt-1">
                  {location.business?.category || "N/A"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tags</p>
                <div className="mt-2">
                  <DisplayTags tags={location.tags} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Check-ins</p>
                <p className="mt-1 text-lg font-semibold">{location.totalCheckIns || "0"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visibility</p>
                <div className="flex items-center gap-2 mt-1">
                  {location.isVisibleOnMap ? (
                    <>
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Visible on map</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Hidden from map</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Location Images</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {location.imageUrl && location.imageUrl.length > 0 ? (
                location.imageUrl.map((url, index) => (
                  <img
                    key={index}
                    src={url || "/placeholder.svg"}
                    alt={`Location image ${index + 1}`}
                    className="w-40 h-40 object-cover rounded-md border"
                  />
                ))
              ) : (
                <span className="text-muted-foreground">No images</span>
              )}
            </CardContent>
          </Card>

          {/* Business Information */}
          {location.business && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
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
                    <p className="font-semibold text-lg">{location.business.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{location.business.description}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  {location.business.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${location.business.email}`} className="text-sm hover:underline">
                        {location.business.email}
                      </a>
                    </div>
                  )}
                  {location.business.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${location.business.phone}`} className="text-sm hover:underline">
                        {location.business.phone}
                      </a>
                    </div>
                  )}
                  {location.business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={location.business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {location.business.website}
                      </a>
                    </div>
                  )}
                </div>

                {location.business.licenseNumber && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">License Type</p>
                      <p className="mt-1">{location.business.licenseType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">License Number</p>
                      <p className="mt-1 font-mono text-sm">{location.business.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">License Expiration</p>
                      <p className="mt-1">{formatDate(location.business.licenseExpirationDate)}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={location.business.status === "APPROVED" ? "default" : "secondary"} className="mt-2">
                    {location.business.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="mt-1 text-sm">{formatDate(location.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="mt-1 text-sm">{formatDate(location.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: MAP */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Map</CardTitle>
            </CardHeader>
            <CardContent className="h-96 rounded-lg overflow-hidden">
              <GoogleMapsPicker position={position} onPositionChange={() => {}} />
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <div className="flex gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p>{location.addressLine}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">District/Ward</p>
                  <p className="mt-1">{location.addressLevel1 || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Province/City</p>
                  <p className="mt-1">{location.addressLevel2 || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                  <p className="mt-1 font-mono text-sm">{location.latitude}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                  <p className="mt-1 font-mono text-sm">{location.longitude}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service Radius</p>
                <p className="mt-1">{location.radiusMeters} meters</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Check-ins</span>
                <span className="font-semibold">{location.totalCheckIns || "0"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Radius</span>
                <span className="font-semibold">{location.radiusMeters}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ownership</span>
                <Badge variant="outline" className="text-xs">
                  {location.ownershipType === "OWNED_BY_BUSINESS" ? "Business" : "User"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById"
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  ImageIcon,
  Home,
  Layers,
  Phone,
  Mail,
  Building,
  Globe,
  Ruler,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DisplayTags } from "@/components/shared/DisplayTags"

function InfoRow({
  label,
  value,
  icon: Icon,
}: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function LocationRequestDetailsPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const { requestId } = use(params)
  const router = useRouter()

  const { data: request, isLoading: isLoadingRequest, isError } = useLocationRequestById(requestId)

  if (isLoadingRequest) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  }
  if (isError || !request) {
    return <div className="text-center py-20 text-red-500">Error loading request details.</div>
  }

  const position = {
    lat: request.latitude,
    lng: request.longitude,
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
            <h1 className="text-3xl font-bold">{request.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{request.type}</p>
          </div>
          <Badge
            className={cn({
              "bg-yellow-100 text-yellow-800":
                request.status === "AWAITING_ADMIN_REVIEW" || request.status === "NEEDS_MORE_INFO",
              "bg-green-100 text-green-800": request.status === "APPROVED",
              "bg-red-100 text-red-800": request.status === "REJECTED",
            })}
          >
            {request.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Description" value={request.description} />
              <InfoRow label="Radius" value={`${request.radiusMeters} meters`} />
              <InfoRow label="Request Type" value={request.type} />
            </CardContent>
          </Card>

          {/* Tags */}
          {request.tags && request.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DisplayTags tags={request.tags} maxCount={4} />
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {request.adminNotes && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-900">{request.adminNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Creator Information */}
          {request.createdBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Creator Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  label="Name"
                  value={`${request.createdBy.firstName} ${request.createdBy.lastName}`}
                />
                <InfoRow label="Email" value={request.createdBy.email} icon={Mail} />
                <InfoRow label="Phone Number" value={request.createdBy.phoneNumber} icon={Phone} />
                {request.createdBy.businessProfile && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Business Information
                      </p>
                      <div className="space-y-3 ml-3">
                        <InfoRow label="Business Email" value={request.createdBy.businessProfile.email} icon={Mail} />
                        <InfoRow label="Business Phone" value={request.createdBy.businessProfile.phone} icon={Phone} />
                        <InfoRow
                          label="Website"
                          value={
                            request.createdBy.businessProfile.website ? (
                              <a
                              href={request.createdBy.businessProfile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              >
                                {request.createdBy.businessProfile.website}
                              </a>
                            ) : null
                          }
                          icon={Globe}
                        />
                          <InfoRow label="Business Name" value={request.createdBy.businessProfile.name} />
                        <InfoRow label="Address" value={request.createdBy.businessProfile.addressLine} />
                        <InfoRow
                          label="Description"
                          value={request.createdBy.businessProfile.description}
                        />
                        <InfoRow
                          label="License Type"
                          value={request.createdBy.businessProfile.licenseType}
                        />
                        <InfoRow
                          label="License Number"
                          value={request.createdBy.businessProfile.licenseNumber}
                        />
                        <InfoRow
                          label="License Expiration Date"
                          value={request.createdBy.businessProfile.licenseExpirationDate}
                        />
                        <InfoRow label="Category" value={request.createdBy.businessProfile.category} />
                        <InfoRow
                          label="Status"
                          value={
                            <Badge
                              className={
                                request.createdBy.businessProfile.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {request.createdBy.businessProfile.isActive ? "Active" : "Inactive"}
                            </Badge>
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validation Documents */}
          {request.locationValidationDocuments && request.locationValidationDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Validation Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {request.locationValidationDocuments.map((doc, docIndex) => (
                  <div key={docIndex} className="border-b pb-4 last:border-b-0">
                    <p className="font-semibold mb-3 text-sm">{doc.documentType}</p>
                    <div className="flex flex-wrap gap-4">
                      {doc.documentImageUrls.map((url, imgIndex) => (
                        <div key={imgIndex} className="flex flex-col gap-2">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Document ${docIndex + 1} - Image ${imgIndex + 1}`}
                            className="w-48 h-48 object-cover rounded-md border"
                          />
                          <p className="text-xs text-muted-foreground">
                            Document {docIndex + 1} - Image {imgIndex + 1}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              <InfoRow label="Created Date" value={formatDate(request.createdAt)} />
              <InfoRow label="Updated Date" value={formatDate(request.updatedAt)} />
              {request.processedBy && (
                <InfoRow
                  label="Processed By"
                  value={`${request.processedBy.firstName} ${request.processedBy.lastName}`}
                  icon={User}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Address, Images, and Map */}
        <div className="space-y-6">
          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Address" value={request.addressLine} />
              <InfoRow label="District" value={request.addressLevel1} />
              <InfoRow label="City/Province" value={request.addressLevel2} />
              <InfoRow label="Latitude" value={request.latitude} />
              <InfoRow label="Longitude" value={request.longitude} />
            </CardContent>
          </Card>

          {/* Location Images */}
          {request.locationImageUrls && request.locationImageUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Location Images
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                {request.locationImageUrls.map((url, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Location ${index + 1}`}
                      className="w-48 h-48 object-cover rounded-md border"
                    />
                    <p className="text-xs text-muted-foreground">Image {index + 1}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Map */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Map
              </CardTitle>
            </CardHeader>
            <CardContent className="h-96 rounded-lg overflow-hidden">
              <GoogleMapsPicker position={position} onPositionChange={() => {}} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

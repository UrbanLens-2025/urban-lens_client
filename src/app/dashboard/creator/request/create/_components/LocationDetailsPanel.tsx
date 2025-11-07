"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Users, 
  MessageSquare,
  Calendar,
  DollarSign,
  Clock,
  Info
} from "lucide-react";
import Image from "next/image";
import type { Tag } from "@/types";

interface LocationDetails {
  id: string;
  name: string;
  description: string;
  imageUrl: string[];
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  business: {
    name: string;
    email: string;
    phone: string;
    website?: string;
    avatar?: string;
    category: string;
  };
  tags: Tag[];
  analytics?: {
    totalCheckIns: number;
    totalReviews: number;
    averageRating: number;
  };
  bookingConfig?: {
    baseBookingPrice: string | number;
    currency: string;
    minBookingDurationMinutes: number;
    maxBookingDurationMinutes: number;
    minGapBetweenBookingsMinutes: number;
    allowBooking: boolean;
  };
}

interface LocationDetailsPanelProps {
  location: LocationDetails;
  onBookNow: () => void;
}

export function LocationDetailsPanel({ location, onBookNow }: LocationDetailsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Images */}
      {location.imageUrl && location.imageUrl.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {location.imageUrl.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className="relative aspect-video rounded-lg overflow-hidden bg-muted"
            >
              <Image
                src={url}
                alt={`${location.name} - Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{location.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-2">
                <MapPin className="h-4 w-4" />
                {location.addressLine}, {location.addressLevel1}
              </CardDescription>
            </div>
            {location.analytics && location.analytics.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{location.analytics.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{location.description}</p>

          {/* Tags */}
          {location.tags && location.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {location.tags.map((tag, index) => (
                <Badge
                  key={tag.id || index}
                  style={{ backgroundColor: tag.color, color: "#fff" }}
                >
                  <span className="mr-1">{tag.icon}</span>
                  {tag.displayName}
                </Badge>
              ))}
            </div>
          )}

          {/* Analytics */}
          {location.analytics && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{location.analytics.totalCheckIns} check-ins</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{location.analytics.totalReviews} reviews</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Booking Information */}
          {location.bookingConfig && location.bookingConfig.allowBooking && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Booking Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {location.bookingConfig.baseBookingPrice && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Base Price</span>
                    </div>
                    <p className="font-semibold text-lg text-green-600">
                      {typeof location.bookingConfig.baseBookingPrice === "string"
                        ? parseFloat(location.bookingConfig.baseBookingPrice).toLocaleString("vi-VN")
                        : location.bookingConfig.baseBookingPrice.toLocaleString("vi-VN")}{" "}
                      {location.bookingConfig.currency || "VND"}
                    </p>
                    <p className="text-xs text-muted-foreground">per hour</p>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Duration Range</span>
                  </div>
                  <p className="font-semibold">
                    {Math.floor(location.bookingConfig.minBookingDurationMinutes / 60)}h{" "}
                    {location.bookingConfig.minBookingDurationMinutes % 60}m -{" "}
                    {Math.floor(location.bookingConfig.maxBookingDurationMinutes / 60)}h{" "}
                    {location.bookingConfig.maxBookingDurationMinutes % 60}m
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min gap: {location.bookingConfig.minGapBetweenBookingsMinutes}m
                  </p>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}


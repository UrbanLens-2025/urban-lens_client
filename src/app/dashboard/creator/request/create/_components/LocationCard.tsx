"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Building2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LocationCardProps {
  location: {
    id: string;
    name: string;
    description: string;
    addressLine: string;
    addressLevel1: string;
    addressLevel2?: string;
    imageUrl?: string[];
    latitude?: string | number;
    longitude?: string | number;
    bookingConfig?: {
      baseBookingPrice: string | number;
      currency: string;
      minBookingDurationMinutes: number;
      maxBookingDurationMinutes: number;
    };
    business?: {
      name?: string;
    };
  };
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function LocationCard({ location, isSelected, onClick, compact = false }: LocationCardProps) {
  const formatPrice = (price: string | number, currency: string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numPrice)) return "Price not available";
    
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(numPrice);
    }
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(numPrice);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}m`;
  };

  const mainImage = location.imageUrl?.[0];
  const price = location.bookingConfig?.baseBookingPrice;
  const currency = location.bookingConfig?.currency || "VND";

  if (compact) {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md border-2 group",
          isSelected
            ? "border-primary shadow-md ring-2 ring-primary/20"
            : "border-transparent hover:border-border"
        )}
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="flex gap-3 p-3">
            {/* Image */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={location.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building2 className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm line-clamp-1">{location.name}</h3>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {location.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="line-clamp-1">
                  {location.addressLine}, {location.addressLevel1}
                </span>
              </div>
              {location.bookingConfig && price && (
                <div className="flex items-center gap-3 text-xs pt-1">
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatPrice(price, currency)}</span>
                    <span className="text-muted-foreground font-normal">/hr</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDuration(location.bookingConfig.minBookingDurationMinutes)} -{" "}
                      {formatDuration(location.bookingConfig.maxBookingDurationMinutes)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg border-2 group",
        isSelected
          ? "border-primary shadow-md ring-2 ring-primary/20"
          : "border-transparent hover:border-border"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={location.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          {isSelected && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{location.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {location.description}
            </p>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">
              {location.addressLine}, {location.addressLevel1}
            </span>
          </div>

          {/* Booking Info */}
          {location.bookingConfig && (
            <div className="flex items-center gap-4 text-sm pt-2 border-t">
              {price && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {formatPrice(price, currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">/hr</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">
                  {formatDuration(location.bookingConfig.minBookingDurationMinutes)} - {" "}
                  {formatDuration(location.bookingConfig.maxBookingDurationMinutes)}
                </span>
              </div>
            </div>
          )}

          {/* Business Name */}
          {location.business?.name && (
            <div className="text-xs text-muted-foreground pt-1 border-t">
              Hosted by {location.business.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

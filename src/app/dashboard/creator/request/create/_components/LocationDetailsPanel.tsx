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
  Calendar
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

          {/* Business Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Hosted by {location.business.name}
            </h4>
            <div className="space-y-2 text-sm">
              {location.business.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{location.business.phone}</span>
                </div>
              )}
              {location.business.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{location.business.email}</span>
                </div>
              )}
              {location.business.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={location.business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
              <Badge variant="outline">{location.business.category}</Badge>
            </div>
          </div>

          <Button onClick={onBookNow} className="w-full" size="lg">
            <Calendar className="mr-2 h-4 w-4" />
            Book This Venue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useMemo, useRef, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { Card } from "@/components/ui/card";
import { MapPin as MapPinIcon, Star } from "lucide-react";

interface Location {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  addressLine: string;
  addressLevel1?: string;
  addressLevel2?: string;
  imageUrl?: string[];
  bookingConfig?: {
    baseBookingPrice?: string | number;
    currency?: string;
    minBookingDurationMinutes?: number;
    maxBookingDurationMinutes?: number;
  };
  business?: {
    name?: string;
  };
  totalCheckIns?: string | number;
  analytics?: {
    totalCheckIns?: number;
    totalReviews?: number;
    averageRating?: number;
  };
}

interface VenueMapSelectorProps {
  locations: Location[];
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
}

const DEFAULT_CENTER = { lat: 10.8231, lng: 106.6297 }; // Ho Chi Minh City center

// Component to handle map interactions
function MapController({ 
  locations, 
  selectedLocationId,
  initialCenter 
}: { 
  locations: Location[]; 
  selectedLocationId?: string;
  initialCenter: { lat: number; lng: number };
}) {
  const map = useMap();
  const hasInitialized = useRef(false);
  const lastSelectedId = useRef<string | undefined>(undefined);
  
  // Initialize center only once on mount
  useEffect(() => {
    if (map && !hasInitialized.current && locations.length > 0) {
      const validLocs = locations.filter(loc => {
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      if (validLocs.length > 0) {
        const avgLat = validLocs.reduce((sum, loc) => sum + Number(loc.latitude), 0) / validLocs.length;
        const avgLng = validLocs.reduce((sum, loc) => sum + Number(loc.longitude), 0) / validLocs.length;
        map.setCenter({ lat: avgLat, lng: avgLng });
        map.setZoom(13);
        hasInitialized.current = true;
      }
    }
  }, [locations, map]);

  // Zoom to selected location only when selection changes (not on every render)
  useEffect(() => {
    if (selectedLocationId && map && selectedLocationId !== lastSelectedId.current) {
      const selected = locations.find(loc => loc.id === selectedLocationId);
      if (selected) {
        const lat = Number(selected.latitude);
        const lng = Number(selected.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setCenter({ lat, lng });
          map.setZoom(16);
          lastSelectedId.current = selectedLocationId;
        }
      }
    } else if (!selectedLocationId && lastSelectedId.current) {
      // Reset to overview when selection is cleared
      lastSelectedId.current = undefined;
    }
  }, [selectedLocationId, locations, map]);
  
  return null;
}

export function VenueMapSelector({
  locations,
  onLocationSelect,
  selectedLocationId,
}: VenueMapSelectorProps) {
  // Calculate initial center (only for defaultCenter prop)
  const initialCenter = useMemo(() => {
    if (locations.length > 0) {
      const validLocs = locations.filter(loc => {
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      });
      if (validLocs.length > 0) {
        const avgLat = validLocs.reduce((sum, loc) => sum + Number(loc.latitude), 0) / validLocs.length;
        const avgLng = validLocs.reduce((sum, loc) => sum + Number(loc.longitude), 0) / validLocs.length;
        return { lat: avgLat, lng: avgLng };
      }
    }
    return DEFAULT_CENTER;
  }, [locations]);

  const handleMarkerClick = (locationId: string) => {
    onLocationSelect(locationId);
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Filter out locations without valid coordinates and ensure they are numbers
  const validLocations = useMemo(() => 
    locations
      .filter(loc => {
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(loc => ({
        ...loc,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
      })),
    [locations]
  );

  if (validLocations.length === 0) {
    return (
      <Card className="h-[500px] w-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPinIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No locations with coordinates available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={initialCenter}
          defaultZoom={13}
          mapId="venue-selector-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
        >
          <MapController 
            locations={validLocations} 
            selectedLocationId={selectedLocationId}
            initialCenter={initialCenter}
          />
          {validLocations.map((location) => {
            const isSelected = selectedLocationId === location.id;
            
            return (
              <AdvancedMarker
                key={location.id}
                position={{ lat: location.latitude, lng: location.longitude }}
                onClick={(e) => {
                  e.stop();
                  handleMarkerClick(location.id);
                }}
              >
                <div className="relative cursor-pointer transition-transform hover:scale-110">
                  <Pin
                    background={isSelected ? "#22c55e" : "#ef4444"}
                    borderColor={isSelected ? "#16a34a" : "#991b1b"}
                    glyphColor="#fff"
                    scale={isSelected ? 1.3 : 1}
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}


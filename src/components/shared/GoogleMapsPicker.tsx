"use client";

import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useMemo, useEffect, useRef } from "react";

interface GoogleMapsPickerProps {
  onPositionChange: (latLng: { lat: number; lng: number }) => void;
  position: { lat: string | number; lng: string | number } | null;
  radiusMeters?: number;
  center?: { lat: number; lng: number } | null;
}

function MapController({ center, zoom, radiusMeters }: { center: { lat: number; lng: number } | null; zoom?: number; radiusMeters?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
      if (zoom !== undefined) {
        map.setZoom(zoom);
      }
    }
  }, [map, center, zoom]);
  
  // Adjust zoom when radius changes to keep circle visible
  useEffect(() => {
    if (map && radiusMeters && radiusMeters > 0) {
      const calculateZoom = (radius: number) => {
        if (radius <= 10) return 14;
        if (radius <= 25) return 15;
        if (radius <= 50) return 16;
        if (radius <= 100) return 17;
        return 13;
      };
      const newZoom = calculateZoom(radiusMeters);
      map.setZoom(newZoom);
    }
  }, [map, radiusMeters]);
  
  return null;
}

export function GoogleMapsPicker({
  onPositionChange,
  position,
  radiusMeters,
  center,
}: GoogleMapsPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Default center: Ho Chi Minh City, Vietnam
  const defaultCenter = { lat: 10.769444, lng: 106.681944 };
  
  // Restrict map bounds to Vietnam
  const vietnamBounds = useMemo(() => ({
    north: 23.392627,
    south: 8.559611,
    east: 109.464638,
    west: 102.144653,
  }), []);

  const numericPosition = useMemo(() => {
    if (!position) return null;

    const lat = parseFloat(position.lat?.toString());
    const lng = parseFloat(position.lng?.toString());

    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  }, [position]);

  // Calculate zoom level based on radius to show the circle properly
  const calculateZoom = (radiusMeters: number) => {
    if (!radiusMeters || radiusMeters <= 0) return 15;
    // Rough calculation: smaller radius = higher zoom
    if (radiusMeters <= 10) return 17;
    if (radiusMeters <= 25) return 16;
    if (radiusMeters <= 50) return 15;
    if (radiusMeters <= 100) return 14;
    return 13;
  };

  const mapCenter = numericPosition || defaultCenter;
  const shouldCenter = center || numericPosition;
  const zoomLevel = radiusMeters ? calculateZoom(radiusMeters) : 15;

  if (!apiKey) {
    return <div>Google Maps API Key is missing.</div>;
  }

  return (
    <Map
      defaultCenter={mapCenter}
      defaultZoom={15}
      gestureHandling={"greedy"}
      disableDefaultUI={false}
      mapId="your-map-id"
      restriction={{
        latLngBounds: vietnamBounds,
        strictBounds: false, // Allow slight panning outside bounds
      }}
      onClick={(e) => {
        if (e.detail.latLng) {
          const { lat, lng } = e.detail.latLng;
          // Validate that clicked location is within Vietnam bounds
          if (
            lat >= vietnamBounds.south &&
            lat <= vietnamBounds.north &&
            lng >= vietnamBounds.west &&
            lng <= vietnamBounds.east
          ) {
            onPositionChange(e.detail.latLng);
          }
        }
      }}
    >
      <MapController center={shouldCenter} zoom={zoomLevel} radiusMeters={radiusMeters} />
      {numericPosition && <AdvancedMarker position={numericPosition} />}
      {numericPosition && radiusMeters && radiusMeters > 0 && (
        <CircleOverlay center={numericPosition} radius={radiusMeters} />
      )}
    </Map>
  );
}

function CircleOverlay({ center, radius }: { center: { lat: number; lng: number }; radius: number }) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center,
        radius,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
    }
    return () => {
      // Do not remove circle on unmount of props change; only cleanup when component unmounts
    };
  }, [map, center, radius]);

  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, []);

  return null;
}

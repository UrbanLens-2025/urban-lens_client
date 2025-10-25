"use client";

import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useMemo } from "react";

interface GoogleMapsPickerProps {
  onPositionChange: (latLng: { lat: number; lng: number }) => void;
  position: { lat: string | number; lng: string | number } | null;
}

export function GoogleMapsPicker({
  onPositionChange,
  position,
}: GoogleMapsPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const defaultCenter = { lat: 10.769444, lng: 106.681944 };

  const numericPosition = useMemo(() => {
    if (!position) return null;

    const lat = parseFloat(position.lat.toString());
    const lng = parseFloat(position.lng.toString());

    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
    return null;
  }, [position]);

  if (!apiKey) {
    return <div>Google Maps API Key is missing.</div>;
  }

  const mapCenter = numericPosition || defaultCenter;

  return (
    <Map
      defaultCenter={mapCenter}
      defaultZoom={13}
      gestureHandling={"greedy"}
      disableDefaultUI={true}
      mapId="your-map-id"
      onClick={(e) => {
        if (e.detail.latLng) {
          onPositionChange(e.detail.latLng);
        }
      }}
    >
      {position && <AdvancedMarker position={numericPosition} />}
    </Map>
  );
}

"use client";

import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface GoogleMapsPickerProps {
  onPositionChange: (latLng: { lat: number, lng: number }) => void;
  position: { lat: number, lng: number } | null;
}

export function GoogleMapsPicker({ onPositionChange, position }: GoogleMapsPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <div>Google Maps API Key is missing.</div>;
  }
  
  const defaultCenter = { lat: 14.0583, lng: 108.2772 };

  const mapCenter = position || defaultCenter;

  return (
      <Map
        defaultCenter={mapCenter}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="your-map-id"
        onClick={(e) => {
          if (e.detail.latLng) {
            onPositionChange(e.detail.latLng);
          }
        }}
      >
        {position && <AdvancedMarker position={position} />}
      </Map>
  );
}
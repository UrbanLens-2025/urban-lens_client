"use client";

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface GoogleMapsPickerProps {
  onPositionChange: (latLng: { lat: number, lng: number }) => void;
  position: { lat: number, lng: number } | null;
}

export function GoogleMapsPicker({ onPositionChange, position }: GoogleMapsPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <div>Google Maps API Key is missing.</div>;
  }
  
  const defaultCenter = { lat: 10.7769, lng: 106.7009 };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={13}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId="your-map-id" // Tùy chọn: ID cho map style
        onClick={(e) => {
          if (e.detail.latLng) {
            onPositionChange(e.detail.latLng);
          }
        }}
      >
        {position && <AdvancedMarker position={position} />}
      </Map>
    </APIProvider>
  );
}
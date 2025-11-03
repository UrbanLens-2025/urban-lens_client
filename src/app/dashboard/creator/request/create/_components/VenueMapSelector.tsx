"use client";

import { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Card } from "@/components/ui/card";

interface VenueMapSelectorProps {
  onLocationSelect: (locationId: string) => void;
  selectedLocationId?: string;
}

// For now, single mock pin - will be replaced with actual location data
const MOCK_LOCATION = {
  id: "8d1b0a75-f77f-4f7f-bf5c-88c51972852c",
  position: { lat: 10.8747888, lng: 106.7978802 },
  name: "Hội Quán Sinh Viên Chiến Đạt",
};

export function VenueMapSelector({
  onLocationSelect,
  selectedLocationId,
}: VenueMapSelectorProps) {
  const [center] = useState(MOCK_LOCATION.position);

  const handleMarkerClick = () => {
    onLocationSelect(MOCK_LOCATION.id);
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <Card className="h-[500px] w-full overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={15}
          mapId="venue-selector-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <AdvancedMarker
            position={MOCK_LOCATION.position}
            onClick={handleMarkerClick}
          >
            <Pin
              background={
                selectedLocationId === MOCK_LOCATION.id ? "#3b82f6" : "#ef4444"
              }
              borderColor={
                selectedLocationId === MOCK_LOCATION.id ? "#1e40af" : "#991b1b"
              }
              glyphColor="#fff"
            />
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </Card>
  );
}


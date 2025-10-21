"use client";

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { Input } from "@/components/ui/input";

interface PlacesAutocompleteProps {
  onAddressSelect: (address: {
    address: string;
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  }) => void;
}

export function PlacesAutocomplete({ onAddressSelect }: PlacesAutocompleteProps) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onAddressSelect({ address, lat, lng });
    } catch (error) {
      console.error("Error geocoding address: ", error);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Start typing your address..."
      />
      {status === 'OK' && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
          {data.map(({ place_id, description }) => (
            <div key={place_id} onClick={() => handleSelect(description)} className="p-2 hover:bg-gray-100 cursor-pointer">
              {description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
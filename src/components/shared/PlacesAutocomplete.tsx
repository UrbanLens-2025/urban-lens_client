"use client";

import { Input } from "@/components/ui/input";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
  components: google.maps.GeocoderAddressComponent[];
}

interface PlacesAutocompleteProps {
  onAddressSelect: (details: PlaceDetails) => void;
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
      
      onAddressSelect({ 
        address: results[0].formatted_address, 
        lat, 
        lng,
        components: results[0].address_components,
      });
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Searching address..."
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
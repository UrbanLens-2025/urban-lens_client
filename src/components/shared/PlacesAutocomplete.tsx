'use client';

import { Input } from '@/components/ui/input';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
  components: google.maps.GeocoderAddressComponent[];
}

interface PlacesAutocompleteProps {
  onAddressSelect: (details: PlaceDetails) => void;
}

export function PlacesAutocomplete({
  onAddressSelect,
}: PlacesAutocompleteProps) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: {
      componentRestrictions: { country: 'vn' }, // Restrict to Vietnam only
    },
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      // Address is already restricted to Vietnam via autocomplete
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);

      onAddressSelect({
        address: results[0].formatted_address,
        lat,
        lng,
        components: results[0].address_components,
      });
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  return (
    <div className='relative'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder={
            ready
              ? 'Type to search for an address...'
              : 'Loading address search...'
          }
          className={cn(
            'h-11 pl-10 pr-10 text-base border-2',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
            'bg-background'
          )}
        />
        {value && (
          <button
            type='button'
            onClick={() => {
              setValue('', false);
              clearSuggestions();
            }}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
          >
            <X className='h-4 w-4' />
          </button>
        )}
      </div>
      {status === 'OK' && data.length > 0 && (
        <div className='absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-60 overflow-y-auto'>
          {data.map(({ place_id, description }) => (
            <div
              key={place_id}
              onClick={() => handleSelect(description)}
              className='p-3 hover:bg-muted cursor-pointer border-b last:border-0 transition-colors'
            >
              <div className='text-sm'>{description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import {
  PlacesAutocomplete,
  PlaceDetails,
} from "@/components/shared/PlacesAutocomplete";
import { getGeocode } from "use-places-autocomplete";
import { toast } from "sonner";

const findAddressComponent = (
  components: google.maps.GeocoderAddressComponent[],
  type: string
) => {
  return components.find((c) => c.types.includes(type))?.long_name || "";
};

export function LocationAddressPicker() {
  const form = useFormContext();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  const watchedLatitude = form.watch("latitude");
  const watchedLongitude = form.watch("longitude");
  const watchedRadius = form.watch("radiusMeters") || 1;
  const markerPosition =
    watchedLatitude && watchedLongitude
      ? { lat: watchedLatitude, lng: watchedLongitude }
      : null;

  const processPlaceDetails = (details: PlaceDetails) => {
    const { address, lat, lng, components } = details;
    const province = findAddressComponent(
      components,
      "administrative_area_level_1"
    );
    const district =
      findAddressComponent(components, "administrative_area_level_2") ||
      findAddressComponent(components, "locality");
    const streetAddress = `${findAddressComponent(
      components,
      "street_number"
    )} ${findAddressComponent(components, "route")}`.trim();

    form.setValue("latitude", lat, { shouldValidate: true });
    form.setValue("longitude", lng, { shouldValidate: true });
    form.setValue("addressLine", streetAddress || address);
    form.setValue("addressLevel1", district);
    form.setValue("addressLevel2", province);
    
    // Auto-center map when address is selected
    setMapCenter({ lat, lng });
  };

  const handlePositionChange = async (latLng: { lat: number; lng: number }) => {
    form.setValue("latitude", latLng.lat, { shouldValidate: true });
    form.setValue("longitude", latLng.lng, { shouldValidate: true });
    setMapCenter(latLng);
    try {
      const results = await getGeocode({ location: latLng });
      if (results && results[0]) {
        processPlaceDetails({
          address: results[0].formatted_address,
          lat: latLng.lat,
          lng: latLng.lng,
          components: results[0].address_components,
        });
      }
    } catch (error) {
      toast.error("Could not fetch address.");
    }
  };

  // Reset map center when position changes from form
  useEffect(() => {
    if (watchedLatitude && watchedLongitude) {
      setMapCenter({ lat: watchedLatitude, lng: watchedLongitude });
    }
  }, [watchedLatitude, watchedLongitude]);

  return (
    <div className="space-y-3">
      <FormField
        control={form.control}
        name="addressLine"
        render={() => (
          <FormItem>
            <FormLabel className="text-sm">Search Address (or click the map)</FormLabel>
            <FormControl>
              <PlacesAutocomplete onAddressSelect={processPlaceDetails} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="h-64 rounded-md overflow-hidden border relative">
        <GoogleMapsPicker
          position={markerPosition}
          onPositionChange={handlePositionChange}
          radiusMeters={watchedRadius}
          center={mapCenter}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in-50">
        <FormField
          name="addressLevel2"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Province / City</FormLabel>
              <FormControl>
                <Input className="h-9" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="addressLevel1"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">District / Ward</FormLabel>
              <FormControl>
                <Input className="h-9" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="addressLine"
          control={form.control}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-sm">Street Address</FormLabel>
              <FormControl>
                <Input className="h-9" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

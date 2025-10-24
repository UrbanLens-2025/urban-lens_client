"use client";

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

  const watchedLatitude = form.watch("latitude");
  const watchedLongitude = form.watch("longitude");
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
    form.setValue("addressLevel1", province);
    form.setValue("addressLevel2", district);
    toast.info("Address has been auto-filled.");
  };

  const handlePositionChange = async (latLng: { lat: number; lng: number }) => {
    form.setValue("latitude", latLng.lat, { shouldValidate: true });
    form.setValue("longitude", latLng.lng, { shouldValidate: true });
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

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="addressLine"
        render={() => (
          <FormItem>
            <FormLabel>Search Address (or click the map)</FormLabel>
            <FormControl>
              <PlacesAutocomplete
                onAddressSelect={processPlaceDetails}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="h-80 rounded-lg overflow-hidden border">
        <GoogleMapsPicker
          position={markerPosition}
          onPositionChange={handlePositionChange}
        />
      </div>
      <div className="space-y-4 animate-in fade-in-50">
        <FormField
          name="addressLevel1"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province / City</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="addressLevel2"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>District / Ward</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="addressLine"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

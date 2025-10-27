"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { getGeocode } from "use-places-autocomplete";
import { toast } from "sonner";

import { useCreatePublicLocation } from "@/hooks/admin/useCreatePublicLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import { TagMultiSelect } from "@/components/shared/TagMultiSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";
import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const publicLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  latitude: z.number({ error: "Please select a location on the map." }),
  longitude: z.number({ error: "Please select a location on the map." }),
  radiusMeters: z.number().min(1, "Radius must be at least 1 meter."),
  addressLine: z.string().min(1, "Street address is required."),
  addressLevel1: z.string().min(1, "Province/City is required"),
  addressLevel2: z.string().min(1, "District/Ward is required"),
  imageUrl: z
    .array(z.string().url())
    .min(1, "At least one location image is required."),
  isVisibleOnMap: z.boolean(),
  tagIds: z.array(z.number()).min(1, "At least one tag is required."),
});
type FormValues = z.infer<typeof publicLocationSchema>;

const findAddressComponent = (
  components: google.maps.GeocoderAddressComponent[],
  type: string
) => {
  return components.find((c) => c.types.includes(type))?.long_name || "";
};

export default function CreatePublicLocationPage() {
  const router = useRouter();
  const { mutate: createLocation, isPending } = useCreatePublicLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(publicLocationSchema),
    mode: "all",
    defaultValues: {
      name: "",
      description: "",
      addressLine: "",
      addressLevel1: "",
      addressLevel2: "",
      latitude: 0,
      longitude: 0,
      radiusMeters: 1,
      imageUrl: [],
      tagIds: [],
      isVisibleOnMap: true,
    },
  });

  const processGeocodeResults = (results: google.maps.GeocoderResult[]) => {
    if (!results || !results[0]) return;
    const components = results[0].address_components;

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

    form.setValue("addressLevel1", district, { shouldValidate: true });
    form.setValue("addressLevel2", province, { shouldValidate: true });
    form.setValue(
      "addressLine",
      streetAddress || results[0].formatted_address,
      { shouldValidate: true }
    );
    toast.info("Address has been auto-filled.");
  };

  const handlePositionChange = async (latLng: { lat: number; lng: number }) => {
    form.setValue("latitude", latLng.lat, { shouldValidate: true });
    form.setValue("longitude", latLng.lng, { shouldValidate: true });
    try {
      const results = await getGeocode({ location: latLng });
      processGeocodeResults(results);
    } catch (error) {
      toast.error("Could not fetch address.");
    }
  };

  const watchedValues = form.watch();
  const markerLat = watchedValues.latitude;
  const markerLng = watchedValues.longitude;
  const markerPosition =
    markerLat && markerLng ? { lat: markerLat, lng: markerLng } : null;

  function onSubmit(values: FormValues) {
    createLocation(values);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create Public Location</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* CỘT BÊN TRÁI: FORM */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="description"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="tagIds"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <TagMultiSelect
                          selectedTagIds={field.value}
                          onSelectionChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    name="imageUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Photos</FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* CỘT BÊN PHẢI: BẢN ĐỒ & ĐỊA CHỈ */}
            <div className="space-y-8 lg:sticky lg:top-24">
              <Card>
                <CardHeader>
                  <CardTitle>Address & Map</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormItem>
                    <FormLabel>Search Address</FormLabel>
                    <PlacesAutocomplete
                      onAddressSelect={async ({ address, lat, lng }) => {
                        form.setValue("latitude", lat, {
                          shouldValidate: true,
                        });
                        form.setValue("longitude", lng, {
                          shouldValidate: true,
                        });
                        try {
                          const results = await getGeocode({ address });
                          processGeocodeResults(results);
                        } catch (error) {
                          console.error("Geocoding error", error);
                        }
                      }}
                    />
                  </FormItem>
                  <div className="h-60 rounded-lg overflow-hidden border">
                    <GoogleMapsPicker
                      position={markerPosition}
                      onPositionChange={handlePositionChange}
                    />
                  </div>
                  <FormField
                    name="addressLevel2"
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
                    name="addressLevel1"
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="radiusMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Effective Radius: {field.value} meters
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={100}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                            value={[field.value]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="isVisibleOnMap"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <FormLabel>Visible on Map</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Public Location
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

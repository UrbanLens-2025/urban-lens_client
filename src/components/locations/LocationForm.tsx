/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";

import { useCreateLocationRequest } from "@/hooks/locations/useCreateLocationRequest";
import { useUser } from "@/hooks/user/useUser";
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
import { Loader2 } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import { TagMultiSelect } from "@/components/shared/TagMultiSelect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { LocationRequest, PaginatedData, Tag } from "@/types";
import { useTags } from "@/hooks/tags/useTags";
import { LocationAddressPicker } from "@/components/shared/LocationAddressPicker";
import { useUpdateLocationRequest } from "@/hooks/locations/useUpdateLocationRequest";
import { toast } from "sonner";
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById";
import { useAddTagsToRequest } from "@/hooks/locations/useAddTagsToRequest";
import { useRemoveTagsFromRequest } from "@/hooks/locations/useRemoveTagsFromRequest";
import { useQueryClient } from "@tanstack/react-query";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  latitude: z
    .number({ error: "Please select a location on the map." })
    .optional(),
  longitude: z
    .number({ error: "Please select a location on the map." })
    .optional(),
  radiusMeters: z.number().min(1, "Radius must be at least 1 meter."),
  addressLine: z.string().min(1, "Street address is required."),
  addressLevel1: z.string().min(1, "Province/City is required"),
  addressLevel2: z.string().min(1, "District/Ward is required"),
  locationImageUrls: z
    .array(z.string().url())
    .min(1, "At least one location image is required."),
  documentImageUrls: z
    .array(z.string().url())
    .min(1, "At least one validation document is required."),
  tagIds: z.array(z.number()).min(1, "At least one tag is required."),
});
type FormValues = z.infer<typeof locationSchema>;

interface LocationFormProps {
  isEditMode: boolean;
  initialData?: LocationRequest;
  locationId?: string;
}

const steps = [
  {
    id: 1,
    title: "Basic Information",
    fields: ["name", "description", "tagIds"] as const,
  },
  {
    id: 2,
    title: "Address & Map",
    fields: ["addressLine", "latitude", "longitude"] as const,
  },
  {
    id: 3,
    title: "Images & Documents",
    fields: ["locationImageUrls", "documentImageUrls"] as const,
  },
  { id: 4, title: "Confirmation" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function DisplayTags({
  tagIds,
  tagsMap,
}: {
  tagIds: number[] | undefined;
  tagsMap: Map<number, Tag>;
}) {
  if (!tagIds || tagIds.length === 0)
    return <span className="text-muted-foreground">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tagIds.map((id) => {
        const tag = tagsMap.get(id);
        if (!tag) return null;
        return (
          <Badge key={tag.id} variant="secondary">
            {tag.icon} {tag.displayName}
          </Badge>
        );
      })}
    </div>
  );
}

interface LocationFormProps {
  isEditMode: boolean;
  initialData?: LocationRequest;
  locationId?: string;
}

export default function LocationForm({
  isEditMode,
  initialData,
  locationId,
}: LocationFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const queryClient = useQueryClient();

  const { data: copiedData, isLoading: isLoadingCopiedData } =
    useLocationRequestById(copyFromId);
  const { mutate: createLocation, isPending: isCreating } =
    useCreateLocationRequest();
  const { mutate: updateLocationRequest, isPending: isUpdating } =
    useUpdateLocationRequest();
  const { mutateAsync: addTags } =
    useAddTagsToRequest();
  const { mutateAsync: removeTags } =
    useRemoveTagsFromRequest();
  const { data: allTagsResponse } = useTags();

  const isPending = isCreating || isUpdating;

  const form = useForm<FormValues>({
    resolver: zodResolver(locationSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      addressLine: "",
      addressLevel1: "",
      addressLevel2: "",
      locationImageUrls: [],
      tagIds: [],
      documentImageUrls: [],
      radiusMeters: 1,
      latitude: 0,
      longitude: 0,
    },
  });

  useEffect(() => {
    let dataToLoad: LocationRequest | undefined | null = null;

    if (isEditMode && initialData) {
      dataToLoad = initialData;
    } else if (!isEditMode && copiedData) {
      dataToLoad = copiedData;
    }

    if (dataToLoad) {
      form.reset({
        name: dataToLoad.name,
        description: dataToLoad.description,
        addressLine: dataToLoad.addressLine,
        addressLevel1: dataToLoad.addressLevel1,
        addressLevel2: dataToLoad.addressLevel2,
        latitude: parseFloat(dataToLoad.latitude as any),
        longitude: parseFloat(dataToLoad.longitude as any),
        radiusMeters: dataToLoad.radiusMeters,
        tagIds: dataToLoad.tags.map((t: { tagId: any }) => t.tagId),
        locationImageUrls: dataToLoad.locationImageUrls || [],
        documentImageUrls:
          dataToLoad.locationValidationDocuments?.[0]?.documentImageUrls || [],
      });
    }
  }, [copiedData, initialData, isEditMode, form]);

  const watchedValues = form.watch();

  const tagsMap = useMemo(() => {
    const map = new Map<number, Tag>();
    const allTags = (allTagsResponse as PaginatedData<Tag>)?.data || [];
    allTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [allTagsResponse]);

  const handleNextStep = async () => {
    const fields = steps[currentStep].fields;
    if (fields) {
      const output = await form.trigger(fields, { shouldFocus: true });
      if (!output) return;
    }
    setCurrentStep((prev) => prev + 1);
  };
  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  async function onSubmit(values: FormValues) {
    try {
      const { documentImageUrls, tagIds: newTagIds, ...rest } = values;
      const payload = {
        ...rest,
        locationValidationDocuments: [
          {
            documentType: "LOCATION_REGISTRATION_CERTIFICATE",
            documentImageUrls: documentImageUrls,
          },
        ],
      };

      if (isEditMode && locationId) {
        const originalTagIds = initialData?.tags.map((t) => t.id) || [];
        const tagsToAdd = newTagIds.filter(
          (id) => !originalTagIds.includes(id)
        );
        const tagsToRemove = originalTagIds.filter(
          (id) => !newTagIds.includes(id)
        );

        const mutationPromises = [];

        mutationPromises.push(
          updateLocationRequest({
            locationRequestId: locationId,
            payload: payload as any,
          })
        );

        if (tagsToAdd.length > 0) {
          mutationPromises.push(
            addTags({ locationRequestId: locationId, tagIds: tagsToAdd })
          );
        }

        if (tagsToRemove.length > 0) {
          mutationPromises.push(
            removeTags({ requestId: locationId, tagIds: tagsToRemove })
          );
        }

        await Promise.all(mutationPromises);
      } else {
        await createLocation({ ...payload, tagIds: newTagIds } as any);
      }

      queryClient.invalidateQueries({ queryKey: ["locationRequests"] });
      router.refresh();
      router.push("/dashboard/business/locations");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    }
  }

  if (isUserLoading || isLoadingCopiedData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (user?.role !== "BUSINESS_OWNER") {
    router.replace("/");
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Edit Location Request" : "Submit a New Location"}{" "}
            (Step {currentStep + 1}/{steps.length})
          </CardTitle>
          <CardDescription>{steps[currentStep].title}</CardDescription>
          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* === STEP 1: Thông tin cơ bản === */}
              <div className={cn("space-y-6", currentStep !== 0 && "hidden")}>
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
              </div>

              {/* === STEP 2: Địa chỉ & Bản đồ === */}
              <div className={cn("space-y-6", currentStep !== 1 && "hidden")}>
                <LocationAddressPicker />
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
                          defaultValue={[field.value]}
                          className="pt-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === STEP 3: Upload Files === */}
              <div className={cn("space-y-6", currentStep !== 2 && "hidden")}>
                <FormField
                  name="locationImageUrls"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Photos (at least 1)</FormLabel>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="documentImageUrls"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validation Document (required)</FormLabel>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === STEP 4: Xác nhận === */}
              <div className={cn("space-y-6", currentStep !== 3 && "hidden")}>
                <h3 className="text-lg font-semibold">
                  Please review your information
                </h3>

                <div className="p-4 border rounded-md space-y-4">
                  <InfoRow label="Location Name" value={watchedValues.name} />
                  <InfoRow
                    label="Description"
                    value={watchedValues.description}
                  />
                  <InfoRow
                    label="Tags"
                    value={
                      <DisplayTags
                        tagIds={watchedValues.tagIds}
                        tagsMap={tagsMap}
                      />
                    }
                  />
                </div>

                <div className="p-4 border rounded-md space-y-4">
                  <InfoRow label="Address" value={watchedValues.addressLine} />
                  <InfoRow
                    label="District / Ward"
                    value={watchedValues.addressLevel1}
                    />
                  <InfoRow
                    label="Province / City"
                    value={watchedValues.addressLevel2}
                  />
                  <InfoRow
                    label="Coordinates"
                    value={`Lat: ${watchedValues.latitude}, Lng: ${watchedValues.longitude}`}
                  />
                </div>

                <div className="p-4 border rounded-md space-y-4">
                  <InfoRow
                    label="Location Photos"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {watchedValues.locationImageUrls?.map((url) => (
                          <img
                            key={url}
                            src={url}
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    }
                  />
                  <InfoRow
                    label="Validation Document"
                    value={
                      <div className="flex flex-wrap gap-2">
                        {watchedValues.documentImageUrls?.map((url) => (
                          <img
                            key={url}
                            src={url}
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevStep}
                  className={cn(currentStep === 0 && "invisible")}
                >
                  Back
                </Button>
                {currentStep < steps.length - 1 && (
                  <Button type="button" onClick={handleNextStep}>
                    Next Step
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit for Review
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

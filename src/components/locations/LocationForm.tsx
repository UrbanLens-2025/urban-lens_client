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
  FormDescription,
} from "@/components/ui/form";
import { Loader2, CheckCircle2, MapPin, Image, FileCheck, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Search, X } from "lucide-react";
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
import { LocationRequest } from "@/types";
import { LocationAddressPicker } from "@/components/shared/LocationAddressPicker";
import { useUpdateLocationRequest } from "@/hooks/locations/useUpdateLocationRequest";
import { toast } from "sonner";
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById";
import { useAddTagsToRequest } from "@/hooks/locations/useAddTagsToRequest";
import { useRemoveTagsFromRequest } from "@/hooks/locations/useRemoveTagsFromRequest";
import { useQueryClient } from "@tanstack/react-query";
import { DisplayTags } from "../shared/DisplayTags";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAllTags } from "@/hooks/tags/useAllTags";
import type { Tag } from "@/types";
import { Badge } from "@/components/ui/badge";

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
    description: "Tell us about your location",
    icon: CheckCircle2,
    fields: ["name", "description", "tagIds"] as const,
  },
  {
    id: 2,
    title: "Address & Map",
    description: "Set the location and coverage area",
    icon: MapPin,
    fields: ["addressLine", "latitude", "longitude"] as const,
  },
  {
    id: 3,
    title: "Images & Documents",
    description: "Upload photos and validation documents",
    icon: Image,
    fields: ["locationImageUrls", "documentImageUrls"] as const,
  },
  { 
    id: 4, 
    title: "Review & Submit",
    description: "Review your information before submitting",
    icon: FileCheck,
  },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b last:border-0">
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <div className="text-base">{value}</div>
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
  const { mutateAsync: addTags } = useAddTagsToRequest();
  const { mutateAsync: removeTags } = useRemoveTagsFromRequest();

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
        tagIds: dataToLoad.tags.map((t) => t.id),
        locationImageUrls: dataToLoad.locationImageUrls || [],
        documentImageUrls:
          dataToLoad.locationValidationDocuments?.[0]?.documentImageUrls || [],
      });
    }
  }, [copiedData, initialData, isEditMode, form]);

  const watchedValues = form.watch();

  const { resolvedTags: tags } = useResolvedTags(watchedValues.tagIds);
  const { data: allTags, isLoading: isLoadingTags } = useAllTags();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const selectedTagIds = watchedValues.tagIds || [];

  const tagsFromDb: Tag[] = allTags || [];
  const groupedTags = tagsFromDb.reduce((acc: Record<string, Tag[]>, tag: Tag) => {
    const group = tag.groupName || "Others";
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  const toggleTag = (tagId: number, groupName: string | null) => {
    const group = groupName || "Others";
    if (group === "EVENT_TYPE") {
      if (selectedTagIds.includes(tagId)) {
        form.setValue("tagIds", selectedTagIds.filter((id) => id !== tagId), { shouldValidate: true });
      } else {
        const eventTypeTags = groupedTags["EVENT_TYPE"]?.map((t) => t.id) || [];
        const newSelection = selectedTagIds.filter((id) => !eventTypeTags.includes(id));
        form.setValue("tagIds", [...newSelection, tagId], { shouldValidate: true });
      }
    } else {
      const newSelection = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];
      form.setValue("tagIds", newSelection, { shouldValidate: true });
    }
  };

  const getGroupLabel = (group: string) => {
    if (group === "Others") return "Others";
    return group
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ") + (group === "EVENT_TYPE" ? " (Select One)" : "");
  };

  const INITIAL_DISPLAY_COUNT = 5;
  const getFilteredTags = (tags: Tag[], groupName: string) => {
    const term = (searchTerms[groupName] || "").toLowerCase();
    return tags.filter((t) => t.displayName.toLowerCase().includes(term));
  };
  const getDisplayedTags = (tags: Tag[], groupName: string) => {
    const filtered = getFilteredTags(tags, groupName);
    const isExpanded = expandedGroups[groupName];
    return isExpanded ? filtered : filtered.slice(0, INITIAL_DISPLAY_COUNT);
  };

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

      if (isEditMode) {
        toast.success("Location request updated successfully!");
      } else {
        toast.success("Location submitted successfully! It's now under review.");
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

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>
                {isEditMode ? "Edit Location Request" : "Submit a New Location"}
              </CardTitle>
              <CardDescription className="mt-1">
                {currentStepData.description}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</div>
              <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                        isCompleted && "bg-primary text-primary-foreground border-primary",
                        isActive && "bg-primary text-primary-foreground border-primary",
                        !isActive && !isCompleted && "bg-muted border-muted-foreground/20"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mt-2 text-xs text-center max-w-[80px]">
                      <div className={cn(
                        "font-medium",
                        isActive && "text-primary",
                        !isActive && "text-muted-foreground"
                      )}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 transition-colors",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* === STEP 1: Basic Information === */}
              <div className={cn("space-y-6", currentStep !== 0 && "hidden")}>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Provide basic details about your location. This information will be visible to event creators.
                  </AlertDescription>
                </Alert>
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Downtown Event Hall" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a clear, descriptive name for your location
                      </FormDescription>
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
                        <Textarea 
                          placeholder="Describe your location, amenities, capacity, and what makes it special..."
                          rows={5}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Help event creators understand what your location offers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  {isLoadingTags ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(groupedTags)
                        .sort(([a], [b]) => {
                          if (a === "Others") return 1;
                          if (b === "Others") return -1;
                          return a.localeCompare(b);
                        })
                        .map(([groupName, tagsInGroup]) => {
                          const filtered = getFilteredTags(tagsInGroup, groupName);
                          const displayed = getDisplayedTags(tagsInGroup, groupName);
                          const hasMore = filtered.length > INITIAL_DISPLAY_COUNT;
                          const isGroupExpanded = expandedGroups[`group_${groupName}`] ?? true;
                          const isExpandedList = expandedGroups[groupName];
                          return (
                            <div key={groupName} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedGroups((prev) => ({
                                      ...prev,
                                      [`group_${groupName}`]: !prev[`group_${groupName}`],
                                    }))
                                  }
                                  className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
                                >
                                  {isGroupExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <h3 className="text-sm font-semibold">
                                    {getGroupLabel(groupName)}
                                    <span className="text-xs text-muted-foreground font-normal ml-2">({filtered.length})</span>
                                  </h3>
                                </button>
                                {isGroupExpanded && (
                                  <div className="relative w-40">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder="Search..."
                                      value={searchTerms[groupName] || ""}
                                      onChange={(e) => setSearchTerms((prev) => ({ ...prev, [groupName]: e.target.value }))}
                                      className="pl-7 h-8 text-xs"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </div>

                              {isGroupExpanded && (
                                <>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {displayed.map((tag: Tag) => {
                                      const isSelected = selectedTagIds.includes(tag.id);
                                      return (
                                        <Badge
                                          key={tag.id}
                                          variant={isSelected ? "default" : "outline"}
                                          style={
                                            isSelected
                                              ? { backgroundColor: tag.color, color: "#fff", borderColor: tag.color }
                                              : { borderColor: tag.color, color: tag.color }
                                          }
                                          className={cn(
                                            "cursor-pointer transition-all hover:shadow-sm px-2 py-0.5 text-xs",
                                            isSelected && "ring-1 ring-offset-1 ring-primary",
                                            !isSelected && "hover:bg-muted"
                                          )}
                                          onClick={() => toggleTag(tag.id, tag.groupName)}
                                        >
                                          <span className="mr-1">{tag.icon}</span>
                                          {tag.displayName}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                  {hasMore && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setExpandedGroups((prev) => ({ ...prev, [groupName]: !isExpandedList }))}
                                      className="w-full h-7 text-xs"
                                    >
                                      {isExpandedList ? (
                                        <>
                                          <ChevronUp className="mr-1 h-3 w-3" />
                                          Show Less
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="mr-1 h-3 w-3" />
                                          View More ({filtered.length - INITIAL_DISPLAY_COUNT} more)
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {filtered.length === 0 && searchTerms[groupName] && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No tags found for "{searchTerms[groupName]}"
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                  <FormDescription>
                    Select tags that best describe your location (e.g., Indoor, Outdoor, Parking Available)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
                {tags.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-2">Selected Tags:</p>
                    <DisplayTags tags={tags} maxCount={10} />
                  </div>
                )}
              </div>

              {/* === STEP 2: Address & Map === */}
              <div className={cn("space-y-6", currentStep !== 1 && "hidden")}>
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Set the exact location and define the coverage area where events can be booked.
                  </AlertDescription>
                </Alert>
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
                      <FormDescription>
                        Define how far from the location point events can be booked (1-100 meters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === STEP 3: Upload Files === */}
              <div className={cn("space-y-6", currentStep !== 2 && "hidden")}>
                <Alert>
                  <Image className="h-4 w-4" />
                  <AlertDescription>
                    Upload high-quality photos of your location and required validation documents.
                  </AlertDescription>
                </Alert>
                <FormField
                  name="locationImageUrls"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Photos (at least 1 required)</FormLabel>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormDescription>
                        Showcase your location with clear, professional photos. Multiple angles are recommended.
                      </FormDescription>
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
                      <FormDescription>
                        Upload your location registration certificate or business license for verification.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === STEP 4: Review & Submit === */}
              <div className={cn("space-y-6", currentStep !== 3 && "hidden")}>
                <Alert>
                  <FileCheck className="h-4 w-4" />
                  <AlertDescription>
                    Please review all information carefully before submitting. Your request will be reviewed by our team.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <InfoRow label="Location Name" value={watchedValues.name} />
                      <InfoRow
                        label="Description"
                        value={watchedValues.description}
                      />
                      <InfoRow
                        label="Tags"
                        value={<DisplayTags tags={tags} maxCount={10} />}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Location Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <InfoRow label="Address" value={watchedValues.addressLine} />
                      <InfoRow
                        label="District / Ward"
                        value={watchedValues.addressLevel2}
                      />
                      <InfoRow
                        label="Province / City"
                        value={watchedValues.addressLevel1}
                      />
                      <InfoRow
                        label="Coordinates"
                        value={`Lat: ${watchedValues.latitude?.toFixed(6)}, Lng: ${watchedValues.longitude?.toFixed(6)}`}
                      />
                      <InfoRow
                        label="Effective Radius"
                        value={`${watchedValues.radiusMeters} meters`}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Uploaded Files</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Location Photos ({watchedValues.locationImageUrls?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.locationImageUrls?.map((url) => (
                            <img
                              key={url}
                              src={url}
                              alt="Location"
                              className="w-24 h-24 object-cover rounded-md border"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Validation Documents ({watchedValues.documentImageUrls?.length || 0})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.documentImageUrls?.map((url) => (
                            <img
                              key={url}
                              src={url}
                              alt="Document"
                              className="w-24 h-24 object-cover rounded-md border"
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0 || isPending}
                  className={cn(currentStep === 0 && "invisible")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {currentStep < steps.length - 1 && (
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    disabled={isPending}
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" disabled={isPending} className="min-w-[160px]">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Submit for Review
                      </>
                    )}
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

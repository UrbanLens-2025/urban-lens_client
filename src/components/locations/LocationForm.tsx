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
import { Loader2, CheckCircle2, MapPin, Image, FileCheck, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Search, X, Plus, Trash2 } from "lucide-react";
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
import { useTagCategories } from "@/hooks/tags/useTagCategories";
import type { TagCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  locationValidationDocuments: z
    .array(
      z.object({
        documentType: z.string().min(1, "Document type is required"),
        documentImageUrls: z.array(z.string().url()).min(1, "At least one document image is required"),
      })
    )
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
    fields: ["locationImageUrls", "locationValidationDocuments"] as const,
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
    <div className="py-1.5 border-b last:border-0">
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      <div className="text-sm">{value}</div>
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
      locationValidationDocuments: [
        {
          documentType: "LOCATION_REGISTRATION_CERTIFICATE",
          documentImageUrls: [],
        },
      ],
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
        locationValidationDocuments:
          dataToLoad.locationValidationDocuments && dataToLoad.locationValidationDocuments.length > 0
            ? dataToLoad.locationValidationDocuments
            : [
                {
                  documentType: "LOCATION_REGISTRATION_CERTIFICATE",
                  documentImageUrls: [],
                },
              ],
      });
    }
  }, [copiedData, initialData, isEditMode, form]);

  const watchedValues = form.watch();

  const { resolvedTags: tags } = useResolvedTags(watchedValues.tagIds);
  const { data: tagCategories, isLoading: isLoadingTags } = useTagCategories("LOCATION");
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedTagIds = watchedValues.tagIds || [];

  // Filter tags based on search term
  const filteredTags = useMemo(() => {
    if (!tagCategories) return [];
    const term = searchTerm.toLowerCase();
    return tagCategories.filter((tag) =>
      tag.name.toLowerCase().includes(term) ||
      tag.description.toLowerCase().includes(term)
    );
  }, [tagCategories, searchTerm]);

  // Get displayed tags (limited if not expanded)
  const INITIAL_DISPLAY_COUNT = 5;
  const displayedTags = useMemo(() => {
    return isExpanded ? filteredTags : filteredTags.slice(0, INITIAL_DISPLAY_COUNT);
  }, [filteredTags, isExpanded]);

  const hasMore = filteredTags.length > INITIAL_DISPLAY_COUNT;

  // Handle tag selection - allow multiple selections
  const toggleTag = (tagId: number) => {
    const isSelected = selectedTagIds.includes(tagId);
    if (isSelected) {
      form.setValue("tagIds", selectedTagIds.filter((id) => id !== tagId), { shouldValidate: true });
    } else {
      // Add to current selection (multiple allowed)
      form.setValue("tagIds", [...selectedTagIds, tagId], { shouldValidate: true });
    }
  };

  // Check if at least one tag is selected
  const hasLocationType = selectedTagIds.length > 0;

  const handleNextStep = async () => {
    const fields = steps[currentStep].fields;
    if (fields) {
      // Additional validation for LOCATION_TYPE in step 1
      if (currentStep === 0 && Array.isArray(fields) && fields.includes("tagIds" as any)) {
        if (!hasLocationType) {
          form.setError("tagIds", {
            type: "manual",
            message: "At least one location type is required. Please select a location type.",
          });
          await form.trigger("tagIds", { shouldFocus: true });
          return;
        }
      }
      
      const output = await form.trigger(fields as any, { shouldFocus: true });
      if (!output) return;
    }
    setCurrentStep((prev) => prev + 1);
  };
  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  async function onSubmit(values: FormValues) {
    // Validate LOCATION_TYPE requirement
    if (!hasLocationType) {
      form.setError("tagIds", {
        type: "manual",
        message: "At least one location type is required. Please select a location type.",
      });
      await form.trigger("tagIds", { shouldFocus: true });
      return;
    }
    
    try {
      const { tagIds: newTagIds, ...rest } = values;
      const payload = {
        ...rest,
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
      router.push("/dashboard/business/locations?tab=requests");
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
    <div className="container mx-auto py-4 max-w-4xl">
      <Card className="w-full mx-auto shadow-lg border-2">
        <CardHeader className="pb-3 pt-4 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold">
                {isEditMode ? "Edit Location Request" : "Submit a New Location"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {currentStepData.description}
              </CardDescription>
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</div>
              <div className="text-xl font-bold">{Math.round(progress)}%</div>
            </div>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative flex items-center justify-center w-full">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm relative z-10",
                          isCompleted && "bg-primary text-primary-foreground border-primary",
                          isActive && "bg-primary text-primary-foreground border-primary scale-110",
                          !isActive && !isCompleted && "bg-muted border-muted-foreground/20"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-1/2 right-0 h-0.5 transition-colors",
                            isCompleted ? "bg-primary" : "bg-muted"
                          )}
                          style={{ top: '50%', transform: 'translateY(-50%)', width: 'calc(100% - 2rem)', marginLeft: '1rem' }}
                        />
                      )}
                    </div>
                    <div className="mt-1 text-[10px] text-center leading-tight">
                      <div className={cn(
                        "font-medium",
                        isActive && "text-primary",
                        !isActive && "text-muted-foreground"
                      )}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* === STEP 1: Basic Information === */}
              <div className={cn("space-y-3", currentStep !== 0 && "hidden")}>
                <Alert className="py-2 px-3">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">
                    Provide basic details about your location. This information will be visible to event creators.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown Event Hall" className="h-9" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
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
                        <FormLabel className="text-sm">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your location, amenities, capacity, and what makes it special..."
                            rows={3}
                            className="text-sm resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Help event creators understand what your location offers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="tagIds"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Location Type</FormLabel>
                      {isLoadingTags ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "border rounded-md p-3 space-y-2 bg-muted/20",
                            !hasLocationType && form.formState.errors.tagIds && "bg-destructive/5 border-destructive border-2"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              Location Tag Categories
                              <span className="text-[10px] text-muted-foreground font-normal">({filteredTags.length})</span>
                            </div>
                            <div className="relative w-32">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-7 h-7 text-xs"
                              />
                              {searchTerm.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSearchTerm("")}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {displayedTags.map((tag: TagCategory) => {
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
                                    "cursor-pointer transition-all hover:shadow-sm px-1.5 py-0.5 text-[10px] h-6",
                                    isSelected && "ring-1 ring-offset-1 ring-primary",
                                    !isSelected && "hover:bg-muted"
                                  )}
                                  onClick={() => toggleTag(tag.id)}
                                  title={tag.description}
                                >
                                  <span className="mr-0.5 text-[10px]">{tag.icon}</span>
                                  {tag.name}
                                </Badge>
                              );
                            })}
                          </div>
                          {hasMore && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsExpanded(!isExpanded)}
                              className="w-full h-6 text-[10px]"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 h-3 w-3" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 h-3 w-3" />
                                  View More ({filteredTags.length - INITIAL_DISPLAY_COUNT} more)
                                </>
                              )}
                            </Button>
                          )}
                          {filteredTags.length === 0 && searchTerm && (
                            <p className="text-[10px] text-muted-foreground text-center py-1">
                              No tags found for "{searchTerm}"
                            </p>
                          )}
                        </div>
                      )}
                      <FormDescription className="text-xs">
                        Select tag categories that best describe your location (you can select multiple)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {tags.length > 0 && (
                  <div className="p-2 bg-muted/30 rounded-md border">
                    <p className="text-xs font-medium mb-1.5">Selected Tag Categories:</p>
                    <DisplayTags tags={tags} maxCount={10} />
                  </div>
                )}
              </div>

              {/* === STEP 2: Address & Map === */}
              <div className={cn("space-y-3", currentStep !== 1 && "hidden")}>
                <Alert className="py-2 px-3">
                  <MapPin className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">
                    Set the exact location and define the coverage area where events can be booked.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <LocationAddressPicker />
                  <FormField
                    control={form.control}
                    name="radiusMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Effective Radius: {field.value} meters
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={100}
                            step={1}
                            onValueChange={(value) => field.onChange(value[0])}
                            defaultValue={[field.value]}
                            className="pt-1"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Define how far from the location point events can be booked (1-100 meters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* === STEP 3: Upload Files === */}
              <div className={cn("space-y-3", currentStep !== 2 && "hidden")}>
                <Alert className="py-2 px-3">
                  <Image className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">
                    Upload high-quality photos of your location and required validation documents.
                  </AlertDescription>
                </Alert>
                <FormField
                  name="locationImageUrls"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Location Photos</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        At least 1 photo required. Multiple angles recommended.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-sm font-semibold">Validation Documents</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upload documents by type. At least one document is required.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentDocs = form.getValues("locationValidationDocuments") || [];
                        form.setValue("locationValidationDocuments", [
                          ...currentDocs,
                          {
                            documentType: "LOCATION_REGISTRATION_CERTIFICATE",
                            documentImageUrls: [],
                          },
                        ]);
                      }}
                      className="h-7 text-xs shrink-0"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Document
                    </Button>
                  </div>
                  <FormField
                    name="locationValidationDocuments"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-3">
                          {field.value?.map((doc, index) => {
                            const getDocumentTypeLabel = (type: string) => {
                              switch (type) {
                                case "LOCATION_REGISTRATION_CERTIFICATE":
                                  return "Location Registration Certificate";
                                case "BUSINESS_LICENSE":
                                  return "Business License";
                                case "TAX_REGISTRATION":
                                  return "Tax Registration";
                                case "OTHER":
                                  return "Other";
                                default:
                                  return type;
                              }
                            };
                            
                            return (
                              <Card key={index} className="border p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <FileCheck className="h-4 w-4 text-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <FormField
                                            control={form.control}
                                            name={`locationValidationDocuments.${index}.documentType`}
                                            render={({ field: docTypeField }) => (
                                              <FormItem>
                                                <Select
                                                  value={docTypeField.value}
                                                  onValueChange={docTypeField.onChange}
                                                  disabled={false}
                                                >
                                                  <FormControl>
                                                    <SelectTrigger className="h-8 text-xs font-semibold">
                                                      <SelectValue placeholder="Select document type" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent>
                                                    <SelectItem value="LOCATION_REGISTRATION_CERTIFICATE">
                                                      Location Registration Certificate
                                                    </SelectItem>
                                                    <SelectItem value="BUSINESS_LICENSE">
                                                      Business License
                                                    </SelectItem>
                                                    <SelectItem value="TAX_REGISTRATION">
                                                      Tax Registration
                                                    </SelectItem>
                                                    <SelectItem value="OTHER">
                                                      Other
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                        {doc.documentImageUrls && doc.documentImageUrls.length > 0 && (
                                          <Badge variant="secondary" className="text-xs shrink-0">
                                            {doc.documentImageUrls.length} {doc.documentImageUrls.length === 1 ? 'image' : 'images'}
                                          </Badge>
                                        )}
                                      </div>
                                      {doc.documentImageUrls && doc.documentImageUrls.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                          You can change the document type above at any time
                                        </p>
                                      )}
                                    </div>
                                    {field.value.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const updated = field.value.filter((_, i) => i !== index);
                                          form.setValue("locationValidationDocuments", updated);
                                        }}
                                        className="h-8 w-8 p-0 shrink-0"
                                        title="Remove document"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    )}
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name={`locationValidationDocuments.${index}.documentImageUrls`}
                                    render={({ field: imagesField }) => {
                                      const currentDocType = form.watch(`locationValidationDocuments.${index}.documentType`);
                                      return (
                                        <FormItem>
                                          <div className="space-y-1.5">
                                            <FormLabel className="text-xs font-medium text-muted-foreground">
                                              Upload images for {getDocumentTypeLabel(currentDocType || doc.documentType)}
                                            </FormLabel>
                                            <FormControl>
                                              <FileUpload
                                                value={imagesField.value}
                                                onChange={imagesField.onChange}
                                              />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                              At least 1 image required for this document type
                                            </FormDescription>
                                            <FormMessage />
                                          </div>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* === STEP 4: Review & Submit === */}
              <div className={cn("space-y-3", currentStep !== 3 && "hidden")}>
                <Alert className="py-2 px-3">
                  <FileCheck className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs">
                    Please review all information carefully before submitting. Your request will be reviewed by our team.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 pt-0">
                      <InfoRow label="Location Name" value={watchedValues.name} />
                      <InfoRow
                        label="Description"
                        value={<span className="text-xs line-clamp-2">{watchedValues.description}</span>}
                      />
                      <InfoRow
                        label="Tags"
                        value={<DisplayTags tags={tags} maxCount={5} />}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold">Location Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5 pt-0">
                      <InfoRow label="Address" value={<span className="text-xs">{watchedValues.addressLine}</span>} />
                      <InfoRow
                        label="District / Ward"
                        value={<span className="text-xs">{watchedValues.addressLevel2}</span>}
                      />
                      <InfoRow
                        label="Province / City"
                        value={<span className="text-xs">{watchedValues.addressLevel1}</span>}
                      />
                      <InfoRow
                        label="Radius"
                        value={<span className="text-xs">{watchedValues.radiusMeters}m</span>}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold">
                        Location Photos ({watchedValues.locationImageUrls?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1.5">
                        {watchedValues.locationImageUrls?.map((url) => (
                          <img
                            key={url}
                            src={url}
                            alt="Location"
                            className="w-16 h-16 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm font-semibold">
                        Validation Documents ({watchedValues.locationValidationDocuments?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {watchedValues.locationValidationDocuments?.map((doc, docIndex) => {
                        const getDocumentTypeLabel = (type: string) => {
                          switch (type) {
                            case "LOCATION_REGISTRATION_CERTIFICATE":
                              return "Location Registration Certificate";
                            case "BUSINESS_LICENSE":
                              return "Business License";
                            case "TAX_REGISTRATION":
                              return "Tax Registration";
                            case "OTHER":
                              return "Other";
                            default:
                              return type;
                          }
                        };
                        return (
                          <div key={docIndex} className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {getDocumentTypeLabel(doc.documentType)} ({doc.documentImageUrls?.length || 0} images)
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.documentImageUrls?.map((url: string) => (
                                <img
                                  key={url}
                                  src={url}
                                  alt={getDocumentTypeLabel(doc.documentType)}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0 || isPending}
                  className={cn(currentStep === 0 && "invisible", "h-8")}
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back
                </Button>
                {currentStep < steps.length - 1 && (
                  <Button 
                    type="button"
                    size="sm"
                    onClick={handleNextStep}
                    disabled={isPending}
                    className="h-8"
                  >
                    Next Step
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="submit" size="sm" disabled={isPending} className="min-w-[140px] h-8">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileCheck className="mr-1.5 h-3.5 w-3.5" />
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

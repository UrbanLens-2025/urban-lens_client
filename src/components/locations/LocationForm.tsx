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
import { Loader2, CheckCircle2, MapPin, Image, FileCheck, ArrowLeft, ArrowRight, ChevronDown, Plus, Trash2, Building2, FileText, Tag as TagIcon, Info, Pencil } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LocationRequest } from "@/types";
import { LocationAddressPicker, AddressFields } from "@/components/shared/LocationAddressPicker";
import { useUpdateLocationRequest } from "@/hooks/locations/useUpdateLocationRequest";
import { updateLocationRequest as updateLocationRequestAPI } from "@/api/locations";
import { toast } from "sonner";
import { useLocationRequestById } from "@/hooks/locations/useLocationRequestById";
import { useAddTagsToRequest } from "@/hooks/locations/useAddTagsToRequest";
import { useRemoveTagsFromRequest } from "@/hooks/locations/useRemoveTagsFromRequest";
import { useQueryClient } from "@tanstack/react-query";
import { DisplayTags } from "../shared/DisplayTags";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTagCategories } from "@/hooks/tags/useTagCategories";
import type { Tag, TagCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocationTagsSelector } from "@/components/locations/LocationTagsSelector";

// Document types with descriptions
const DOCUMENT_TYPES = {
  LOCATION_REGISTRATION_CERTIFICATE: {
    label: "Location Registration Certificate",
    description: "Upload a clear photo of your official Location Registration Certificate. This document proves your location is registered with local authorities and is required for all business locations.",
  },
  BUSINESS_LICENSE: {
    label: "Business License",
    description: "Upload a clear photo of your Business License issued by government authorities. This license authorizes you to operate a business at this location.",
  },
  TAX_REGISTRATION: {
    label: "Tax Registration",
    description: "Upload a clear photo of your Tax Registration document. This shows your business is registered for tax purposes with the tax authority.",
  },
  OTHER: {
    label: "Other Document",
    description: "Upload a clear photo of any other official document that validates your location or business operations.",
  },
} as const;

// Helper function to count characters
const countCharacters = (text: string): number => {
  return text.length;
};

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string()
    .min(1, "Description is required")
    .max(1024, "Description must not exceed 1024 characters"),
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
        documentImageUrls: z.array(z.string().url()),
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

export default function LocationForm({
  isEditMode,
  initialData,
  locationId,
}: LocationFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [addressFieldsEditable, setAddressFieldsEditable] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const queryClient = useQueryClient();

  const { data: copiedData, isLoading: isLoadingCopiedData } =
    useLocationRequestById(copyFromId);
  const { mutate: createLocation, isPending: isCreating } =
    useCreateLocationRequest();
  const { isPending: isUpdating } = useUpdateLocationRequest();
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
  const descriptionValue = form.watch("description");

  const selectedTagIds = watchedValues.tagIds || [];
  const hasLocationType = selectedTagIds.length > 0;

  const { data: tagCategories } = useTagCategories("LOCATION");

  const tags = useMemo(() => {
    if (!tagCategories || !selectedTagIds.length) return [];
    const categoriesById = new Map<number, TagCategory>();
    tagCategories.forEach((cat) => categoriesById.set(cat.id, cat));

    const mapped: Tag[] = [];
    selectedTagIds.forEach((id: number) => {
      const cat = categoriesById.get(id);
      if (!cat) return;
      mapped.push({
        id: cat.id,
        createdAt: "",
        updatedAt: "",
        deletedAt: null,
        groupName: "LOCATION_CATEGORY",
        displayName: cat.name,
        color: cat.color,
        icon: cat.icon,
        isSelectable: true,
      });
    });

    return mapped;
  }, [tagCategories, selectedTagIds]);

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
      
      // Ensure tagIds is a valid array of integers
      const validTagIds = Array.isArray(newTagIds) && newTagIds.length > 0
        ? newTagIds.map(id => parseInt(String(id), 10)).filter(id => !isNaN(id) && Number.isInteger(id))
        : [];

      if (validTagIds.length === 0) {
        form.setError("tagIds", {
          type: "manual",
          message: "At least one location type is required. Please select a location type.",
        });
        await form.trigger("tagIds", { shouldFocus: true });
        return;
      }

      const categoryIds = validTagIds;

      const payload = {
        ...rest,
        categoryIds: categoryIds,
      };

      if (isEditMode && locationId) {
        const originalTagIds = initialData?.tags.map((t) => t.id) || [];
        const tagsToAdd = categoryIds.filter(
          (id) => !originalTagIds.includes(id)
        );
        const tagsToRemove = originalTagIds.filter(
          (id) => !categoryIds.includes(id)
        );

        const mutationPromises = [];

        mutationPromises.push(
          updateLocationRequestAPI({
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
        // Creation flow: delegate success handling (toast + navigation) to the mutation hook
        await createLocation(payload as any);
        return;
      }

      if (isEditMode) {
        toast.success("Location request updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["locationRequests"] });
        queryClient.invalidateQueries({ queryKey: ["locationRequest", locationId] });
        router.push(`/dashboard/business/locations/${locationId}`);
      }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Location Request" : "Submit a New Location"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentStepData.description}
        </p>
      </div>

      {/* Step Progress Navigation */}
      <div className="space-y-4 mt-6">
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
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
      </div>

      {/* Form Card */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="location-form">
          {/* === STEP 1: Basic Information === */}
          <div className={cn("space-y-4", currentStep !== 0 && "hidden")}>
                {/* Card 1: Location Name & Description */}
                <Card>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        name="name"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormLabel className="text-sm flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              Location Name
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Choose a clear, descriptive name that helps event creators identify your location. This will be visible in search results and location listings.</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Downtown Event Hall" className="h-9" {...field} />
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
                            <FormLabel className="text-sm flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              Description
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Provide detailed information about your location including amenities, capacity, unique features, and what makes it suitable for events. This helps creators make informed decisions.</p>
                                </TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-1">
                                <Textarea 
                                  placeholder="Describe your location, amenities, capacity, and what makes it special..."
                                  rows={3}
                                  className="text-sm resize-none"
                                  {...field}
                                />
                                <div className="flex justify-end">
                                  <span className={cn(
                                    "text-xs text-muted-foreground",
                                    countCharacters(descriptionValue || "") > 1024 && "text-destructive"
                                  )}>
                                    {countCharacters(descriptionValue || "")} / 1024 characters
                                  </span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Location Photos Card */}
                <Card>
                  <CardContent>
                    <FormField
                      name="locationImageUrls"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm flex items-center gap-2">
                            <Image className="h-4 w-4 text-muted-foreground" />
                            Location Photos
                          </FormLabel>
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
                  </CardContent>
                </Card>

                {/* Card 2: Location Categories */}
                <Card>
                  <CardContent>
                    <FormField
                      name="tagIds"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm flex items-center gap-2 mb-2">
                            <TagIcon className="h-4 w-4 text-muted-foreground" />
                            Location categories
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">
                                  Select one or more categories that best describe your location type. This helps event creators find locations that match their event needs.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <LocationTagsSelector
                              value={field.value}
                              onChange={(ids) =>
                                form.setValue("tagIds", ids, { shouldValidate: true })
                              }
                              error={form.formState.errors.tagIds?.message}
                              helperText="Select the location type and other relevant categories."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* === STEP 2: Address & Map === */}
              <Alert className={cn("bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", currentStep !== 1 && "hidden")}>
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  You can search for an address, click on the map to select a location, or manually fill in location details below.
                </AlertDescription>
              </Alert>
              <Card className={cn("mt-3", currentStep !== 1 && "hidden")}>
                <CardContent>
                  <div className={cn("space-y-4", currentStep !== 1 && "hidden")}>
                <div className="space-y-4">
                  <LocationAddressPicker />
                </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Fields Card */}
              <Card className={cn("mt-3", currentStep !== 1 && "hidden")}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">Address Details</CardTitle>
                    <CardDescription className="text-sm">
                      Address information automatically filled from map selection
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddressFieldsEditable(!addressFieldsEditable)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {addressFieldsEditable ? "Done Editing" : "Edit Address"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <AddressFields editable={addressFieldsEditable} />
                </CardContent>
              </Card>

              {/* === STEP 3: Upload Files === */}
              <div className={cn("space-y-3", currentStep !== 2 && "hidden")}>
                {/* Validation Documents Card */}
                <FormField
                  name="locationValidationDocuments"
                  control={form.control}
                  render={({ field }) => {
                      const getDocumentTypeLabel = (type: string) => {
                        return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.label || type;
                      };
                      
                      const hasDocuments = field.value && field.value.length > 0;
                      
                      return (
                        <FormItem>
                          <Card className="mt-3">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                              <div>
                                <CardTitle className="text-base font-semibold">Validation Documents</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                  These documents will be used to validate your location
                                </CardDescription>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    className="gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add Document
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                  <DropdownMenuLabel>Select Document Type</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {Object.entries(DOCUMENT_TYPES).map(([key, { label, description }]) => {
                                    const currentDocs = form.getValues("locationValidationDocuments") || [];
                                    const alreadyAdded = currentDocs.some(doc => doc.documentType === key);
                                    
                                    return (
                                      <DropdownMenuItem
                                        key={key}
                                        disabled={alreadyAdded}
                                        onClick={() => {
                                          form.setValue("locationValidationDocuments", [
                                            ...currentDocs,
                                            {
                                              documentType: key,
                                              documentImageUrls: [],
                                            },
                                          ]);
                                        }}
                                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span className="font-medium text-sm">{label}</span>
                                          {alreadyAdded && (
                                            <Badge variant="secondary" className="text-xs">Added</Badge>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground text-left">
                                          {description}
                                        </span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                            {hasDocuments ? (
                              field.value.map((doc, index) => {
                                const currentDocType = doc.documentType;
                                const docTypeInfo = DOCUMENT_TYPES[currentDocType as keyof typeof DOCUMENT_TYPES];
                                
                                return (
                                  <Card key={index} className="border p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <FileCheck className="h-4 w-4 text-primary shrink-0" />
                                            <h3 className="text-sm font-semibold">
                                              {getDocumentTypeLabel(currentDocType)}
                                            </h3>
                                            {doc.documentImageUrls && doc.documentImageUrls.length > 0 && (
                                              <Badge variant="secondary" className="text-xs shrink-0">
                                                {doc.documentImageUrls.length} {doc.documentImageUrls.length === 1 ? 'image' : 'images'}
                                              </Badge>
                                            )}
                                          </div>
                                          {docTypeInfo?.description && (
                                            <p className="text-xs text-muted-foreground">
                                              {docTypeInfo.description}
                                            </p>
                                          )}
                                        </div>
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
                                      </div>
                                  <FormField
                                    control={form.control}
                                    name={`locationValidationDocuments.${index}.documentType`}
                                    render={({ field }) => (
                                      <FormItem className="hidden">
                                        <FormControl>
                                          <input type="hidden" {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`locationValidationDocuments.${index}.documentImageUrls`}
                                    render={({ field: imagesField }) => {
                                      return (
                                        <FormItem>
                                          <div className="space-y-1.5">
                                            <FormControl>
                                              <FileUpload
                                                value={imagesField.value}
                                                onChange={imagesField.onChange}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </div>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                </div>
                              </Card>
                            );
                          })
                            ) : (
                              <Card className="border-2 border-dashed p-6 bg-muted/10 hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col items-center justify-center text-center space-y-3">
                                  <div className="p-3 rounded-full bg-muted">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">No documents added</p>
                                    <p className="text-xs text-muted-foreground">
                                      Add validation documents to verify your location
                                    </p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        className="gap-2"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Add Document
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-80">
                                      <DropdownMenuLabel>Select Document Type</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {Object.entries(DOCUMENT_TYPES).map(([key, { label, description }]) => {
                                        const currentDocs = form.getValues("locationValidationDocuments") || [];
                                        const alreadyAdded = currentDocs.some(doc => doc.documentType === key);
                                        
                                        return (
                                          <DropdownMenuItem
                                            key={key}
                                            disabled={alreadyAdded}
                                            onClick={() => {
                                              form.setValue("locationValidationDocuments", [
                                                ...(currentDocs || []),
                                                {
                                                  documentType: key,
                                                  documentImageUrls: [],
                                                },
                                              ]);
                                            }}
                                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                          >
                                            <div className="flex items-center justify-between w-full">
                                              <span className="font-medium text-sm">{label}</span>
                                              {alreadyAdded && (
                                                <Badge variant="secondary" className="text-xs">Added</Badge>
                                              )}
                                            </div>
                                            <span className="text-xs text-muted-foreground text-left">
                                              {description}
                                            </span>
                                          </DropdownMenuItem>
                                        );
                                      })}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </Card>
                            )}
                              </div>
                            </CardContent>
                          </Card>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
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

                <Card className="border shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Location Images Gallery - Top Section */}
                    {watchedValues.locationImageUrls && watchedValues.locationImageUrls.length > 0 && (
                      <div className="relative w-full">
                        {watchedValues.locationImageUrls.length === 1 ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="relative w-full aspect-[21/9] bg-muted overflow-hidden group cursor-pointer">
                                <img
                                  src={watchedValues.locationImageUrls[0]}
                                  alt="Location"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl p-0 bg-transparent border-none shadow-none">
                              <VisuallyHidden>
                                <DialogTitle>Location photo preview</DialogTitle>
                              </VisuallyHidden>
                              <img
                                src={watchedValues.locationImageUrls[0]}
                                alt="Location photo preview"
                                className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
                              />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <div className="grid grid-cols-4 gap-0">
                            {watchedValues.locationImageUrls.slice(0, 4).map((url, index) => (
                              <Dialog key={url || index}>
                                <DialogTrigger asChild>
                                  <div className="relative aspect-[4/3] bg-muted overflow-hidden group cursor-pointer border-r last:border-r-0 border-b">
                                    <img
                                      src={url}
                                      alt={`Location photo ${index + 1}`}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    {index === 3 && watchedValues.locationImageUrls.length > 4 && (
                                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                          +{watchedValues.locationImageUrls.length - 4} more
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl p-0 bg-transparent border-none shadow-none">
                                  <VisuallyHidden>
                                    <DialogTitle>Location photo preview</DialogTitle>
                                  </VisuallyHidden>
                                  <img
                                    src={url}
                                    alt="Location photo preview"
                                    className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
                                  />
                                </DialogContent>
                              </Dialog>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location Name & Details Section */}
                    <div className="p-6 space-y-6">
                      {/* Location Name */}
                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">{watchedValues.name || "Untitled Location"}</h2>
                        {watchedValues.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {watchedValues.description}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {tags && tags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location Categories</p>
                          <DisplayTags tags={tags} maxCount={10} />
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t" />

                      {/* Address Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Address</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Street Address</p>
                              <p className="text-sm">{watchedValues.addressLine || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">District / Ward</p>
                              <p className="text-sm">{watchedValues.addressLevel2 || "—"}</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Province / City</p>
                              <p className="text-sm">{watchedValues.addressLevel1 || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Coverage Radius</p>
                              <p className="text-sm">{watchedValues.radiusMeters || 0}m</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Validation Documents */}
                      {watchedValues.locationValidationDocuments && watchedValues.locationValidationDocuments.length > 0 && (
                        <>
                          <div className="border-t" />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-4 w-4 text-muted-foreground" />
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Validation Documents</p>
                            </div>
                            <div className="space-y-4 pl-6">
                              {watchedValues.locationValidationDocuments.map((doc, docIndex) => {
                                const getDocumentTypeLabel = (type: string) => {
                                  return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.label || type;
                                };
                                if (!doc.documentImageUrls || doc.documentImageUrls.length === 0) return null;
                                
                                return (
                                  <div key={docIndex} className="space-y-2">
                                    <p className="text-sm font-medium">
                                      {getDocumentTypeLabel(doc.documentType)}
                                      <span className="text-xs text-muted-foreground font-normal ml-2">
                                        ({doc.documentImageUrls.length} {doc.documentImageUrls.length === 1 ? 'image' : 'images'})
                                      </span>
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                      {doc.documentImageUrls.map((url: string, imgIndex: number) => (
                                        <Dialog key={url || imgIndex}>
                                          <DialogTrigger asChild>
                                            <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer border">
                                              <img
                                                src={url}
                                                alt={`${getDocumentTypeLabel(doc.documentType)} ${imgIndex + 1}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
                                            <VisuallyHidden>
                                              <DialogTitle>{getDocumentTypeLabel(doc.documentType)} preview</DialogTitle>
                                            </VisuallyHidden>
                                            <img
                                              src={url}
                                              alt={`${getDocumentTypeLabel(doc.documentType)} preview`}
                                              className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Additional Images (if more than 4) */}
                      {watchedValues.locationImageUrls && watchedValues.locationImageUrls.length > 4 && (
                        <>
                          <div className="border-t" />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4 text-muted-foreground" />
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Additional Photos ({watchedValues.locationImageUrls.length - 4} more)
                              </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pl-6">
                              {watchedValues.locationImageUrls.slice(4).map((url, index) => (
                                <Dialog key={url || index + 4}>
                                  <DialogTrigger asChild>
                                    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer border">
                                      <img
                                        src={url}
                                        alt={`Location photo ${index + 5}`}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-6xl p-0 bg-transparent border-none shadow-none">
                                    <VisuallyHidden>
                                      <DialogTitle>Location photo preview</DialogTitle>
                                    </VisuallyHidden>
                                    <img
                                      src={url}
                                      alt="Location photo preview"
                                      className="w-full h-auto max-h-[90vh] rounded-lg object-contain"
                                    />
                                  </DialogContent>
                                </Dialog>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    Our admin team will review your submission and respond within 1-2 business days.
                  </AlertDescription>
                </Alert>
              </div>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 0 || isPending}
              className={cn(currentStep === 0 && "invisible")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
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
              <>
                <Button 
                  type="button" 
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isPending}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Submit for Review
                </Button>
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Submission</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to submit this location request for review? 
                        Please make sure all information is correct before proceeding.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowConfirmDialog(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowConfirmDialog(false);
                          form.handleSubmit(onSubmit)();
                        }}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FileCheck className="mr-2 h-4 w-4" />
                            Confirm & Submit
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";

// --- Hooks ---
import { useCreateLocationRequest } from "@/hooks/useCreateLocationRequest";
import { useUser } from "@/hooks/useUser";
import { useLocationRequestById } from "@/hooks/useLocationRequestById";

// --- UI Components ---
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
import { GoogleMapsPicker } from "@/components/shared/GoogleMapsPicker";

// --- Zod Schema Hoàn Chỉnh ---
const locationSchema = z.object({
  // Step 1
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  tagIds: z.array(z.number()).min(1, "At least one tag is required."),

  // Step 2
  addressLevel1: z.string().min(1, "Province/City is required"),
  addressLevel2: z.string().min(1, "District/Ward is required"),
  addressLine: z.string().min(1, "Street address is required"),
  latitude: z.number({ error: "Please select a location on the map." }),
  longitude: z.number({ error: "Please select a location on the map." }),

  // Step 3
  locationImageUrls: z
    .array(z.string().url())
    .min(1, "At least one location image is required."),
  documentImageUrl: z
    .string()
    .url("A validation document is required.")
    .min(1, "A validation document is required."),
});
type FormValues = z.infer<typeof locationSchema>;

// --- Định nghĩa các bước ---
const steps = [
  {
    id: 1,
    title: "Basic Information",
    fields: ["name", "description", "tagIds"] as const,
  },
  {
    id: 2,
    title: "Address & Map",
    fields: [
      "addressLevel1",
      "addressLevel2",
      "addressLine",
      "latitude",
      "longitude",
    ] as const,
  },
  {
    id: 3,
    title: "Images & Documents",
    fields: ["locationImageUrls", "documentImageUrl"] as const,
  },
  { id: 4, title: "Confirmation" },
];

export default function CreateLocationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");

  const { data: copiedData, isLoading: isLoadingCopiedData } =
    useLocationRequestById(copyFromId);
  const { mutate: createLocation, isPending } = useCreateLocationRequest();

  const form = useForm<FormValues>({
    resolver: zodResolver(locationSchema),
    mode: "all",
    defaultValues: {
      name: "",
      description: "",
      tagIds: [],
      addressLevel1: "",
      addressLevel2: "",
      addressLine: "",
      locationImageUrls: [],
      documentImageUrl: "",
    },
  });

  // Tự động điền form khi có dữ liệu copy
  useEffect(() => {
    if (copiedData) {
      form.reset({
        name: copiedData.name,
        description: copiedData.description,
        addressLine: copiedData.createdBy.address,
        addressLevel1: "Province Name", // Cần logic để lấy tên tỉnh từ code
        addressLevel2: copiedData.createdBy.wardCode,
        latitude: parseFloat(copiedData.latitude),
        longitude: parseFloat(copiedData.longitude),
        tagIds: copiedData.tags.map((t) => t.tagId),
        locationImageUrls: copiedData.locationImageUrls,
        documentImageUrl:
          copiedData.locationValidationDocuments[0]?.documentImageUrls[0] || "",
      });
    }
  }, [copiedData, form]);

  const watchedValues = form.watch();
  const markerPosition =
    watchedValues.latitude && watchedValues.longitude
      ? { lat: watchedValues.latitude, lng: watchedValues.longitude }
      : null;

  // Logic điều hướng
  const handleNextStep = async () => {
    const fields = steps[currentStep].fields;
    if (fields) {
      const output = await form.trigger(fields, { shouldFocus: true });
      if (!output) return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  function onSubmit(values: FormValues) {
    const { documentImageUrl, ...restOfValues } = values;
    const payload = {
      ...restOfValues,
      locationValidationDocuments: [
        {
          documentType: "LOCATION_REGISTRATION_CERTIFICATE",
          documentImageUrls: [documentImageUrl],
        },
      ],
    };
    createLocation(payload);
  }

  // Bảo vệ route và trạng thái loading
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
            Submit a New Location (Step {currentStep + 1}/{steps.length})
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
                <div className="h-80 rounded-lg overflow-hidden border">
                  <GoogleMapsPicker
                    position={markerPosition}
                    onPositionChange={(latLng) => {
                      form.setValue("latitude", latLng.lat, {
                        shouldValidate: true,
                      });
                      form.setValue("longitude", latLng.lng, {
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>
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

              {/* === STEP 3: Upload Files === */}
              <div className={cn("space-y-6", currentStep !== 2 && "hidden")}>
                <FormField
                  name="locationImageUrls"
                  render={() => (
                    <FormItem>
                      <FormLabel>Location Photos (at least 1)</FormLabel>
                      <FileUpload
                        multiple
                        onUploadComplete={(url) =>
                          form.setValue("locationImageUrls", [
                            ...form.getValues("locationImageUrls"),
                            url,
                          ])
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="documentImageUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Validation Document (required)</FormLabel>
                      <FileUpload
                        onUploadComplete={(url) =>
                          form.setValue("documentImageUrl", url)
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* === STEP 4: Xác nhận === */}
              <div className={cn("space-y-4", currentStep !== 3 && "hidden")}>
                <h3 className="text-lg font-semibold">
                  Please review your information
                </h3>
                <div className="p-4 border rounded-md space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Name:</strong> {watchedValues.name}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {`${watchedValues.addressLine || ""}, ${
                      watchedValues.addressLevel2 || ""
                    }, ${watchedValues.addressLevel1 || ""}`}
                  </p>
                  <p>
                    <strong>Coordinates:</strong> Lat:{" "}
                    {watchedValues.latitude?.toFixed(4)}, Lng:{" "}
                    {watchedValues.longitude?.toFixed(4)}
                  </p>
                  <p>
                    <strong>Tags:</strong> {watchedValues.tagIds?.length || 0}{" "}
                    selected
                  </p>
                  <p>
                    <strong>Images:</strong>{" "}
                    {watchedValues.locationImageUrls?.length || 0} uploaded
                  </p>
                </div>
              </div>

              {/* --- Nút điều hướng --- */}
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

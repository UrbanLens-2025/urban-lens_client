/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateEventRequest } from "@/hooks/events/useCreateEventRequest";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { StepIndicator } from "./_components/StepIndicator";
import { Step1BasicInfo } from "./_components/Step1BasicInfo";
import { Step2TagsSelection } from "./_components/Step2TagsSelection";
import { Step3LocationSelection } from "./_components/Step3LocationSelection";
import { Step4ReviewPayment } from "./_components/Step4ReviewPayment";
import { CreateEventRequestPayload } from "@/types";

// Custom validation for date ranges
const dateRangeValidation = z
  .array(
    z.object({
      startDateTime: z.date(),
      endDateTime: z.date(),
    })
  )
  .refine(
    (ranges) =>
      ranges.every((range) => range.endDateTime > range.startDateTime),
    {
      message: "End time must be after start time for all slots",
    }
  )
  .refine(
    (ranges) =>
      ranges.every((range) => range.startDateTime > new Date()),
    {
      message: "All event times must be in the future",
    }
  );

const customVenueDetailsSchema = z.object({
  venueName: z.string().min(1, "Venue name is required"),
  addressLine: z.string().min(1, "Address is required"),
  addressLevel1: z.string().optional(),
  addressLevel2: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  additionalNotes: z.string().optional(),
});

const formSchema = z
  .object({
    // Step 1 fields
    eventName: z
      .string()
      .min(3, "Event name must be at least 3 characters")
      .max(255, "Event name must not exceed 255 characters"),
    eventDescription: z
      .string()
      .min(5, "Description must be at least 5 characters")
      .max(1024, "Description must not exceed 1024 characters"),
    expectedNumberOfParticipants: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0"),
    allowTickets: z.boolean(),
    specialRequirements: z
      .string()
      .min(1, "Special requirements are required")
      .max(624, "Special requirements must not exceed 624 characters"),
    tagIds: z.array(z.number()).min(1, "Select at least 1 tag"),
    eventValidationDocuments: z
      .array(
        z.object({
          documentType: z.literal("EVENT_PERMIT"),
          documentImageUrls: z.array(z.string().url()).min(1, "Upload at least 1 document"),
        })
      )
      .min(1, "Upload at least 1 document"),
    social: z
      .array(
        z.object({
          platform: z.string(),
          url: z.string().url("Invalid URL"),
          isMain: z.boolean(),
        })
      )
      .optional(),

    // Step 2 fields (step 3 after tags)
    venueType: z.literal("business"),
    locationId: z.string().uuid("Invalid location ID").optional(),
    dateRanges: z.array(
      z.object({
        startDateTime: z.date(),
        endDateTime: z.date(),
      })
    ).min(1, "Select at least one time slot for your event"),
  })
  .superRefine((data, ctx) => {
    // Conditional validation: locationId required
    if (!data.locationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a location",
        path: ["locationId"],
      });
    }

    // Validate date ranges
    if (data.dateRanges && data.dateRanges.length > 0) {
      for (const range of data.dateRanges) {
        if (range.endDateTime <= range.startDateTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End time must be after start time",
            path: ["dateRanges"],
          });
        }
        if (range.startDateTime <= new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Event times must be in the future",
            path: ["dateRanges"],
          });
        }
      }
    }
  });

export type CreateEventRequestForm = z.infer<typeof formSchema>;

export default function CreateEventRequestPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const createEvent = useCreateEventRequest();

  const form = useForm<CreateEventRequestForm>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      eventName: "",
      eventDescription: "",
      expectedNumberOfParticipants: undefined,
      allowTickets: true,
      specialRequirements: "",
      tagIds: [],
      eventValidationDocuments: [],
      social: [],
      venueType: "business",
      locationId: undefined,
      dateRanges: [],
    },
  });

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CreateEventRequestForm)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = [
          "eventName",
          "eventDescription",
          "expectedNumberOfParticipants",
          "specialRequirements",
          "eventValidationDocuments",
        ];
        break;
      case 2:
        fieldsToValidate = ["tagIds"];
        break;
      case 3:
        fieldsToValidate = [
          "locationId",
          "dateRanges",
        ];
        break;
      case 4:
        // Validate entire form
        const isValid = await form.trigger();
        if (!isValid) {
          const errors = form.formState.errors;
          const errorMessages = Object.entries(errors)
            .map(([field, error]) => `${field}: ${error.message}`)
            .join(", ");
          toast.error("Please fix all validation errors before submitting", {
            description: errorMessages.substring(0, 150) + (errorMessages.length > 150 ? "..." : ""),
          });
        }
        return isValid;
    }

    const result = await form.trigger(fieldsToValidate);
    
    // Show error toast with specific field errors
    if (!result) {
      const errors = form.formState.errors;
      const errorFields = fieldsToValidate.filter(field => errors[field]);
      
      if (errorFields.length > 0) {
        const errorMessages = errorFields
          .map(field => {
            const error = errors[field];
            return error?.message || `${field} is invalid`;
          })
          .join(", ");
        
        toast.error(`Please fix the following errors to continue:`, {
          description: errorMessages.substring(0, 150) + (errorMessages.length > 150 ? "..." : ""),
        });

        // Scroll to first error field
        const firstErrorField = errorFields[0];
        setTimeout(() => {
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
    
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setShowValidationErrors(false);
      setCurrentStep(currentStep + 1);
      // Scroll to top of page when moving to next step
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (!isValid) {
      setShowValidationErrors(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setShowValidationErrors(false);
      setCurrentStep(currentStep - 1);
      // Scroll to top of page when moving to previous step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateStep(4);
    if (!isValid) {
      return;
    }

    const values = form.getValues();
    const { dateRanges, ...rest } = values;

    // For custom venues, we still need a locationId - this might need backend handling
    // For now, we'll submit what we have and let the backend decide
    const payload: CreateEventRequestPayload = {
      ...rest,
      social: values.social || [],
      locationId: values.locationId || "", // Will need to handle custom venues differently
      dates: dateRanges.map((range) => ({
        startDateTime: range.startDateTime.toISOString(),
        endDateTime: range.endDateTime.toISOString(),
      })),
    };

    // Remove optional fields that shouldn't be in payload
    delete (payload as any).venueType;

    createEvent.mutate(payload);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo form={form} />;
      case 2:
        return <Step2TagsSelection form={form} />;
      case 3:
        return <Step3LocationSelection form={form} />;
      case 4:
        return (
          <Step4ReviewPayment
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={createEvent.isPending}
          />
        );
      default:
        return null;
    }
  };

  const getStepErrorFields = (step: number): string[] => {
    const errors = form.formState.errors;
    let fieldsToCheck: (keyof CreateEventRequestForm)[] = [];

    switch (step) {
      case 1:
        fieldsToCheck = [
          "eventName",
          "eventDescription",
          "expectedNumberOfParticipants",
          "specialRequirements",
          "eventValidationDocuments",
        ];
        break;
      case 2:
        fieldsToCheck = ["tagIds"];
        break;
      case 3:
        fieldsToCheck = [
          "locationId",
          "dateRanges",
        ];
        break;
    }

    return fieldsToCheck
      .filter((field) => errors[field])
      .map((field) => {
        const fieldName = field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        return fieldName;
      });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event Request</h1>
        <p className="text-muted-foreground mt-2">
          Fill out the form below to submit your event request
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      {showValidationErrors && currentStep !== 4 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            Please fix the following fields to continue:{" "}
            <strong>{getStepErrorFields(currentStep).join(", ")}</strong>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <Card>
          <CardContent className="pt-6">{renderStepContent()}</CardContent>
        </Card>
      </Form>

      {/* Navigation Buttons */}
      {currentStep !== 4 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button onClick={handleNext}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}


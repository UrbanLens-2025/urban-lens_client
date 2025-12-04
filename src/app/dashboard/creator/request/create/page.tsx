/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateEvent } from "@/hooks/events/useCreateEvent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText } from "lucide-react";
import { StepIndicator } from "./_components/StepIndicator";
import { Step1BasicInfo } from "./_components/Step1BasicInfo";
import { Step2TagsSelection } from "./_components/Step2TagsSelection";
import { Step3Documents } from "./_components/Step3Documents";
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
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    coverUrl: z.string().url("Invalid cover image URL").optional(),
    avatarUrl: z.string().url("Invalid avatar image URL").optional(),
    social: z
      .array(
        z.object({
          platform: z.string(),
          url: z.string().url("Invalid URL"),
          isMain: z.boolean(),
        })
      )
      .optional(),

    // Step 2 fields
    tagIds: z.array(z.number()).min(1, "Select at least 1 tag"),

    // Step 3 fields
    eventValidationDocuments: z
      .array(
        z.object({
          documentType: z.string().min(1, "Document type is required"),
          documentImageUrls: z.array(z.string().url("Invalid image URL")).min(1, "At least one image is required"),
        })
      )
      .optional(),

    // Legacy fields (for backward compatibility)
    venueType: z.literal("business"),
    locationId: z.string().uuid("Invalid location ID").optional(),
    dateRanges: z.array(
      z.object({
        startDateTime: z.date(),
        endDateTime: z.date(),
      })
    ).optional(),
  })
  .superRefine((data, ctx) => {
    // If either date has a value, both must have values
    const hasStartDate = !!data.startDate;
    const hasEndDate = !!data.endDate;
    
    if (hasStartDate && !hasEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required when start date is provided",
        path: ["endDate"],
      });
    }
    
    if (!hasStartDate && hasEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required when end date is provided",
        path: ["startDate"],
      });
    }
    
    // Validate end date is after start date (only if both are provided)
    if (hasStartDate && hasEndDate) {
      if (data.endDate <= data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"],
        });
      }
      if (data.startDate <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date must be in the future",
          path: ["startDate"],
        });
      }
    }

    // Legacy validation for dateRanges (if still used)
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
  const createEvent = useCreateEvent();

  const form = useForm<CreateEventRequestForm>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      eventName: "",
      eventDescription: "",
      expectedNumberOfParticipants: undefined,
      startDate: undefined,
      endDate: undefined,
      coverUrl: undefined,
      avatarUrl: undefined,
      tagIds: [],
      social: [],
      eventValidationDocuments: [],
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
          "startDate",
          "endDate",
        ];
        break;
      case 2:
        fieldsToValidate = ["tagIds"];
        break;
      case 3:
        // Documents step - no validation for now
        return true;
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

  // Watch form values for reactive validation
  const eventValidationDocuments = form.watch("eventValidationDocuments");
  
  const isCurrentStepValid = () => {
    const errors = form.formState.errors;
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        // Check required fields
        const basicFieldsValid = !errors.eventName && !errors.eventDescription && !errors.expectedNumberOfParticipants &&
                                 values.eventName && values.eventDescription && values.expectedNumberOfParticipants;
        
        // Check date fields: if both empty, valid; if either has value, both must be valid
        const hasStartDate = !!values.startDate;
        const hasEndDate = !!values.endDate;
        const datesValid = (!hasStartDate && !hasEndDate) || // Both empty is valid
                          (hasStartDate && hasEndDate && !errors.startDate && !errors.endDate); // Both provided and no errors
        
        return basicFieldsValid && datesValid;
      case 2:
        return !errors.tagIds && values.tagIds && values.tagIds.length > 0;
      case 3:
        // Documents step - Next button disabled if no valid documents (each document must have at least one image)
        const documents = eventValidationDocuments || [];
        if (documents.length === 0) {
          return false;
        }
        // Check that each document has at least one image
        return documents.every((doc) => doc.documentImageUrls && doc.documentImageUrls.length > 0);
      default:
        return true;
    }
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

  const handleSkipStep3 = () => {
    setShowValidationErrors(false);
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    // Build payload according to new API structure
    const payload = {
      displayName: values.eventName,
      description: values.eventDescription,
      expectedNumberOfParticipants: values.expectedNumberOfParticipants,
      categoryIds: values.tagIds,
      social: values.social || [],
      eventValidationDocuments: values.eventValidationDocuments || [],
      startDate: values.startDate?.toISOString(),
      endDate: values.endDate?.toISOString(),
      coverUrl: values.coverUrl,
      avatarUrl: values.avatarUrl,
    };

    createEvent.mutate(payload);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo form={form} />;
      case 2:
        return <Step2TagsSelection form={form} />;
      case 3:
        return <Step3Documents form={form} />;
      case 4:
        return (
          <Step4ReviewPayment
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={createEvent.isPending}
            onEditStep={setCurrentStep}
            onBack={handlePrevious}
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
        ];
        break;
      case 2:
        fieldsToCheck = ["tagIds"];
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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Event Request</h1>
            <p className="text-muted-foreground mt-1">
              Fill out the form below to submit your event request
            </p>
          </div>
        </div>
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
        <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-primary/5">
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
          <div className="flex gap-2">
            {currentStep === 3 && (
              <Button
                variant="ghost"
                onClick={handleSkipStep3}
                disabled={createEvent.isPending}
              >
                Skip this step
              </Button>
            )}
            <Button onClick={handleNext} disabled={!isCurrentStepValid()}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateEvent } from "@/hooks/events/useCreateEvent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileText, ArrowLeft, ArrowRight, Clock, AlertTriangle, XCircle } from "lucide-react";
import { StepIndicator } from "./_components/StepIndicator";
import { Step1LocationSelection } from "./_components/Step3LocationSelection";
import { Step2BasicInfo } from "./_components/Step1BasicInfo";
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
    // Public venue terms acceptance
    publicVenueTermsAccepted: z.boolean().optional(),
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
    if (hasStartDate && hasEndDate && data.startDate && data.endDate) {
      if (data.endDate <= data.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"],
        });
      }
      // Validate future dates
      if (data.startDate <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date must be in the future",
          path: ["startDate"],
        });
      }
    }

    // Validate dateRanges cover event dates (if both exist)
    // Note: locationId and dateRanges are optional - user can skip venue selection
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
      
      // CRITICAL: Validate that dateRanges cover the event period if event dates are provided
      // This is REQUIRED - booking slots MUST cover the entire event period
      if (data.startDate && data.endDate) {
        const eventStart = new Date(data.startDate);
        eventStart.setMilliseconds(0);
        const eventEnd = new Date(data.endDate);
        eventEnd.setMilliseconds(0);
        
        // Find earliest start and latest end across all slots
        const allSlotStarts = data.dateRanges.map(range => {
          const d = new Date(range.startDateTime);
          d.setMilliseconds(0);
          return d.getTime();
        });
        const allSlotEnds = data.dateRanges.map(range => {
          const d = new Date(range.endDateTime);
          d.setMilliseconds(0);
          return d.getTime();
        });
        
        if (allSlotStarts.length === 0 || allSlotEnds.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Booking slots are required and must cover the event period",
            path: ["dateRanges"],
          });
          return; // Exit early if no valid slots
        }
        
        const earliestStart = new Date(Math.min(...allSlotStarts));
        const latestEnd = new Date(Math.max(...allSlotEnds));
        
        // CRITICAL VALIDATION RULES:
        // 1. booking start <= event start
        // 2. booking end >= event end
        // 3. (booking end - booking start) >= (event end - event start) - booking must cover full event duration
        
        // Validate: earliest booking start must be <= event start
        if (earliestStart.getTime() > eventStart.getTime()) {
          const earliestStartStr = earliestStart.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
          const eventStartStr = eventStart.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Booking start date (${earliestStartStr}) must be <= event start date (${eventStartStr}). Please select slots that start on or before the event start.`,
            path: ["dateRanges"],
          });
        }
        
        // Validate: latest booking end must be >= event end
        if (latestEnd.getTime() < eventEnd.getTime()) {
          const latestEndStr = latestEnd.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
          const eventEndStr = eventEnd.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Booking end date (${latestEndStr}) must be >= event end date (${eventEndStr}). Please select slots that end on or after the event end.`,
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
      publicVenueTermsAccepted: false,
    },
  });

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CreateEventRequestForm)[] = [];

    switch (step) {
      case 1:
        // Basic Info step
        fieldsToValidate = [
          "eventName",
          "eventDescription",
          "expectedNumberOfParticipants",
          "startDate",
          "endDate",
          "tagIds",
        ];
        break;
      case 2:
        // Location step - optional, always valid
        return true;
      case 3:
        // Documents step - optional, always valid
        return true;
      case 4:
        // Validate entire form (location is optional but recommended)
        const isValid = await form.trigger();
        if (!isValid) {
          toast.dismiss(); // Dismiss any existing toasts
          const errors = form.formState.errors;
          const errorMessages = Object.entries(errors)
            .map(([field, error]) => `${field}: ${error.message}`)
            .join(", ");
        toast.error("Validation errors", {
          description: (
            <div className="space-y-1 mt-1">
              <p className="text-sm">Please fix the following errors before submitting:</p>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {errorMessages.substring(0, 200) + (errorMessages.length > 200 ? "..." : "")}
              </p>
            </div>
          ),
          icon: <XCircle className="h-4 w-4" />,
          duration: 8000,
        });
        }
        return isValid;
    }

    const result = await form.trigger(fieldsToValidate);
    
    // Show error toast with specific field errors
    if (!result) {
      toast.dismiss(); // Dismiss any existing toasts
      
      const errors = form.formState.errors;
      const errorFields = fieldsToValidate.filter(field => errors[field]);
      
      if (errorFields.length > 0) {
        const errorMessages = errorFields
          .map(field => {
            const error = errors[field];
            return error?.message || `${field} is invalid`;
          })
          .join(", ");
        
        toast.error("Form validation errors", {
          description: (
            <div className="space-y-1 mt-1">
              <p className="text-sm">Please fix the following errors to continue:</p>
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                {errorMessages.substring(0, 200) + (errorMessages.length > 200 ? "..." : "")}
              </p>
            </div>
          ),
          icon: <AlertCircle className="h-4 w-4" />,
          duration: 6000,
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
        
        // Check tags
        const tagsValid = !errors.tagIds && values.tagIds && values.tagIds.length > 0;
        
        return basicFieldsValid && datesValid && tagsValid;
      case 2:
        // Location step - OPTIONAL: can be skipped
        // If locationId is provided, dateRanges must also be provided and valid
        // If neither is provided, step is valid (can be skipped)
        if (values.locationId) {
          // If location is selected, dateRanges must be provided and valid
          return !errors.locationId && !errors.dateRanges && 
                 values.dateRanges && values.dateRanges.length > 0;
        }
        // If no location selected, step is valid (can be skipped)
        return !errors.locationId && !errors.dateRanges;
      case 3:
        // Documents step - optional, always valid to proceed
        return true;
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


  const handlePrevious = () => {
    if (currentStep > 1) {
      setShowValidationErrors(false);
      setCurrentStep(currentStep - 1);
      // Scroll to top of page when moving to previous step
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    // Dismiss any existing toasts first
    toast.dismiss();
    
    const isValid = await validateStep(5);
    if (!isValid) {
      return;
    }

    const values = form.getValues();
    
      // Validate booking slots coverage (only if dateRanges are provided)
      // Rules: 
      // 1. booking start <= event start
      // 2. booking end >= event end
    if (values.dateRanges && values.dateRanges.length > 0 && values.startDate && values.endDate) {
      const eventStart = new Date(values.startDate);
      eventStart.setMilliseconds(0);
      const eventEnd = new Date(values.endDate);
      eventEnd.setMilliseconds(0);
      
      const allSlotStarts = values.dateRanges.map(range => {
        const d = new Date(range.startDateTime);
        d.setMilliseconds(0);
        return d.getTime();
      });
      const allSlotEnds = values.dateRanges.map(range => {
        const d = new Date(range.endDateTime);
        d.setMilliseconds(0);
        return d.getTime();
      });
      
      const bookingStart = new Date(Math.min(...allSlotStarts));
      const bookingEnd = new Date(Math.max(...allSlotEnds));
      
      // Validation: booking start <= event start AND booking end >= event end
      if (bookingStart.getTime() > eventStart.getTime() || bookingEnd.getTime() < eventEnd.getTime()) {
        const eventStartStr = eventStart.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const eventEndStr = eventEnd.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const bookingStartStr = bookingStart.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const bookingEndStr = bookingEnd.toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        let errorTitle = "Cannot submit: Booking doesn't cover event period";
        let errorDescription: React.ReactNode;
        
        if (bookingStart.getTime() > eventStart.getTime() && bookingEnd.getTime() < eventEnd.getTime()) {
          // Both conditions fail
          errorDescription = (
            <div className="space-y-1.5 mt-1">
              <p className="text-sm">Your booking period (<strong className="text-destructive">{bookingStartStr}</strong> - <strong className="text-destructive">{bookingEndStr}</strong>) doesn't cover the event period (<strong>{eventStartStr}</strong> - <strong>{eventEndStr}</strong>).</p>
              <p className="text-xs text-muted-foreground">Booking must start on or before event start and end on or after event end.</p>
            </div>
          );
        } else if (bookingStart.getTime() > eventStart.getTime()) {
          // Booking starts after event starts
          errorDescription = (
            <div className="space-y-1.5 mt-1">
              <p className="text-sm">Your booking starts <strong className="text-destructive">{bookingStartStr}</strong>, but the event starts <strong>{eventStartStr}</strong>.</p>
              <p className="text-xs text-muted-foreground">Booking must start on or before the event start time.</p>
            </div>
          );
        } else {
          // Booking ends before event ends
          errorDescription = (
            <div className="space-y-1.5 mt-1">
              <p className="text-sm">Your booking ends <strong className="text-destructive">{bookingEndStr}</strong>, but the event ends <strong>{eventEndStr}</strong>.</p>
              <p className="text-xs text-muted-foreground">Booking must end on or after the event end time.</p>
            </div>
          );
        }
        
        toast.error(errorTitle, {
          description: errorDescription,
          icon: <Clock className="h-4 w-4" />,
          duration: 10000,
        });
        return;
      }
    }

    // Build payload according to new API structure
    const payload: any = {
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

    // Include location data if provided (optional fields)
    if (values.locationId) {
      payload.locationId = values.locationId;
    }

    // Include date ranges if provided (for location booking)
    if (values.dateRanges && values.dateRanges.length > 0) {
      payload.dateRanges = values.dateRanges.map((range) => ({
        startDateTime: range.startDateTime.toISOString(),
        endDateTime: range.endDateTime.toISOString(),
      }));
    }

    createEvent.mutate(payload);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step2BasicInfo form={form} />;
      case 2:
        return <Step1LocationSelection form={form} />;
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
          "tagIds",
        ];
        break;
      case 2:
        // Location is optional
        fieldsToCheck = [];
        break;
      case 3:
        // Documents are optional
        fieldsToCheck = [];
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

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 lg:px-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Create Event Request
                </h1>
                <p className="text-muted-foreground mt-2 text-base">
                  Follow the steps below to create your event. You can save progress and return later.
                </p>
              </div>
            </div>
            {/* Progress Indicator */}
            <div className="hidden md:flex flex-col items-end gap-2 min-w-[120px]">
              <div className="text-sm font-semibold text-muted-foreground">
                {currentStep} of 4
              </div>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Validation Alert */}
        {showValidationErrors && currentStep !== 4 && (
          <Alert variant="destructive" className="border-2 animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Please fix the following errors</AlertTitle>
            <AlertDescription className="mt-1">
              <ul className="list-disc list-inside space-y-1">
                {getStepErrorFields(currentStep).map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Card */}
        <Form {...form}>
          <Card className="border-2 border-primary/10 shadow-2xl bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6 lg:p-8">
              <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                {renderStepContent()}
              </div>
            </CardContent>
          </Card>
        </Form>

        {/* Navigation Footer */}
        {currentStep !== 4 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-4 pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || createEvent.isPending}
                className="w-full sm:w-auto min-w-[120px]"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {(currentStep === 2 || currentStep === 3) && (
                  <Button
                    variant="ghost"
                    onClick={handleNext}
                    disabled={createEvent.isPending}
                    className="text-muted-foreground hover:text-foreground"
                    size="lg"
                  >
                    {currentStep === 2 ? "Skip Location" : "Skip Documents"}
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid() || createEvent.isPending}
                  className="w-full sm:w-auto min-w-[140px] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                  size="lg"
                >
                  {currentStep === 3 ? "Review" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


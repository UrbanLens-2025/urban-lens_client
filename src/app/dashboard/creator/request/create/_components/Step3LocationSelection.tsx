"use client";

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { Step3BusinessVenue } from "./Step3BusinessVenue";

interface Step3LocationSelectionProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3LocationSelection({ form }: Step3LocationSelectionProps) {
  // Set venue type to business on mount
  useEffect(() => {
    form.setValue("venueType", "business", { shouldValidate: false });
  }, [form]);

  return <Step3BusinessVenue form={form} />;
}

// Export alias for Step 1 (venue selection is now first step)
export const Step1LocationSelection = Step3LocationSelection;
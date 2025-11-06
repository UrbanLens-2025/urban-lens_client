"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

import { useSubmitBusinessOnboarding } from "@/hooks/onboarding/useSubmitBusinessOnboarding";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { LocationAddressPicker } from "../shared/LocationAddressPicker";
import { SingleFileUpload } from "../shared/SingleFileUpload";

const businessCategories = [
  "FOOD",
  "RETAIL",
  "SERVICE",
  "ENTERTAINMENT",
  "HEALTH",
  "EDUCATION",
  "TECHNOLOGY",
  "OTHER",
] as const;

const businessSchema = z.object({
  name: z.string().min(2, "Business name is required."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  addressLine: z.string().min(1, "Street address is required."),
  addressLevel1: z.string().min(1, "Province/City is required"),
  addressLevel2: z.string().min(1, "District/Ward is required"),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "A valid phone number is required."),
  avatar: z
    .string()
    .url("Please upload an avatar.")
    .min(1, "Please upload an avatar."),
  licenseNumber: z.string().min(1, "License number is required."),
  licenseExpirationDate: z.string().min(1, "Expiration date is required."),
  licenseType: z.string().min(1, "License type is required."),
  website: z.string().url("Must be a valid URL."),
  category: z.enum(businessCategories, {
    message: "Please select a category.",
  }),
});

type FormValues = z.infer<typeof businessSchema>;

export function BusinessOnboardingForm() {
  const { mutate: submit, isPending } = useSubmitBusinessOnboarding();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<FormValues>({
    resolver: zodResolver(businessSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      addressLine: "",
      addressLevel1: "",
      addressLevel2: "",
      email: "",
      phone: "",
      avatar: "",
      licenseNumber: "",
      licenseExpirationDate: "",
      licenseType: "",
      website: "",
    },
  });

  function onSubmit(values: FormValues) {
    const { ...payload } = values;
    submit(payload);
  }

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ["name", "description", "category", "website", "avatar"],
    2: ["email", "phone"],
    3: ["addressLine", "addressLevel1", "addressLevel2"],
    4: ["licenseType", "licenseNumber", "licenseExpirationDate"],
  };

  const handleNext = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const progress = Math.round((step / totalSteps) * 100);

  const showError = (name: keyof FormValues) => {
    const state = form.getFieldState(name);
    return state.invalid && (state.isTouched || form.formState.isSubmitted);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Set Up Your Business Profile</CardTitle>
        <CardDescription>
          This information will be displayed publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
            <span className="text-xs font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded bg-muted">
            <div
              className="h-2 rounded bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <>
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Sunrise Coffee" {...field} />
                      </FormControl>
                      <FormDescription>Use your public-facing name</FormDescription>
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
                        <Textarea placeholder="What does your business do?" {...field} />
                      </FormControl>
                      <FormDescription>At least 10 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a business category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {businessCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0) + category.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="website"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourdomain.com" {...field} />
                      </FormControl>
                      <FormDescription>Optional but helps users learn more</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="avatar"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Square image works best</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="font-semibold text-lg pt-2">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="name@business.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="phone"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="e.g., +84 901 234 567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="font-semibold text-lg pt-2">Location</h3>
                <LocationAddressPicker />
              </>
            )}

            {step === 4 && (
              <>
                <h3 className="font-semibold text-lg pt-2">License Information</h3>
                <FormField
                  name="licenseType"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Business Registration" {...field} />
                      </FormControl>
                      {showError("licenseType") && <FormMessage />}
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    name="licenseNumber"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0123456789" {...field} />
                        </FormControl>
                        {showError("licenseNumber") && <FormMessage />}
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="licenseExpirationDate"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        {showError("licenseExpirationDate") && <FormMessage />}
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1 || isPending}>
                Back
              </Button>
              {step < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={isPending}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isPending} className="min-w-[160px]">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

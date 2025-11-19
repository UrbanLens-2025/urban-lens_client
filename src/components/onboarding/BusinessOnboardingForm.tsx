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
import { Loader2, Plus, Trash2, Store, Building2, Contact, MapPin, FileCheck, ArrowRight, Sparkles, ExternalLink, CheckCircle2, Mail, Phone, Globe } from "lucide-react";
import { LocationAddressPicker } from "../shared/LocationAddressPicker";
import { SingleFileUpload } from "../shared/SingleFileUpload";
import { FileUpload } from "../shared/FileUpload";
import { AcceptedBusinessLicenseTypes } from "@/types";

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

const licenseSchema = z.object({
  licenseType: z.nativeEnum(AcceptedBusinessLicenseTypes, {
    errorMap: () => ({ message: "Please select a license type." }),
  }),
  documentImageUrls: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one document image is required."),
});

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
  licenses: z
    .array(licenseSchema)
    .min(1, "At least one license is required."),
  website: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  category: z.enum(businessCategories, {
    message: "Please select a category.",
  }),
});

type FormValues = z.infer<typeof businessSchema>;

export function BusinessOnboardingForm() {
  const { mutate: submit, isPending } = useSubmitBusinessOnboarding();
  const [step, setStep] = useState(0);
  const totalSteps = 6;

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
      licenses: [],
      website: "",
      category: undefined,
    },
  });

  function onSubmit(values: FormValues) {
    submit(values);
  }

  const stepFields: Record<number, (keyof FormValues)[]> = {
    0: [], // Welcome step has no fields
    1: ["name", "category"],
    2: ["description", "avatar", "website"],
    3: ["email", "phone"],
    4: ["addressLine", "addressLevel1", "addressLevel2"],
    5: ["licenses"],
    6: [], // Confirmation step has no fields
  };

  const handleNext = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  const showError = (name: keyof FormValues) => {
    const state = form.getFieldState(name);
    return state.invalid && (state.isTouched || form.formState.isSubmitted);
  };

  const licenses = form.watch("licenses");

  const addLicense = () => {
    const currentLicenses = form.getValues("licenses") || [];
    form.setValue("licenses", [
      ...currentLicenses,
      {
        licenseType: AcceptedBusinessLicenseTypes.BUSINESS_LICENSE,
        documentImageUrls: [],
      },
    ]);
  };

  const removeLicense = (index: number) => {
    const currentLicenses = form.getValues("licenses") || [];
    form.setValue(
      "licenses",
      currentLicenses.filter((_, i) => i !== index)
    );
  };

  const getLicenseTypeLabel = (type: AcceptedBusinessLicenseTypes) => {
    switch (type) {
      case AcceptedBusinessLicenseTypes.BUSINESS_LICENSE:
        return "Business License";
      case AcceptedBusinessLicenseTypes.OPERATING_PERMIT:
        return "Operating Permit";
      case AcceptedBusinessLicenseTypes.TAX_IDENTIFICATION:
        return "Tax Identification";
      default:
        return type;
    }
  };

  const getStepInfo = () => {
    switch (step) {
      case 0:
        return {
          icon: Sparkles,
          title: "Welcome to UrbanLens!",
          description: "Let's set up your business profile in just a few simple steps. This will help customers discover and connect with your business.",
        };
      case 1:
        return {
          icon: Building2,
          title: "Tell us about your business",
          description: "Start with the basics - what's your business called and what type of business is it?",
        };
      case 2:
        return {
          icon: Store,
          title: "Showcase your business",
          description: "Add details that help customers learn more about what makes your business special.",
        };
      case 3:
        return {
          icon: Contact,
          title: "How can customers reach you?",
          description: "Provide your contact information so customers can get in touch easily.",
        };
      case 4:
        return {
          icon: MapPin,
          title: "Where are you located?",
          description: "Help customers find your business by sharing your address.",
        };
      case 5:
        return {
          icon: FileCheck,
          title: "Verify your business",
          description: "Upload your business licenses and permits to build trust with customers.",
        };
      case 6:
        return {
          icon: Sparkles,
          title: "Review & Confirm",
          description: "Take a moment to review all your information before submitting.",
        };
      default:
        return { icon: Store, title: "", description: "" };
    }
  };

  const stepInfo = getStepInfo();
  const StepIcon = stepInfo.icon;

  const getStepColor = () => {
    switch (step) {
      case 0: return "bg-gradient-to-br from-purple-500 to-pink-500";
      case 1: return "bg-gradient-to-br from-blue-500 to-cyan-500";
      case 2: return "bg-gradient-to-br from-green-500 to-emerald-500";
      case 3: return "bg-gradient-to-br from-orange-500 to-amber-500";
      case 4: return "bg-gradient-to-br from-violet-500 to-purple-500";
      case 5: return "bg-gradient-to-br from-rose-500 to-pink-500";
      default: return "bg-primary";
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-4 mb-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${getStepColor()} shadow-md`}>
            <StepIcon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl">{stepInfo.title}</CardTitle>
            <CardDescription className="mt-1.5 text-base">
              {stepInfo.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step Progress */}
        {step > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-sm font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 0 && (
              <div className="space-y-6 py-6">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-900/50">
                    <div className="rounded-full p-2 bg-blue-500/10 dark:bg-blue-500/20">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">Basic Information</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-200">Share your business name, category, and details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50">
                    <div className="rounded-full p-2 bg-emerald-500/10 dark:bg-emerald-500/20">
                      <Contact className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-emerald-900 dark:text-emerald-100">Contact Details</h4>
                      <p className="text-sm text-emerald-700 dark:text-emerald-200">Provide ways for customers to reach you</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 border border-violet-200 dark:border-violet-900/50">
                    <div className="rounded-full p-2 bg-violet-500/10 dark:bg-violet-500/20">
                      <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-violet-900 dark:text-violet-100">Location</h4>
                      <p className="text-sm text-violet-700 dark:text-violet-200">Help customers find where you are</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-900/50">
                    <div className="rounded-full p-2 bg-amber-500/10 dark:bg-amber-500/20">
                      <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 text-amber-900 dark:text-amber-100">Business Verification</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-200">Upload licenses to verify your business</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-900">
                  <div className="flex gap-3">
                    <div className="rounded-full p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 h-fit">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-sm text-indigo-900 dark:text-indigo-100">
                      <strong className="font-semibold">Quick tip:</strong> This process takes about 5-10 minutes. Have your business licenses and photos ready to make it even faster!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2">
                        <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        What's your business name?
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Sunrise Coffee Shop" 
                          className="text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>This is the name customers will see when they discover you</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        What type of business do you operate?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Choose the category that best fits" />
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
                      <FormDescription>This helps customers find businesses like yours</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Tell customers about your business</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What makes your business unique? What products or services do you offer?" 
                          className="min-h-[120px] text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Write at least 10 characters. Be descriptive - this is your chance to stand out!
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="avatar"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Upload your business logo or photo</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Choose a clear, square image that represents your business</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="website"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const isValidUrl = field.value && !fieldState.error;
                    return (
                      <FormItem>
                        <FormLabel className="text-base">Do you have a website?</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="https://www.yourbusiness.com" 
                              className="text-base pr-12"
                              {...field} 
                            />
                            {isValidUrl && (
                              <a
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                              >
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-primary/10"
                                >
                                  <ExternalLink className="h-4 w-4 text-primary" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Optional - but it helps customers learn more about you online</FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What's your business email?</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="contact@yourbusiness.com" 
                          className="text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Customers will use this to reach out to you</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="phone"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What's your contact phone number?</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="+84 901 234 567" 
                          className="text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Include your country code (e.g., +84 for Vietnam)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-medium mb-2">Where can customers find your business?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your complete business address. This will be shown to customers on your profile.
                  </p>
                </div>
                <LocationAddressPicker />
              </div>
            )}

            {step === 5 && (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-base font-medium mb-2">Upload your business licenses</h3>
                    <p className="text-sm text-muted-foreground">
                      Verified businesses get more trust from customers. Upload clear photos of your business license, operating permit, or tax identification documents.
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                    <div className="flex items-start gap-3">
                      <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Need at least one license</p>
                        <p className="text-xs text-amber-700 dark:text-amber-200 mt-0.5">Click "Add License" to get started</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLicense}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add License
                    </Button>
                  </div>
                </div>

                {licenses && licenses.length > 0 ? (
                  <div className="space-y-4">
                    {licenses.map((license, index) => (
                      <Card key={index} className="relative border-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="rounded-full p-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
                                <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-base">License {index + 1}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {license.documentImageUrls?.length || 0} document{license.documentImageUrls?.length !== 1 ? 's' : ''} uploaded
                                </p>
                              </div>
                            </div>
                            {licenses.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLicense(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className="space-y-5">
                            <FormField
                              control={form.control}
                              name={`licenses.${index}.licenseType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-medium">What type of license is this?</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Choose license type..." />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.values(AcceptedBusinessLicenseTypes).map((type) => (
                                        <SelectItem key={type} value={type}>
                                          <div className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                                            {getLicenseTypeLabel(type)}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`licenses.${index}.documentImageUrls`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-medium">Upload document images</FormLabel>
                                  <FormControl>
                                    <div className="rounded-lg border-2 border-dashed p-1 hover:border-primary/50 transition-colors">
                                      <FileUpload
                                        value={field.value || []}
                                        onChange={field.onChange}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormDescription className="flex items-start gap-2">
                                    <span className="text-xs">💡</span>
                                    <span>
                                      Upload clear photos of your {getLicenseTypeLabel(license.licenseType).toLowerCase()}. Multiple images are supported for front/back or multi-page documents.
                                    </span>
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">
                      No licenses added yet. Click "Add License" to get started.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addLicense}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First License
                    </Button>
                  </div>
                )}

                {form.formState.errors.licenses && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.licenses.message}
                  </p>
                )}
              </>
            )}

            {step === 6 && (
              <div className="space-y-6">
                {/* Business Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Business Information
                  </h3>
                  <div className="grid gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-900/50">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Business Name:</span>
                      <span className="text-sm font-medium text-right">{form.getValues("name") || "—"}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Category:</span>
                      <span className="text-sm font-medium">
                        {form.getValues("category") ? 
                          form.getValues("category").charAt(0) + form.getValues("category").slice(1).toLowerCase() 
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <span className="text-sm font-medium text-right max-w-[250px]">
                        {form.getValues("description") ? 
                          (form.getValues("description").length > 60 ? 
                            form.getValues("description").substring(0, 60) + "..." 
                            : form.getValues("description"))
                          : "—"}
                      </span>
                    </div>
                    {form.getValues("website") && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Website:</span>
                        <a 
                          href={form.getValues("website")} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          <Globe className="h-3 w-3" />
                          Visit site
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Contact className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Contact Information
                  </h3>
                  <div className="grid gap-3 p-4 rounded-lg bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        Email:
                      </span>
                      <span className="text-sm font-medium">{form.getValues("email") || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        Phone:
                      </span>
                      <span className="text-sm font-medium">{form.getValues("phone") || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    Location
                  </h3>
                  <div className="grid gap-3 p-4 rounded-lg bg-gradient-to-br from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10 border border-violet-200 dark:border-violet-900/50">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Address:</span>
                      <span className="text-sm font-medium text-right max-w-[300px]">
                        {form.getValues("addressLine") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">City/Province:</span>
                      <span className="text-sm font-medium">{form.getValues("addressLevel1") || "—"}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">District/Ward:</span>
                      <span className="text-sm font-medium">{form.getValues("addressLevel2") || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Licenses Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Business Licenses
                  </h3>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-900/50">
                    {licenses && licenses.length > 0 ? (
                      <div className="space-y-2">
                        {licenses.map((license, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium">{getLicenseTypeLabel(license.licenseType)}</span>
                            <span className="text-muted-foreground">
                              ({license.documentImageUrls?.length || 0} document{license.documentImageUrls?.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No licenses added</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex gap-3">
                    <div className="rounded-full p-1.5 bg-green-500/10 dark:bg-green-500/20 h-fit">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        Ready to submit?
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-200">
                        Double-check that everything looks correct. You can always update your information later from your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              {step > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack} 
                  disabled={isPending}
                  className="min-w-[100px]"
                >
                  Back
                </Button>
              )}
              {step === 0 && <div />}
              {step < totalSteps ? (
                <Button 
                  type="button" 
                  onClick={handleNext} 
                  disabled={isPending}
                  className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {step === 0 ? "Let's Get Started" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending} className="min-w-[180px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending ? "Setting Up..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


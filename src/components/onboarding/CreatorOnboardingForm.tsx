"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitCreatorOnboarding } from "@/hooks/onboarding/useSubmitCreatorOnboarding";
import { useState, useEffect } from "react";

import { useUser } from "@/hooks/user/useUser";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
import { Loader2, Plus, Trash2, User, Users, Contact, Globe, Mail, Phone, LogOut, ArrowRight, CheckCircle2, ExternalLink, Sparkles, UserCheck, Link2, FileText } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { SingleFileUpload } from "../shared/SingleFileUpload";

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Required"),
  url: z.string().url("Must be a valid URL."),
  isMain: z.boolean(),
});

const creatorSchema = z.object({
  displayName: z.string().min(2, "Display name is required."),
  description: z.string(),
  email: z.string().email(),
  phoneNumber: z.string()
    .regex(/^[0-9]{9,10}$/, { message: "Phone number must be 9-10 digits." })
    .refine((val) => {
      return /^(0[3|5|7|8|9])[0-9]{8}$/.test(val) || /^[3|5|7|8|9][0-9]{8}$/.test(val);
    }, { message: "Invalid Vietnam phone number format." }),
  avatarUrl: z.string(),
  coverUrl: z.string(),
  type: z.enum(["INDIVIDUAL", "ORGANIZATION"]),
  social: z.array(socialLinkSchema),
});

const types = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "ORGANIZATION", label: "Organization" },
];

type FormValues = z.infer<typeof creatorSchema>;

interface CreatorOnboardingFormProps {
  onLogout: () => void;
}

export function CreatorOnboardingForm({ onLogout }: CreatorOnboardingFormProps) {
  const { mutate: submit, isPending } = useSubmitCreatorOnboarding();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [countryCode, setCountryCode] = useState("+84");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(creatorSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      displayName: "",
      description: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
      coverUrl: "",
      type: "INDIVIDUAL",
      social: [{ platform: "", url: "", isMain: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  // Warn user before leaving if form has been modified
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if form is dirty (has been modified) and not currently submitting
      if (form.formState.isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [form.formState.isDirty, isSubmitting]);

  function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const phoneWithCode = `${countryCode}${values.phoneNumber}`;
    submit({ ...values, phoneNumber: phoneWithCode });
  }

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ["displayName", "type", "avatarUrl", "coverUrl"],
    2: ["email", "phoneNumber"],
    3: ["description"],
    4: [],
  };

  const handleNext = async () => {
    const fields = stepFields[step];
    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) return;
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const progress = Math.round((step / totalSteps) * 100);

  const getStepInfo = () => {
    switch (step) {
      case 1:
        return {
          icon: User,
          title: "Tell us about yourself",
          description: "Start with the basics - what's your creator name and what type of creator are you?",
        };
      case 2:
        return {
          icon: Contact,
          title: "How can people reach you?",
          description: "Provide your contact information so people can get in touch easily.",
        };
      case 3:
        return {
          icon: FileText,
          title: "Tell people about yourself",
          description: "Share your description so fans can learn more about you and your events.",
        };
      case 4:
        return {
          icon: Globe,
          title: "Showcase your social presence",
          description: "Add your social links so fans can find and follow you across platforms.",
        };
      default:
        return { icon: User, title: "", description: "" };
    }
  };

  const stepInfo = getStepInfo();
  const StepIcon = stepInfo.icon;

  const getStepColor = () => {
    switch (step) {
      case 1: return "bg-gradient-to-br from-blue-500 to-cyan-500";
      case 2: return "bg-gradient-to-br from-green-500 to-emerald-500";
      case 3: return "bg-gradient-to-br from-orange-500 to-amber-500";
      case 4: return "bg-gradient-to-br from-purple-500 to-pink-500";
      default: return "bg-primary";
    }
  };

  return (
    <>
      {/* Left Column - Image Section */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2187&auto=format&fit=crop"
          alt="Creative event scene"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-pink-600/80 to-orange-600/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6">
              <span className="text-sm font-medium">✨ Setup takes ~4 minutes</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">Welcome to<br />UrbanLens</h1>
            <p className="text-xl text-white/90">Join thousands of creators connecting with audiences</p>
          </div>

          <div className="text-sm text-white/70">
            © 2025 UrbanLens. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column - Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout} 
          className="absolute top-6 right-6 z-10 gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>

        <div className="flex-1 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-10 lg:px-10 lg:py-12 w-full">
            <div className="mb-10">
              <div className="flex items-start gap-4 mb-8">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getStepColor()} shadow-lg shrink-0`}>
                  <StepIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-2xl font-bold mb-2">{stepInfo.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {stepInfo.description}
                  </p>
                </div>
              </div>
              {/* Step Progress */}
              {step > 0 && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {step} of {totalSteps}</span>
                    <span className="text-sm font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-500 ease-out shadow-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <FormField
                  name="displayName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        What&apos;s your creator name?
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., John Events or Music Festivals Co" 
                          className="text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>This is the name people will see when they discover you</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        What type of creator are you?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Choose the type that best fits" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {types.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>This helps people understand your creator profile</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Upload your avatar or logo</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Choose a clear, square image that represents you</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Upload your cover image</FormLabel>
                      <FormControl>
                        <SingleFileUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>Use a wide image for the best look</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {user && (user.email || user.phoneNumber) && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Use your account information?
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            We can auto-fill your contact details from your account
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => {
                          if (user.email) {
                            form.setValue('email', user.email, { shouldValidate: true, shouldDirty: true });
                          }
                          if (user.phoneNumber) {
                            console.log('Original phone number:', user.phoneNumber);
                            
                            // Check if phone number starts with +84
                            if (user.phoneNumber.startsWith('+84')) {
                              const numberWithoutCode = user.phoneNumber.substring(3); // Remove +84
                              console.log('Extracted number:', numberWithoutCode);
                              setCountryCode('+84');
                              form.setValue('phoneNumber', numberWithoutCode, { shouldValidate: true, shouldDirty: true });
                            } else if (user.phoneNumber.startsWith('+')) {
                              // For other country codes
                              const match = user.phoneNumber.match(/^(\+\d{1,4})(\d+)$/);
                              if (match) {
                                const [, code, number] = match;
                                console.log('Extracted code:', code, 'number:', number);
                                setCountryCode(code);
                                form.setValue('phoneNumber', number, { shouldValidate: true, shouldDirty: true });
                              }
                            } else {
                              // No country code, assume +84
                              console.log('No country code, using phone as is:', user.phoneNumber);
                              setCountryCode('+84');
                              form.setValue('phoneNumber', user.phoneNumber, { shouldValidate: true, shouldDirty: true });
                            }
                          }
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Auto-fill
                      </Button>
                    </div>
                  </div>
                )}
                
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What&apos;s your email?</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="contact@yourexample.com" 
                            className="text-base pl-9"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="phoneNumber"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">What&apos;s your contact phone number?</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+84">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">🇻🇳</span>
                                  <span>+84</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1">
                            <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="tel" 
                              placeholder="912345678" 
                              className="text-base pl-9"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                field.onChange(value);
                              }}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Tell people about yourself</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Introduce yourself, your events, style, what makes you unique..." 
                          className="min-h-[120px] text-base"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Optional but recommended - this helps people get to know you better
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <FormLabel className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    Social Links
                  </FormLabel>
                  <FormDescription>Add at least one link so fans can find you</FormDescription>
                  <div className="space-y-3 mt-2">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <FormField
                            name={`social.${index}.platform`}
                            control={form.control}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-sm">Platform</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Instagram, Facebook, Twitter"
                                    className="text-base"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            name={`social.${index}.url`}
                            control={form.control}
                            render={({ field, fieldState }) => {
                              const isValidUrl = field.value && !fieldState.error;
                              return (
                                <FormItem className="flex-1">
                                  <FormLabel className="text-sm">URL</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input 
                                        placeholder="https://..." 
                                        className="text-base pl-9 pr-12"
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
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="mt-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ platform: "", url: "", isMain: false })
                      }
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Link
                    </Button>
                  </div>
                </div>
                </div>
            )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 pt-8">
                  {step > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleBack} 
                      disabled={isPending}
                      className="px-6"
                    >
                      Back
                    </Button>
                  )}
                  {step === 1 && <div />}
                  {step < totalSteps ? (
                    <Button 
                      type="button" 
                      onClick={handleNext} 
                      disabled={isPending}
                      className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      disabled={isPending} 
                      className="px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowConfirmDialog(true);
                      }}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting Up...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Complete Setup
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ready to Launch Your Creator Profile?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p>
                  You&apos;re about to complete your creator profile. Once submitted:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your profile will be live immediately</li>
                  <li>You can start creating and managing events</li>
                  <li>You can edit your profile anytime from your dashboard</li>
                </ul>
                <p className="font-medium text-foreground pt-2">
                  Are you ready to continue?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit(onSubmit)();
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Yes, Complete Setup
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

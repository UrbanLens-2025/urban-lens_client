"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "use-debounce";

import { useSignup } from "@/hooks/auth/useSignup";
import { useUser } from "@/hooks/user/useUser";
import { useCheckEmailExists } from "@/hooks/auth/useCheckEmailExists";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff, User, Mail, Phone, Lock, AlertCircle, Store, Calendar, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  phoneNumber: z.string()
    .regex(/^[0-9]{9,10}$/, { message: "Phone number must be 9-10 digits." })
    .refine((val) => {
      // Vietnam phone numbers typically start with specific prefixes
      return /^(0[3|5|7|8|9])[0-9]{8}$/.test(val) || /^[3|5|7|8|9][0-9]{8}$/.test(val);
    }, { message: "Invalid Vietnam phone number format." }),
});

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+84");
  const [firstNameTooltipOpen, setFirstNameTooltipOpen] = useState(false);
  const [lastNameTooltipOpen, setLastNameTooltipOpen] = useState(false);
  const [emailTooltipOpen, setEmailTooltipOpen] = useState(false);
  const [phoneNumberTooltipOpen, setPhoneNumberTooltipOpen] = useState(false);
  const [passwordTooltipOpen, setPasswordTooltipOpen] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const searchParams = useSearchParams();

  const [role] = useState<"BUSINESS_OWNER" | "EVENT_CREATOR" | null>(() => {
    const paramRole = searchParams.get("role");
    if (paramRole === "EVENT_CREATOR" || paramRole === "BUSINESS_OWNER") {
      return paramRole;
    }
    return null;
  });

  const title = role === "EVENT_CREATOR" ? "Event Creator" : "Business Owner";
  const article = role === "EVENT_CREATOR" ? "an" : "a";
  const RoleIcon = role === "EVENT_CREATOR" ? Calendar : Store;

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
    },
  });

  const { mutate: signup, isPending } = useSignup();

  // Email validation with debounce
  const emailValue = form.watch("email");
  const [debouncedEmail] = useDebounce(emailValue, 500);
  const { data: emailCheck, isLoading: isCheckingEmail } = useCheckEmailExists(
    debouncedEmail || "",
    !!debouncedEmail && debouncedEmail.includes("@")
  );

  const emailExists = emailCheck?.exists ?? null;
  const isEmailValid = emailExists === false;
  const isEmailInvalid = emailExists === true;

  // Update form validation when email check completes
  useEffect(() => {
    if (emailExists === true && debouncedEmail && form.getValues("email") === debouncedEmail) {
      form.setError("email", {
        type: "manual",
        message: "This email is already registered. Please use a different email or login.",
      });
    } else if (emailExists === false && debouncedEmail && form.getValues("email") === debouncedEmail) {
      form.clearErrors("email");
    }
  }, [emailExists, debouncedEmail, form]);

  const formState = form.formState;
  const errors = formState.errors;

  useEffect(() => {
    if (errors.firstName) {
      const timer = setTimeout(() => setFirstNameTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setFirstNameTooltipOpen(false);
    }
  }, [errors.firstName]);

  useEffect(() => {
    if (errors.lastName) {
      const timer = setTimeout(() => setLastNameTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setLastNameTooltipOpen(false);
    }
  }, [errors.lastName]);

  useEffect(() => {
    if (errors.email) {
      const timer = setTimeout(() => setEmailTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setEmailTooltipOpen(false);
    }
  }, [errors.email]);

  useEffect(() => {
    if (errors.phoneNumber) {
      const timer = setTimeout(() => setPhoneNumberTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setPhoneNumberTooltipOpen(false);
    }
  }, [errors.phoneNumber]);

  useEffect(() => {
    if (errors.password) {
      const timer = setTimeout(() => setPasswordTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setPasswordTooltipOpen(false);
    }
  }, [errors.password]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Check if email exists before submitting
    if (emailExists === true) {
      form.setError("email", {
        type: "manual",
        message: "This email is already registered. Please use a different email or login.",
      });
      return;
    }
    // Prepend country code to phone number
    const phoneWithCode = `${countryCode}${values.phoneNumber}`;
    signup({ ...values, phoneNumber: phoneWithCode, role: role?? "USER" });
  }

  if (isUserLoading || user || !role) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <RoleIcon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Create {article} {title} account</CardTitle>
        <CardDescription>
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="John" 
                          className={`pl-9 ${fieldState.error ? 'pr-9 border-destructive focus-visible:border-destructive' : ''}`}
                          {...field} 
                        />
                        {fieldState.error && (
                          <Tooltip open={firstNameTooltipOpen} onOpenChange={setFirstNameTooltipOpen}>
                            <TooltipTrigger asChild>
                              <div className="absolute right-2.5 top-2.5 cursor-pointer">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800 [&>svg]:!fill-red-100 dark:[&>svg]:!fill-red-950/50 [&>svg]:!bg-red-100 dark:[&>svg]:!bg-red-950/50">
                              <p className="text-xs font-medium">{fieldState.error.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Doe" 
                          className={`pl-9 ${fieldState.error ? 'pr-9 border-destructive focus-visible:border-destructive' : ''}`}
                          {...field} 
                        />
                        {fieldState.error && (
                          <Tooltip open={lastNameTooltipOpen} onOpenChange={setLastNameTooltipOpen}>
                            <TooltipTrigger asChild>
                              <div className="absolute right-2.5 top-2.5 cursor-pointer">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800 [&>svg]:!fill-red-100 dark:[&>svg]:!fill-red-950/50 [&>svg]:!bg-red-100 dark:[&>svg]:!bg-red-950/50">
                              <p className="text-xs font-medium">{fieldState.error.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => {
                const showLoading = isCheckingEmail && debouncedEmail === field.value && field.value.includes("@");
                const showSuccess = isEmailValid && !fieldState.error && debouncedEmail === field.value;
                const showError = (isEmailInvalid || fieldState.error) && debouncedEmail === field.value;

                return (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="m@example.com" 
                          className={`pl-9 ${
                            showError 
                              ? 'pr-9 border-destructive focus-visible:border-destructive' 
                              : showSuccess
                              ? 'pr-9 border-green-500 focus-visible:border-green-500'
                              : showLoading
                              ? 'pr-9'
                              : ''
                          }`}
                          {...field} 
                        />
                        {showLoading && (
                          <div className="absolute right-2.5 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {showSuccess && !showLoading && (
                          <div className="absolute right-2.5 top-2.5">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        {showError && !showLoading && (
                          <Tooltip open={emailTooltipOpen} onOpenChange={setEmailTooltipOpen}>
                            <TooltipTrigger asChild>
                              <div className="absolute right-2.5 top-2.5 cursor-pointer">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800 [&>svg]:!fill-red-100 dark:[&>svg]:!fill-red-950/50 [&>svg]:!bg-red-100 dark:[&>svg]:!bg-red-950/50">
                              <p className="text-xs font-medium">
                                {fieldState.error?.message || "This email is already registered."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[110px] h-9">
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
                          placeholder="912345678" 
                          className={`pl-9 ${fieldState.error ? 'pr-9 border-destructive focus-visible:border-destructive' : ''}`}
                          {...field}
                          onChange={(e) => {
                            // Remove any non-digit characters and limit length
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(value);
                          }}
                        />
                        {fieldState.error && (
                          <Tooltip open={phoneNumberTooltipOpen} onOpenChange={setPhoneNumberTooltipOpen}>
                            <TooltipTrigger asChild>
                              <div className="absolute right-2.5 top-2.5 cursor-pointer">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800 [&>svg]:!fill-red-100 dark:[&>svg]:!fill-red-950/50 [&>svg]:!bg-red-100 dark:[&>svg]:!bg-red-950/50">
                              <p className="text-xs font-medium">{fieldState.error.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className={`pl-9 ${fieldState.error ? 'pr-16 border-destructive focus-visible:border-destructive' : 'pr-9'}`}
                        {...field}
                      />
                      {fieldState.error && (
                        <Tooltip open={passwordTooltipOpen} onOpenChange={setPasswordTooltipOpen}>
                          <TooltipTrigger asChild>
                            <div className="absolute right-9 top-2.5 cursor-pointer">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800 [&>svg]:!fill-red-100 dark:[&>svg]:!fill-red-950/50 [&>svg]:!bg-red-100 dark:[&>svg]:!bg-red-950/50">
                            <p className="text-xs font-medium">{fieldState.error.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create account"
              )}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

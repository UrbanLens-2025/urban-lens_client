"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { verifyOtp, resendOtp } from "@/api/auth";

const otpSchema = z.object({
  otpCode: z.string().regex(/^\d{4}$/, "OTP must be exactly 4 digits"),
});

export default function VerifyOtpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otpCode: "" },
  });

  useEffect(() => {
    const storedEmail = localStorage.getItem("signupEmail");
    const storedCode = localStorage.getItem("confirmCode");

    if (localStorage.getItem("token")) {
      router.replace("/profile");
    } else {
      if (!storedEmail || !storedCode) {
        router.replace("/signup");
      } else {
        setEmail(storedEmail);
        setConfirmCode(storedCode);
        setIsReady(true);
        // Start countdown timer
        setResendCountdown(60);
      }
    }
  }, [router]);

  // Auto-focus input when ready
  useEffect(() => {
    if (isReady && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isReady]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  async function handleResendOtp() {
    if (resendCountdown > 0 || !email || !confirmCode) return;

    try {
      setIsResending(true);
      const res = await resendOtp({ email, confirmCode });

      if (res.success && res.data?.confirmCode) {
        setConfirmCode(res.data.confirmCode);
        localStorage.setItem("confirmCode", res.data.confirmCode);
        setResendCountdown(60);
        toast.success("OTP has been resent to your email");
      } else {
        toast.error(res.message || "Failed to resend OTP");
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  }

  async function onSubmit(values: z.infer<typeof otpSchema>) {
    try {
      setIsLoading(true);
      const res = await verifyOtp({
        email,
        confirmCode,
        otpCode: values.otpCode,
      });

      if (res.success) {
        toast.success("Account verified! You can now log in.");
        localStorage.removeItem("signupEmail");
        localStorage.removeItem("confirmCode");
        router.push("/login");
      } else {
        toast.error(res.message || "Invalid OTP code. Please try again.");
        form.setValue("otpCode", "");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (err) {
      toast.error((err as Error).message || "An error occurred. Please try again.");
      form.setValue("otpCode", "");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handle input change to restrict to numeric and auto-submit
  function handleOtpChange(value: string) {
    // Only allow numeric characters
    const numericValue = value.replace(/\D/g, "");
    form.setValue("otpCode", numericValue, { shouldValidate: true });

    // Auto-submit when 4 digits are entered
    if (numericValue.length === 4 && !isLoading) {
      form.handleSubmit(onSubmit)();
    }
  }

  if (!isReady) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 4-digit verification code to
          </CardDescription>
          {email && (
            <CardDescription className="font-medium text-foreground mt-1">
              {email}
            </CardDescription>
          )}
          <CardDescription className="mt-2">
            Please enter the code below to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="otpCode"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Enter OTP Code</FormLabel>
                  <FormControl>
                    <Input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        placeholder="0000"
                      maxLength={4}
                        className="text-center text-2xl tracking-widest font-mono"
                      {...field}
                        onChange={(e) => {
                          handleOtpChange(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          // Prevent non-numeric keys
                          if (
                            !/[0-9]/.test(e.key) &&
                            !["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight"].includes(e.key)
                          ) {
                            e.preventDefault();
                          }
                        }}
                    />
                  </FormControl>
                  <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the 4-digit code sent to your email
                    </p>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
              ) : (
                  "Verify Code"
                )}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Didn't receive the code?
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0 || isResending || isLoading}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCountdown > 0 ? (
                  `Resend OTP (${resendCountdown}s)`
                ) : (
                  "Resend OTP"
              )}
            </Button>
          </form>
        </Form>
        </CardContent>
      </Card>
    </div>
  );
}

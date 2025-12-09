"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useLogin } from "@/hooks/auth/useLogin";
import { useUser } from "@/hooks/user/useUser";

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
import { Loader2, Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, Info } from "lucide-react";

const formSchema = z.object({
  email: z.email({ message: "Invalid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [emailTooltipOpen, setEmailTooltipOpen] = useState(false);
  const [passwordTooltipOpen, setPasswordTooltipOpen] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const { mutate: login, isPending } = useLogin();

  const formState = form.formState;
  const errors = formState.errors;

  useEffect(() => {
    if (errors.email) {
      const timer = setTimeout(() => setEmailTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setEmailTooltipOpen(false);
    }
  }, [errors.email]);

  useEffect(() => {
    if (errors.password) {
      const timer = setTimeout(() => setPasswordTooltipOpen(true), 200);
      return () => clearTimeout(timer);
    } else {
      setPasswordTooltipOpen(false);
    }
  }, [errors.password]);

  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    login(values);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <LogIn className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <FormLabel className="flex items-center gap-2 text-base font-semibold">
                        <div className="p-1 rounded-md bg-primary/10">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        Email
                      </FormLabel>
                      {fieldState.error && (
                        <Tooltip open={emailTooltipOpen} onOpenChange={setEmailTooltipOpen}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-destructive cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800">
                            <p className="text-xs font-medium">{fieldState.error.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <FormControl>
                      <Input 
                        placeholder="m@example.com" 
                        className={`h-12 border-2 transition-all text-base ${
                          fieldState.error 
                            ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
                            : 'border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
                        }`}
                        {...field} 
                      />
                    </FormControl>
                    {fieldState.error && (
                      <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex items-center gap-2 mb-2">
                      <FormLabel className="flex items-center gap-2 text-base font-semibold">
                        <div className="p-1 rounded-md bg-primary/10">
                          <Lock className="h-4 w-4 text-primary" />
                        </div>
                        Password
                      </FormLabel>
                      {fieldState.error && (
                        <Tooltip open={passwordTooltipOpen} onOpenChange={setPasswordTooltipOpen}>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-destructive cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-red-100 dark:bg-red-950/50 text-gray-900 dark:text-gray-100 border-2 border-red-300 dark:border-red-800">
                            <p className="text-xs font-medium">{fieldState.error.message}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          className={`h-12 border-2 transition-all text-base pr-12 ${
                            fieldState.error 
                              ? 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20' 
                              : 'border-primary/20 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'
                          }`}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {fieldState.error && (
                      <p className="text-sm text-destructive mt-1">{fieldState.error.message}</p>
                    )}
                  </FormItem>
                )}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg transition-all" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <div>
                Sign up as{" "}
                <Link
                  href="/signup?role=BUSINESS_OWNER"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Business Owner
                </Link>
                <span> or </span>
                <Link
                  href="/signup?role=EVENT_CREATOR"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Event Creator
                </Link>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

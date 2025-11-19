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
import { Loader2, Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="m@example.com" 
                          className={`pl-9 ${fieldState.error ? 'pr-9 border-destructive focus-visible:border-destructive' : ''}`}
                          {...field} 
                        />
                        {fieldState.error && (
                          <Tooltip open={emailTooltipOpen} onOpenChange={setEmailTooltipOpen}>
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
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
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

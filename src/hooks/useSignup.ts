"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signup, SignupPayload } from "@/api/auth";

export function useSignup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: SignupPayload) => signup(values),
    
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(data.message || "Signup successful! Please check your email for verification.");
        localStorage.setItem("signupEmail", variables.email);
        localStorage.setItem("confirmCode", data.data.confirmCode);
        router.push("/verify");
      } else {
        toast.error(data.message || "An unexpected error occurred.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Signup failed. Please try again.");
    },
  });
}
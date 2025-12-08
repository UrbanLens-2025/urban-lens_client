"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/api/auth";
import { LoginPayload, User } from "@/types";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: LoginPayload) => login(values),

    onSuccess: (data) => {
      if (data.success) {
        toast.success("Login successful!");

        const user: User = data.data.user;

        queryClient.setQueryData(["user"], user);

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("role", user.role);

        const userRole = user.role;

        // Handle role-based routing
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "BUSINESS_OWNER") {
          // Business owners need onboarding check
          if (!user.hasOnboarded) {
            router.push("/onboarding");
            router.refresh();
            return;
          }
          
          // Handle business owner status-based routing
          if (user.businessProfile?.status === "PENDING") {
            router.push("/onboarding/pending");
          } else if (user.businessProfile?.status === "REJECTED") {
            router.push("/onboarding/rejected");
          } else if (user.businessProfile?.status === "APPROVED") {
            router.push("/dashboard/business");
          } else {
            router.push("/dashboard/business");
          }
        } else if (userRole === "EVENT_CREATOR") {
          // Event creators need onboarding check
          if (!user.hasOnboarded) {
            router.push("/onboarding");
            router.refresh();
            return;
          }
          router.push("/dashboard/creator");
        } else {
          router.push("/");
        }

        router.refresh();
      } else {
        toast.error(data.message || "An unexpected error occurred.");
      }
    },
    onError: (err) => {
      toast.error(
        err.message || "Login failed. Please check your credentials."
      );
    },
  });
}

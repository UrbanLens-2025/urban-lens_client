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

        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "BUSINESS_OWNER") {
          router.push("/dashboard/business"); 
        } else if (userRole === "EVENT_CREATOR") {
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

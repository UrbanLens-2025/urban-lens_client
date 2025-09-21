"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login, LoginPayload } from "@/api/auth";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (values: LoginPayload) => login(values),
    
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Login successful!");
        
        queryClient.invalidateQueries({ queryKey: ["user"] });

        router.push("/");
        router.refresh();
      } else {
        toast.error(data.message || "An unexpected error occurred.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Please check your credentials.");
    },
  });
}
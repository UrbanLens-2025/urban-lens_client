"use client";

import { changePassword, ChangePasswordPayload } from "@/api/user";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    
    onSuccess: () => {
      toast.success("Password changed successfully!");
    },

    onError: (error) => {
      console.error("Failed to change password:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    },
  });
}
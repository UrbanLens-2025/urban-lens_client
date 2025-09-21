"use client";

import { updateProfile, UpdateProfilePayload } from "@/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileData: UpdateProfilePayload) => updateProfile(profileData),
    
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ["user"] });


      toast.success("Profile updated successfully!");
    },

    onError: (error) => {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile. Please try again.");
    },
  });
}
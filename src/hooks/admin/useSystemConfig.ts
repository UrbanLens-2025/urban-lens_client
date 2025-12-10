"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemConfigValues, updateSystemConfigValue, type UpdateSystemConfigValuePayload } from "@/api/admin";
import { toast } from "sonner";

export function useSystemConfigValues() {
  return useQuery({
    queryKey: ["adminSystemConfigValues"],
    queryFn: () => getSystemConfigValues(),
    placeholderData: (previousData) => previousData,
  });
}

export function useUpdateSystemConfigValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: UpdateSystemConfigValuePayload }) =>
      updateSystemConfigValue(key, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSystemConfigValues"] });
      toast.success("System configuration value updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update system configuration value");
    },
  });
}


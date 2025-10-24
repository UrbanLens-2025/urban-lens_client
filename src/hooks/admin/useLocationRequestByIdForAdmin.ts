"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationRequestByIdForAdmin } from "@/api/admin";

export function useLocationRequestByIdForAdmin(id: string | null) {
  return useQuery({
    queryKey: ["locationAdminRequest", id],
    queryFn: () => getLocationRequestByIdForAdmin(id!),
    enabled: !!id,
  });
}

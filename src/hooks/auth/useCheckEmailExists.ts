"use client";

import { useQuery } from "@tanstack/react-query";
import { checkEmailExists } from "@/api/auth";

export function useCheckEmailExists(email: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["checkEmailExists", email],
    queryFn: () => checkEmailExists(email),
    enabled: enabled && !!email && email.includes("@"),
    retry: false,
  });
}


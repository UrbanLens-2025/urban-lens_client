"use client";

import { getUser } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60,
  });
}

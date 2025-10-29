"use client";

import { getWards } from "@/api/addresses";
import { useQuery } from "@tanstack/react-query";
import type { GetWardsParams } from "@/types";

export function useWards(params?: GetWardsParams) {
  return useQuery({
    queryKey: ["wards", params],
    queryFn: () => getWards(params || {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


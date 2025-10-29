"use client";

import { getProvinces } from "@/api/addresses";
import { useQuery } from "@tanstack/react-query";
import type { GetProvincesParams } from "@/types";

export function useProvinces(params?: GetProvincesParams) {
  return useQuery({
    queryKey: ["provinces", params],
    queryFn: () => getProvinces(params || {}),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


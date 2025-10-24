"use client";

import { useQuery } from "@tanstack/react-query";
import { getBusinessAccounts } from "@/api/admin";
import { GetBusinessesParams } from "@/types";

export function useBusinessAccounts(params: GetBusinessesParams) {
  return useQuery({
    queryKey: ['businessAccounts', params],
    queryFn: () => getBusinessAccounts(params),
    placeholderData: (previousData) => previousData,
  });
}
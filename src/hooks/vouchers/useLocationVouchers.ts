"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationVouchers } from "@/api/vouchers";
import { GetLocationVouchersParams } from "@/types";

export function useLocationVouchers(params: GetLocationVouchersParams) {
  return useQuery({
    queryKey: ["locationVouchers", params],
    queryFn: () => getLocationVouchers(params),
    placeholderData: (previousData) => previousData,
  });
}

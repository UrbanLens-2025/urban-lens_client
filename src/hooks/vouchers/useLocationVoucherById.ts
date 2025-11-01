"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationVoucherById } from "@/api/vouchers";

export function useLocationVoucherById(voucherId: string | null) {
  return useQuery({
    queryKey: ['locationVoucher', voucherId],
    queryFn: () => getLocationVoucherById(voucherId!),
    enabled: !!voucherId,
  });
}
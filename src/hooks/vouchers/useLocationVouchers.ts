'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getLocationVoucherExchangeHistory,
  getLocationVouchers,
} from '@/api/vouchers';
import { GetLocationVouchersParams } from '@/types';

export function useLocationVouchers(params: GetLocationVouchersParams) {
  return useQuery({
    queryKey: ['locationVouchers', params],
    queryFn: () => getLocationVouchers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useLocationVoucherExchangeHistory(params: any) {
  return useQuery({
    queryKey: ['locationVoucherExchangeHistory', params],
    queryFn: () => getLocationVoucherExchangeHistory(params),
    placeholderData: (previousData) => previousData,
  });
}

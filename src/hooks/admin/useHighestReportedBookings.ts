'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getHighestReportedBookings,
  HighestReportedBookingsResponse,
} from '@/api/reports';

export function useHighestReportedBookings(
  page: number = 1,
  limit: number = 10
) {
  return useQuery<HighestReportedBookingsResponse>({
    queryKey: ['highestReportedBookings', page, limit],
    queryFn: () => getHighestReportedBookings(page, limit),
    placeholderData: (previousData) => previousData,
  });
}


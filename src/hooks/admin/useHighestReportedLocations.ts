'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getHighestReportedLocations,
  HighestReportedLocationsResponse,
} from '@/api/reports';

export function useHighestReportedLocations(
  page: number = 1,
  limit: number = 10
) {
  return useQuery<HighestReportedLocationsResponse>({
    queryKey: ['highestReportedLocations', page, limit],
    queryFn: () => getHighestReportedLocations(page, limit),
    placeholderData: (previousData) => previousData,
  });
}


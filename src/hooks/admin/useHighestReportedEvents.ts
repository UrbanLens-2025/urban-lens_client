'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getHighestReportedEvents,
  HighestReportedEventsResponse,
} from '@/api/reports';

export function useHighestReportedEvents(
  page: number = 1,
  limit: number = 10
) {
  return useQuery<HighestReportedEventsResponse>({
    queryKey: ['highestReportedEvents', page, limit],
    queryFn: () => getHighestReportedEvents(page, limit),
    placeholderData: (previousData) => previousData,
  });
}


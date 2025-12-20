'use client';

import { useQuery } from '@tanstack/react-query';
import { getReportAnalytics } from '@/api/reports';

export function useReportAnalytics() {
  return useQuery({
    queryKey: ['reportAnalytics'],
    queryFn: () => getReportAnalytics(),
    placeholderData: (previousData) => previousData,
  });
}


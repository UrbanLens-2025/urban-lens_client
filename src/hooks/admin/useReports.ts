'use client';

import { useQuery } from '@tanstack/react-query';
import { getReports } from '@/api/reports';
import { GetReportsParams } from '@/types';

export function useReports(params: GetReportsParams) {
  return useQuery({
    queryKey: ['adminReports', params],
    queryFn: () => getReports(params),
    placeholderData: (previousData) => previousData,
  });
}

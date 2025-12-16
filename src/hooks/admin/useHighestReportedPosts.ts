'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getHighestReportedPosts,
  HighestReportedPostsResponse,
} from '@/api/reports';

export function useHighestReportedPosts(page: number = 1, limit: number = 10) {
  return useQuery<HighestReportedPostsResponse>({
    queryKey: ['highestReportedPosts', page, limit],
    queryFn: () => getHighestReportedPosts(page, limit),
    placeholderData: (previousData) => previousData,
  });
}


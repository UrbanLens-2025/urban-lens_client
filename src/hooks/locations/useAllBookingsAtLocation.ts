'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAllBookingsAtLocation,
  GetAllBookingsAtLocationParams,
} from '@/api/locations';

export function useAllBookingsAtLocation(
  params: GetAllBookingsAtLocationParams
) {
  return useQuery({
    queryKey: ['allBookingsAtLocation', params],
    queryFn: () => getAllBookingsAtLocation(params),
    enabled: !!params.locationId && !!params.startDate && !!params.endDate,
    placeholderData: (previousData) => previousData,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { getLocationBookingById } from '@/api/locations';

export function useLocationBookingById(locationBookingId: string | null) {
  return useQuery({
    queryKey: ['locationBookingDetail', locationBookingId],
    queryFn: () => getLocationBookingById(locationBookingId!),
    enabled: !!locationBookingId,
  });
}

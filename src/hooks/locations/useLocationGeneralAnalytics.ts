import { useQuery } from '@tanstack/react-query';
import { getGeneralAnalyticsForLocation } from '@/api/locations';

export const useLocationGeneralAnalytics = (locationId: string) => {
  return useQuery({
    queryKey: ['locationGeneralAnalytics', locationId],
    queryFn: () => getGeneralAnalyticsForLocation(locationId),
    enabled: !!locationId,
    placeholderData: (previousData) => previousData,
  });
};
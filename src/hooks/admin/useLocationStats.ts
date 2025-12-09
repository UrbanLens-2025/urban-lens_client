"use client";

import { useQueries } from "@tanstack/react-query";
import { getAllLocationsForAdmin } from "@/api/admin";
import type { Location } from "@/types";

/**
 * Hook to fetch accurate location statistics
 * Fetches a larger sample to calculate accurate stats since API filters may not work
 */
export function useLocationStats() {
  // Fetch a larger sample (1000 items) to calculate accurate stats
  // This is a workaround if the API doesn't support filtering by businessId
  const sampleQuery = useQueries({
    queries: [
      {
        queryKey: ["locationStats", "sample"],
        queryFn: () => getAllLocationsForAdmin({ page: 1, limit: 1000 }),
        select: (data) => ({
          total: data.meta.totalItems,
          sample: data.data,
        }),
      },
      {
        queryKey: ["locationStats", "visible"],
        queryFn: () => getAllLocationsForAdmin({ page: 1, limit: 1, isVisibleOnMap: true }),
        select: (data) => data.meta.totalItems,
      },
    ],
  });

  const [sampleQueryResult, visibleQuery] = sampleQuery;
  const sampleData = sampleQueryResult.data;

  // Calculate stats from sample data
  const stats = {
    total: sampleData?.total ?? 0,
    business: sampleData?.sample?.filter((loc: Location) => loc.business !== null && loc.businessId !== null).length ?? 0,
    public: sampleData?.sample?.filter((loc: Location) => loc.business === null || loc.businessId === null).length ?? 0,
    visible: visibleQuery.data ?? 0,
    isLoading: sampleQueryResult.isLoading || visibleQuery.isLoading,
    isError: sampleQueryResult.isError || visibleQuery.isError,
  };

  // If we have a full sample (all locations fit in 1000), use calculated stats
  // Otherwise, estimate based on sample ratio
  if (sampleData && sampleData.sample.length > 0 && sampleData.total <= 1000) {
    // We have all the data, use accurate counts
    return stats;
  } else if (sampleData && sampleData.sample.length > 0) {
    // Estimate based on sample ratio
    const businessRatio = stats.business / sampleData.sample.length;
    const publicRatio = stats.public / sampleData.sample.length;
    
    return {
      total: stats.total,
      business: Math.round(stats.total * businessRatio),
      public: Math.round(stats.total * publicRatio),
      visible: stats.visible,
      isLoading: stats.isLoading,
      isError: stats.isError,
    };
  }

  return stats;
}


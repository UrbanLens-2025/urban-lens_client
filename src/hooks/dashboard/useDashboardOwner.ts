import { useQuery } from '@tanstack/react-query';
import {
  getRevenueSummary,
  getTopRevenueLocations,
  getOwnerDashboardStats,
  RevenueAnalyticsFilter,
} from '@/api/dashboardOwner';

// Hook: Revenue Summary
export const useRevenueSummary = () => {
  return useQuery({
    queryKey: ['ownerRevenueSummary'],
    queryFn: () => getRevenueSummary(),
    placeholderData: (previousData) => previousData,
  });
};

// Hook: Top Locations Chart
export const useTopRevenueLocations = (filter: RevenueAnalyticsFilter) => {
  return useQuery({
    queryKey: ['ownerTopRevenueLocations', filter],
    queryFn: () => getTopRevenueLocations(filter),
    placeholderData: (previousData) => previousData,
  });
};

// Hook: General Stats
export const useOwnerDashboardStats = () => {
  return useQuery({
    queryKey: ['ownerDashboardStats'],
    queryFn: () => getOwnerDashboardStats(),
    placeholderData: (previousData) => previousData,
  });
};
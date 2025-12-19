import { useQuery } from '@tanstack/react-query';
import {
  getRevenueSummary,
  getTopRevenueLocations,
  RevenueAnalyticsFilter,
} from '@/api/dashboardCreator';
import { getCreatorDashboardStats } from '@/api/dashboardCreator';

export const useRevenueSummary = () => {
  return useQuery({
    queryKey: ['creatorRevenueSummary'],
    queryFn: () => getRevenueSummary(),
    placeholderData: (previousData) => previousData,
  });
};

export const useTopRevenueLocations = (filter: RevenueAnalyticsFilter) => {
  return useQuery({
    queryKey: ['creatorTopRevenueLocations', filter],
    queryFn: () => getTopRevenueLocations(filter),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreatorDashboardStats = () => {
  return useQuery({
    queryKey: ['creatorDashboardStats'],
    queryFn: () => getCreatorDashboardStats(),
    placeholderData: (previousData) => previousData,
  });
};
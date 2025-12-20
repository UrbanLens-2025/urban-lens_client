import { useQuery } from '@tanstack/react-query';
import {
  getRevenueSummary,
  getCreatorDashboardStats,
  getTopRevenueEvents,
} from '@/api/dashboardCreator';

export const useRevenueSummary = () => {
  return useQuery({
    queryKey: ['creatorRevenueSummary'],
    queryFn: () => getRevenueSummary(),
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

export const useTopRevenueEvents = (limit: number = 5) => {
  return useQuery({
    queryKey: ['creatorTopRevenueEvents', limit],
    queryFn: () => getTopRevenueEvents(limit),
    placeholderData: (previousData) => previousData,
  });
};
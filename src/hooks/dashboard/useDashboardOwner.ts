import { useQuery } from '@tanstack/react-query';
import {
  getRevenueSummary,
  getTopLocationsByRevenue,
  getOwnerDashboardStats,
} from '@/api/dashboardOwner';

export const useRevenueSummary = () => {
  return useQuery({
    queryKey: ['ownerRevenueSummary'],
    queryFn: () => getRevenueSummary(),
    placeholderData: (previousData) => previousData,
  });
};

export const useTopLocationsByRevenue = (limit: number = 5) => {
  return useQuery({
    queryKey: ['ownerTopLocationsByRevenue', limit],
    queryFn: () => getTopLocationsByRevenue(limit),
    placeholderData: (previousData) => previousData,
  });
};

export const useOwnerDashboardStats = () => {
  return useQuery({
    queryKey: ['ownerDashboardStats'],
    queryFn: () => getOwnerDashboardStats(),
    placeholderData: (previousData) => previousData,
  });
};
import { useQuery } from '@tanstack/react-query';
import {
  getDashboardAdmin,
  GetDashboardAdminParams,
  getUserAnalytics,
  UserAnalyticsFilter,
  getWalletAnalytics,
} from '@/api/dashboardAdmin';

export const useDashboardAdmin = (params?: GetDashboardAdminParams) => {
  return useQuery({
    queryKey: ['dashboardAdmin', params],
    queryFn: () => getDashboardAdmin(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useUserAnalytics = (filter: UserAnalyticsFilter) => {
  return useQuery({
    queryKey: ['userAnalytics', filter],
    queryFn: () => getUserAnalytics(filter),
    placeholderData: (previousData) => previousData,
  });
};

export const useWalletAnalytics = (filter: UserAnalyticsFilter) => {
  return useQuery({
    queryKey: ['walletAnalytics', filter],
    queryFn: () => getWalletAnalytics(filter),
    placeholderData: (previousData) => previousData,
  });
};

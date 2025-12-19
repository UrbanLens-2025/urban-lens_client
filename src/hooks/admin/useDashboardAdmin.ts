import { useQuery } from '@tanstack/react-query';
import {
  getDashboardAdmin,
  GetDashboardAdminParams,
  getUserAnalytics,
  UserAnalyticsFilter,
  getWalletAnalytics,
  getEventsLocationsTotals,
  getAllReports,
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

export const useEventsLocationsTotals = (filter: UserAnalyticsFilter) => {
  return useQuery({
    queryKey: ['eventsLocationsTotals', filter],
    queryFn: () => getEventsLocationsTotals(filter),
    placeholderData: (previousData) => previousData,
  });
};

export const useAllReports = () => {
  return useQuery({
    queryKey: ['admin-all-reports'],
    queryFn: () => getAllReports(),
    placeholderData: (previousData) => previousData,
  });
};

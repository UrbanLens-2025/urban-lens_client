import { useQuery } from '@tanstack/react-query';
import {
  getDashboardAdmin,
  GetDashboardAdminParams,
  getUserAnalytics,
  UserAnalyticsFilter,
  getWalletAnalytics,
  getEventsLocationsTotals,
  getAllReports,
  GetAllReportsParams,
  getAnnouncementsByLocationId,
  getLocationBookingDetail,
  getReviewsByLocationId,
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

export const useAllReports = (params?: GetAllReportsParams) => {
  return useQuery({
    queryKey: ['admin-all-reports', params],
    queryFn: () => getAllReports(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useAnnouncementsByLocationId = (locationId: string) => {
  return useQuery({
    queryKey: ['admin-announcements-by-location', locationId],
    queryFn: () => getAnnouncementsByLocationId(locationId),
    placeholderData: (previousData) => previousData,
    enabled: Boolean(locationId),
  });
};

export const useLocationBookingDetail = (bookingId: string) => {
  return useQuery({
    queryKey: ['admin-location-booking-detail', bookingId],
    queryFn: () => getLocationBookingDetail(bookingId),
    placeholderData: (previousData) => previousData,
    enabled: Boolean(bookingId),
  });
};

export const useReviewsByLocationId = (locationId: string) => {
  return useQuery({
    queryKey: ['admin-reviews-by-location', locationId],
    queryFn: () => getReviewsByLocationId(locationId),
    placeholderData: (previousData) => previousData,
    enabled: Boolean(locationId),
  });
};

import axiosInstance from './axios-config';

export interface RevenueSummaryData {
  totalRevenue: number;
  available: number;
  pending: number;
  pendingWithdraw: number;
  totalBalance: number;
}

export type RevenueAnalyticsFilter = 'day' | 'month' | 'year';

export interface RevenueLocationItem {
  locationId: string;
  name: string;
  revenue: number;
}

export const getRevenueSummary = async () => {
  const url = '/v1/creator/dashboard/revenue/summary';
  const response = await axiosInstance.get(url);
  return response.data.data;
};

export const getTopRevenueLocations = async (
  filter: RevenueAnalyticsFilter
): Promise<RevenueLocationItem[]> => {
  const response = await axiosInstance.get(
    `/v1/creator/dashboard/revenue/top-locations?filter=${filter}`
  );
  return response.data.data || [];
};

export interface CreatorDashboardStats {
  totalLocations: number;
  approvedLocations: number;
  totalBookings: number;
  totalReviews: number;
  totalCheckIns: number;
}

export const getCreatorDashboardStats = async () => {
  const url = '/v1/creator/dashboard/stats';
  const response = await axiosInstance.get(url);
  return response.data.data;
};
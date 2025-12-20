import { TopRevenueLocation } from '@/types';
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
  const url = '/v1/owner/dashboard/revenue/summary';
  const response = await axiosInstance.get(url);
  return response.data.data;
};

export const getTopLocationsByRevenue = async (limit: number = 5): Promise<TopRevenueLocation[]> => {
  const response = await axiosInstance.get(
    `/v1/owner/dashboard/locations/top-revenue?limit=${limit}`
  );
  return response.data.data || [];
};

export interface OwnerDashboardStats {
  totalLocations: number;
  approvedLocations: number;
  totalBookings: number;
  totalReviews: number;
  totalCheckIns: number;
}

export const getOwnerDashboardStats = async () => {
  const url = '/v1/owner/dashboard/stats';
  const response = await axiosInstance.get(url);
  return response.data.data;
};
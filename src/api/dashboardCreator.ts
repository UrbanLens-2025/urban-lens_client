import { TopRevenueEvent } from '@/types';
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

export const getTopRevenueEvents = async (limit: number = 5): Promise<TopRevenueEvent[]> => {
  const response = await axiosInstance.get(
    `/v1/creator/dashboard/events/top-revenue?limit=${limit}`
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
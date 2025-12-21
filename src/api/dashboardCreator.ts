import { TopRevenueEvent } from '@/types';
import axiosInstance from './axios-config';

// 1. Define the RAW response shape from the API (matches your curl output)
interface RevenueSummaryApiResponse {
  totalDeposits: number;
  totalEarnings: number;
  totalWithdrawals: number;
  totalPendingRevenue: number;
  totalRevenue: number;
  availableBalance: string; // API returns string "65640000.00"
  pendingRevenue: number;
  pendingWithdraw: string;  // API returns string "0.00"
}

// 2. Define the CLEAN interface for your UI (matches what your components expect)
export interface RevenueSummaryData {
  totalRevenue: number;
  available: number;        // Transformed from availableBalance
  pending: number;          // Transformed from pendingRevenue
  pendingWithdraw: number;  // Transformed from pendingWithdraw string
  totalBalance: number;     // Transformed from availableBalance
  
  // Optional: Add these if you want to use them in the UI later
  totalDeposits: number;
  totalEarnings: number;
  totalWithdrawals: number;
}

export type RevenueAnalyticsFilter = 'day' | 'month' | 'year';

export interface RevenueLocationItem {
  locationId: string;
  name: string;
  revenue: number;
}

// 3. Updated API call with transformation logic
export const getRevenueSummary = async (): Promise<RevenueSummaryData> => {
  const url = '/v1/creator/dashboard/revenue/summary';
  const { data } = await axiosInstance.get<{ data: RevenueSummaryApiResponse }>(url);
  const rawData = data.data;

  // Map API fields to UI fields and parse strings to numbers
  return {
    totalRevenue: rawData.totalRevenue,
    available: parseFloat(rawData.availableBalance), // "65640000.00" -> 65640000
    pending: rawData.pendingRevenue,
    pendingWithdraw: parseFloat(rawData.pendingWithdraw), // "0.00" -> 0
    totalBalance: parseFloat(rawData.availableBalance),
    
    // Extra fields
    totalDeposits: rawData.totalDeposits,
    totalEarnings: rawData.totalEarnings,
    totalWithdrawals: rawData.totalWithdrawals,
  };
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
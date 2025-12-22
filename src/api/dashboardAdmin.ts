import axiosInstance from './axios-config';
import type { Announcement, ApiResponse } from '@/types';

export interface GetDashboardAdminParams {
  startDate?: string;
  endDate?: string;
}

export const getDashboardAdmin = async (params?: GetDashboardAdminParams) => {
  const queryParams = new URLSearchParams();

  if (params?.startDate) {
    queryParams.append('startDate', params.startDate);
  }

  if (params?.endDate) {
    queryParams.append('endDate', params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/v1/admin/dashboard/summary${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await axiosInstance.get(url);
  return response.data;
};

export type UserAnalyticsFilter = 'day' | 'month' | 'year';

export interface UserAnalyticsItem {
  day?: string;
  month?: string;
  year?: string;
  count: number;
}

export const getUserAnalytics = async (
  filter: UserAnalyticsFilter
): Promise<UserAnalyticsItem[]> => {
  const response = await axiosInstance.get(
    `/v1/admin/dashboard/analytics/users?filter=${filter}`
  );
  return response.data.data || [];
};

export interface WalletAnalyticsItem {
  day?: string;
  month?: string;
  year?: string;
  deposit: number;
  withdraw: number;
}

export const getWalletAnalytics = async (
  filter: UserAnalyticsFilter
): Promise<WalletAnalyticsItem[]> => {
  const response = await axiosInstance.get(
    `/v1/admin/dashboard/analytics?filter=${filter}`
  );
  return response.data.data || [];
};

export interface EventsLocationsTotalsItem {
  day?: string;
  month?: string;
  year?: string;
  events: number;
  locations: number;
}

export const getEventsLocationsTotals = async (
  filter: UserAnalyticsFilter
): Promise<EventsLocationsTotalsItem[]> => {
  const response = await axiosInstance.get(
    `/v1/admin/dashboard/totals/events-locations?filter=${filter}`
  );
  return response.data.data || [];
};

export interface GetAllReportsParams {
  status?: string;
}

export const getAllReports = async (params?: GetAllReportsParams) => {
  const queryParams: Record<string, string> = {};

  if (params?.status) {
    queryParams['filter.status'] = `$eq:${params.status}`;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  const url = `/v1/admin/report${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get(url);
  return response.data.data || { data: [], meta: {}, links: {} };
};

export const getAnnouncementsByLocationId = async (
  locationId: string
): Promise<Announcement[]> => {
  const response = await axiosInstance.get<ApiResponse<Announcement[]>>(
    `/v1/admin/announcements?filter.locationId=$eq:${locationId}`
  );
  return response.data.data || [];
};

export const getReviewsByLocationId = async (locationId: string) => {
  const response = await axiosInstance.get(
    `/v1/post/location/${locationId}?page=1&limit=100`
  );
  return response.data.data || { data: [], meta: {} };
};

export const getLocationBookingDetail = async (bookingId: string) => {
  const response = await axiosInstance.get(
    `/v1/admin/location-bookings/${bookingId}`
  );
  return response.data.data;
};

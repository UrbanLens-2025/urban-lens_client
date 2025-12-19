import axiosInstance from './axios-config';

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

export const getAllReports = async () => {
  const response = await axiosInstance.get('/v1/admin/report');
  // Response structure: { success, message, statusCode, data: { data: [...], meta: {...}, links: {...} } }
  // Return the entire data object which contains data array, meta, and links
  return response.data.data || { data: [], meta: {}, links: {} };
};

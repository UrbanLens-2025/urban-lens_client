/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from './axios-config';
import type {
  ApiResponse,
  PaginatedData,
  Report,
  GetReportsParams,
  ProcessReportPayload,
} from '@/types';

// Mark reports as first seen
export const markReportsFirstSeen = async (reportIds: string[]): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>("/v1/admin/report/first-seen", {
    reportIds,
  });
};

// Process reports with no action taken
export const processReportsNoAction = async (params: {
  reportIds: string[];
  reason: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/report/process/no-action-taken",
    params
  );
};

// Process reports as malicious
export const processReportsMalicious = async (params: {
  reportIds: string[];
  reason: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/report/process/malicious-report",
    params
  );
};

export const processReportsTicketRefund = async (params: {
  reportIds: string[];
  reason: string;
  refundPercentage: number;
  shouldCancelTickets: boolean;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/report/process/ticket-refund",
    params
  );
};

export const processReportsIssueApology = async (params: {
  reportIds: string[];
  reason: string;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/report/process/issue-apology",
    params
  );
};

export const processReportBookingRefund = async (params: {
  reportId: string;
  reason: string;
  refundPercentage: number;
  shouldCancelBooking: boolean;
}): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>(
    "/v1/admin/report/process/booking-refund",
    params
  );
};

// Get all reports for admin
export const getReports = async (
  params: GetReportsParams
): Promise<PaginatedData<Report>> => {
  const queryParams: any = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? 'createdAt:DESC',
  };

  if (params.search) {
    queryParams.search = params.search;
    queryParams.searchBy = ['title', 'description'];
  }

  if (params.status) {
    queryParams['filter.status'] = `$eq:${params.status}`;
  }

  // According to Swagger docs: targetType and targetid are query parameters
  // filter.targetType and filter.targetid are filter parameters
  // We'll use filter parameters for flexibility
  if (params.targetType) {
    queryParams['filter.targetType'] = `$eq:${params.targetType}`;
  }

  if (params.targetId) {
    // API uses lowercase 'targetid' in filter
    queryParams['filter.targetid'] = `$eq:${params.targetId}`;
  }

  if (params.denormSecondaryTargetId) {
    queryParams['filter.denormSecondaryTargetId'] = `$eq:${params.denormSecondaryTargetId}`;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Report>>>(
    '/v1/admin/report',
    { params: queryParams }
  );

  return data.data;
};

// Get report by ID
export const getReportById = async (reportId: string): Promise<Report> => {
  const { data } = await axiosInstance.get<ApiResponse<Report>>(
    `/v1/admin/report/${reportId}`
  );
  return data.data;
};

// Process/Update report status
export const processReport = async (
  reportId: string,
  payload: ProcessReportPayload
): Promise<Report> => {
  const { data } = await axiosInstance.post<ApiResponse<Report>>(
    `/v1/admin/report/${reportId}/process`,
    payload
  );
  return data.data;
};

// Delete report
export const deleteReport = async (reportId: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(`/v1/admin/report/${reportId}`);
};

// Get highest reported posts
export interface HighestReportedPost {
  postId: string;
  content: string;
  imageUrls: string[];
  type: string;
  isVerified: boolean;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  rating: number | null;
  eventId: string | null;
  reports: Report[];
}

export interface HighestReportedPostsResponse {
  data: HighestReportedPost[];
  count: number;
  page: number;
  limit: number;
}

export const getHighestReportedPosts = async (
  page: number = 1,
  limit: number = 10
): Promise<HighestReportedPostsResponse> => {
  const { data } = await axiosInstance.get<
    ApiResponse<HighestReportedPostsResponse>
  >('/v1/admin/report/highest-reported-posts', {
    params: { page, limit },
  });
  return data.data;
};

// Get highest reported locations
export interface HighestReportedLocation {
  id: string;
  type: string;
  ownershipType: string;
  name: string;
  description: string | null;
  latitude: string;
  longitude: string;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  radiusMeters: number;
  imageUrl: string[];
  createdAt: string;
  updatedAt: string;
  isVisibleOnMap: boolean;
  businessId: string;
  averageRating: number;
  totalReviews: number;
  totalCheckIns: number;
  reports: Report[];
}

export interface HighestReportedLocationsResponse {
  data: HighestReportedLocation[];
  count: number;
  page: number;
  limit: number;
}

export const getHighestReportedLocations = async (
  page: number = 1,
  limit: number = 10
): Promise<HighestReportedLocationsResponse> => {
  const { data } = await axiosInstance.get<
    ApiResponse<HighestReportedLocationsResponse>
  >('/v1/admin/report/highest-reported-locations', {
    params: { page, limit },
  });
  return data.data;
};

// Get highest reported events
export interface HighestReportedEvent {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  status: string;
  expectedNumberOfParticipants: number;
  allowTickets: boolean;
  startDate: string;
  endDate: string;
  cancellationReason: string | null;
  locationId: string;
  social: Array<{
    platform: string;
    url: string;
    isMain: boolean;
  }>;
  eventValidationDocuments: Array<{
    documentType: string;
    documentImageUrls: string[];
  }>;
  refundPolicy: string | null;
  termsAndConditions: string | null;
  hasPaidOut: boolean;
  paidOutAt: string | null;
  scheduledJobId: string | null;
  totalReviews: number;
  avgRating: number;
  reports: Report[];
}

export interface HighestReportedEventsResponse {
  data: HighestReportedEvent[];
  count: number;
  page: number;
  limit: number;
}

export const getHighestReportedEvents = async (
  page: number = 1,
  limit: number = 10
): Promise<HighestReportedEventsResponse> => {
  const { data } = await axiosInstance.get<
    ApiResponse<HighestReportedEventsResponse>
  >('/v1/admin/report/highest-reported-events', {
    params: { page, limit },
  });
  return data.data;
};

// Get report analytics
export interface ReportAnalytics {
  totalReports: number;
  countPending: number;
  countClosed: number;
  countTotalLocationReports: number;
  countTotalEventReports: number;
  countTotalPostReports: number;
  countTotalBookingReports: number;
}

export const getReportAnalytics = async (): Promise<ReportAnalytics> => {
  const { data } = await axiosInstance.get<ApiResponse<ReportAnalytics>>(
    '/v1/admin/report/analytics/general'
  );
  return data.data;
};

// Get report reasons (public endpoint)
export interface ReportReason {
  key: string;
  displayName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  forEvent: boolean;
  forLocation: boolean;
  forPost: boolean;
  priority: number;
}

export interface ReportReasonsResponse {
  data: ReportReason[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    sortBy: Array<[string, string]>;
  };
  links: {
    current: string;
  };
}

export const getReportReasons = async (): Promise<ReportReason[]> => {
  const { data } = await axiosInstance.get<ApiResponse<ReportReasonsResponse>>(
    '/v1/public/report-reason',
    {
      params: {
        page: 1,
        limit: 100,
        sortBy: 'displayName:ASC',
      },
    }
  );
  return data.data.data;
};

// Report a booking
export interface ReportBookingPayload {
  bookingId: string;
  reportedReason: string;
  title: string;
  description: string;
  attachedImageUrls?: string[];
}

export const reportBooking = async (
  payload: ReportBookingPayload
): Promise<void> => {
  await axiosInstance.post<ApiResponse<void>>('/v1/private/report/booking', payload);
};

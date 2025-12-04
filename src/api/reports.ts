/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type {
  ApiResponse,
  PaginatedData,
  Report,
  GetReportsParams,
  ProcessReportPayload,
} from "@/types";

// Get all reports for admin
export const getReports = async (
  params: GetReportsParams
): Promise<PaginatedData<Report>> => {
  const queryParams: any = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt:DESC",
  };

  if (params.search) {
    queryParams.search = params.search;
    queryParams.searchBy = ["title", "description"];
  }

  if (params.status) {
    queryParams["filter.status"] = `$eq:${params.status}`;
  }

  if (params.targetType) {
    queryParams["filter.targetType"] = `$eq:${params.targetType}`;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Report>>>(
    "/v1/admin/report",
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



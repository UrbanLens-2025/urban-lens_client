import axiosInstance from "./axios-config";
import type {
  Announcement,
  ApiResponse,
  CreateAnnouncementPayload,
  GetAnnouncementsParams,
  PaginatedData,
  UpdateAnnouncementPayload,
} from "@/types";

export const getAnnouncements = async (
  params: GetAnnouncementsParams
): Promise<PaginatedData<Announcement>> => {
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt:DESC",
    locationId: params.locationId,
  };

  if (params.search) {
    queryParams.search = params.search;
    queryParams.searchBy = ["title", "description"];
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Announcement>>>(
    "/v1/owner/announcements",
    { params: queryParams }
  );

  return data.data;
};

export const getAnnouncementById = async (announcementId: string): Promise<Announcement> => {
  const { data } = await axiosInstance.get<ApiResponse<Announcement>>(
    `/v1/owner/announcements/${announcementId}`
  );

  return data.data;
};

export const createAnnouncement = async (
  payload: CreateAnnouncementPayload
): Promise<Announcement> => {
  const { data } = await axiosInstance.post<ApiResponse<Announcement>>(
    "/v1/owner/announcements",
    payload
  );

  return data.data;
};

export const updateAnnouncement = async (
  announcementId: string,
  payload: UpdateAnnouncementPayload
): Promise<Announcement> => {
  const { data } = await axiosInstance.put<ApiResponse<Announcement>>(
    `/v1/owner/announcements/${announcementId}`,
    payload
  );

  return data.data;
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
  await axiosInstance.delete<ApiResponse<void>>(`/v1/owner/announcements/${announcementId}`);
};

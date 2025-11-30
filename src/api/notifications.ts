import axiosInstance from "./axios-config";
import type {
  ApiResponse,
  PaginatedData,
  RegisterDevicePayload,
  RegisteredDevice,
  GetNotificationsParams,
  Notification,
  MarkNotificationsSeenPayload,
  MarkNotificationSeenResponse,
} from "@/types";

// Device Registration (works for both Business Owner and Event Creator)
export const registerDevice = async (
  payload: RegisterDevicePayload
): Promise<RegisteredDevice> => {
  const { data } = await axiosInstance.post<ApiResponse<RegisteredDevice>>(
    "/v1/private/notifications/register-device",
    payload
  );
  return data.data;
};

// Get Notifications (works for both Business Owner and Event Creator)
export const getNotifications = async (
  params: GetNotificationsParams
): Promise<PaginatedData<Notification>> => {
  const queryParams: Record<string, unknown> = {
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt:DESC",
  };

  // API might expect filter.status instead of status
  if (params.status !== undefined) {
    queryParams["filter.status"] = params.status;
  }

  const { data } = await axiosInstance.get<ApiResponse<PaginatedData<Notification>>>(
    "/v1/private/notifications",
    { params: queryParams }
  );

  return data.data;
};

// Mark Notifications as Seen (works for both Business Owner and Event Creator)
export const markNotificationsAsSeen = async (
  payload: MarkNotificationsSeenPayload
): Promise<MarkNotificationSeenResponse> => {
  const { data } = await axiosInstance.put<ApiResponse<MarkNotificationSeenResponse>>(
    "/v1/private/notifications/seen",
    payload
  );
  return data.data;
};


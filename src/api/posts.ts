/* eslint-disable @typescript-eslint/no-explicit-any */
import axiosInstance from "./axios-config";
import type { ApiResponse, PaginatedData } from "@/types";

export interface LocationPost {
  postId: string;
  content: string;
  imageUrls: string[];
  type: string;
  isVerified: boolean;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  rating: number | null;
  eventId: string | null;
}

export interface GetLocationPostsParams {
  locationId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export const getLocationPosts = async ({
  locationId,
  page = 1,
  limit = 20,
  sortBy = "createdAt:DESC",
}: GetLocationPostsParams): Promise<PaginatedData<LocationPost>> => {
  const params: any = { page, limit, sortBy };

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<LocationPost>>
  >(`/v1/owner/posts/location/${locationId}`, { params });
  return data.data;
};


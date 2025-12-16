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

export interface PostDetail {
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
    isFollow?: boolean;
  };
  rating: number | null;
  analytics: {
    totalUpvotes: number;
    totalDownvotes: number;
    totalComments: number;
  };
  currentUserReaction: string | null;
  location?: {
    id: string;
    name: string;
    addressLine: string;
    latitude: number;
    longitude: number;
    imageUrl: string[];
  };
}

export const getPostById = async (postId: string): Promise<PostDetail> => {
  const { data } = await axiosInstance.get<ApiResponse<PostDetail>>(
    `/v1/post/${postId}`
  );
  return data.data;
};

export interface Comment {
  commentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  totalUpvotes: number;
  totalDownvotes: number;
  locationName?: string; // Location name for owner comments
}

export interface GetCommentsParams {
  postId: string;
  page?: number;
  limit?: number;
}

export const getPostComments = async ({
  postId,
  page = 1,
  limit = 10,
}: GetCommentsParams): Promise<PaginatedData<Comment>> => {
  const params: any = { page, limit };

  const { data } = await axiosInstance.get<
    ApiResponse<PaginatedData<Comment>>
  >(`/v1/private/comment/post/${postId}`, { params });
  return data.data;
};

export interface CreateCommentPayload {
  content: string;
  postId: string;
}

export const createComment = async (payload: CreateCommentPayload): Promise<Comment> => {
  const { data } = await axiosInstance.post<ApiResponse<Comment>>(
    `/v1/private/comment`,
    payload
  );
  return data.data;
};

export interface CreateOwnerCommentPayload {
  content: string;
  postId: string;
}

export const createOwnerComment = async (payload: CreateOwnerCommentPayload): Promise<Comment> => {
  const { data } = await axiosInstance.post<ApiResponse<Comment>>(
    `/v1/owner/comment`,
    payload
  );
  return data.data;
};


/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface Meta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  data: T[];
  meta: Meta;
}

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
}
export interface SignupResponse {
  confirmCode: string;
}
export interface VerifyOtpPayload {
  email: string;
  confirmCode: string;
  otpCode: string;
}
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: User;
  token: string;
}

export type UserRole = "USER" | "BUSINESS_OWNER" | "EVENT_CREATOR" | "ADMIN";
export type BusinessCategory =
  | "FOOD"
  | "RETAIL"
  | "SERVICE"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "EDUCATION"
  | "TECHNOLOGY"
  | "OTHER";
export type CreatorType = "INDIVIDUAL" | "ORGANIZATION";
export type LocationStatus =
  | "AUTO_VALIDATING"
  | "AWAITING_ADMIN_REVIEW"
  | "APPROVED"
  | "NEEDS_MORE_INFO"
  | "REJECTED"
  | "CANCELLED_BY_BUSINESS";
export type SortDirection = "ASC" | "DESC";
export type BusinessStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  role: UserRole;
  token?: string;
  hasOnboarded: boolean;
  businessProfile?: any;
}

export interface GetBusinessesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BusinessStatus;
  sortBy?: string;
}

export interface BusinessProfile {
  accountId: string;
  avatar: string | null;
  website: string | null;
  name: string;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  description: string;
  status: BusinessStatus;
  category: BusinessCategory;
  email: string;
  phone: string;
}

export interface BusinessOnboardingPayload {
  name: string;
  description: string;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  email: string;
  phone: string;
  avatar: string;
  licenseNumber: string;
  licenseExpirationDate: string;
  licenseType: string;
  website: string;
  category: BusinessCategory;
}

export interface SocialLink {
  platform: string;
  url: string;
  isMain: boolean;
}

export interface CreatorOnboardingPayload {
  displayName: string;
  description: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  coverUrl: string;
  type: CreatorType;
  social: SocialLink[];
}

export interface Tag {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  groupName: string | null;
  displayName: string;
  color: string;
  icon: string;
  isSelectable: boolean;
}

export interface GetTagsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface TagCreationItem {
  groupName?: string | null;
  displayName: string;
  color: string;
  icon: string;
}

export interface CreateTagPayload {
  list: TagCreationItem[];
}

export interface Location {
  id: string;
  ownershipType: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  radiusMeters: number;
  imageUrl: string[];
  totalCheckIns: string;
  createdAt: string;
  updatedAt: string;
  isVisibleOnMap: boolean;
  businessId: string | null;
  business: BusinessInLocation | null;
  tags: {
    id: number;
    tagId: number;
    tag: Tag;
  }[];
}

interface ProcessedByAdmin {
  id: string;
  firstName: string;
  lastName: string;
  role: "ADMIN";
}

interface LocationValidationDocument {
  documentType: string;
  documentImageUrls: string[];
}

export interface LocationRequest {
  id: string;
  createdAt: string;
  name: string;
  description: string;
  status: LocationStatus;
  adminNotes: string | null;
  createdBy: User;
  processedBy: ProcessedByAdmin | null;
  tags: {
    id: number;
    tagId: number;
    tag: Tag;
  }[];
  latitude: number;
  longitude: number;
  radiusMeters: number;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  locationImageUrls: string[];
  locationValidationDocuments: {
    documentType: string;
    documentImageUrls: string[];
  }[];
  type: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  locationImageUrls: string[];
  locationValidationDocuments: LocationValidationDocument[];
  tagIds: number[];
}

export interface UpdateLocationPayload {
  name: string;
  description: string;
  imageUrl: string[];
  isVisibleOnMap: boolean;
  tagIds: number[];
}

export interface GetRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LocationStatus;
  sortBy?: string;
}

export interface ProcessRequestPayload {
  status: "APPROVED" | "REJECTED";
  adminNotes?: string;
}

export interface SortState {
  column: string;
  direction: SortDirection;
}

interface BusinessInLocation {
  accountId: string;
  avatar: string;
  website: string;
  name: string;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  description: string;
  licenseNumber: string;
  licenseExpirationDate: string;
  licenseType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status: LocationStatus;
  adminNotes: string | null;
  email: string;
  phone: string;
  category: BusinessCategory;
}

export interface CreatePublicLocationPayload {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  imageUrl: string[];
  isVisibleOnMap: boolean;
  tagIds: number[];
}

export interface GetLocationsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

export interface LocationAvailability {
  id: number;
  locationId: string;
  status: string;
  note: string | null;
  startDateTime: string;
  endDateTime: string;
}

export interface CreateAvailabilityPayload {
  locationId: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  note?: string;
}

export interface UpdateAvailabilityPayload {
  startDateTime?: string;
  endDateTime?: string;
  status?: string;
  note?: string;
}

export interface CreateLocationMissionPayload {
  title: string;
  description: string;
  metric: string;
  target: number;
  reward: number;
  startDate: string;
  endDate: string;
  imageUrls: string[];
}

export interface LocationMission {
  id: string;
  locationId: string;
  title: string;
  description: string;
  metric: string;
  target: number;
  reward: number;
  startDate: string;
  endDate: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  location: Location;
}

export interface GetLocationMissionsParams {
  locationId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface UpdateLocationMissionPayload {
  title: string;
  description: string;
  metric: string;
  target: number;
  reward: number;
  startDate: string;
  endDate: string;
  imageUrls: string[];
}
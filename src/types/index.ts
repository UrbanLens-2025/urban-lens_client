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

export type UserRole = 'USER' | 'BUSINESS_OWNER' | 'EVENT_CREATOR' | 'ADMIN';
export type BusinessCategory = 'FOOD' | 'RETAIL' | 'SERVICE' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'TECHNOLOGY' | 'OTHER';
export type CreatorType = 'INDIVIDUAL' | 'ORGANIZATION';
export type LocationStatus = 'AUTO_VALIDATING' | 'AWAITING_ADMIN_REVIEW' | 'APPROVED' | 'NEEDS_MORE_INFO' | 'REJECTED' | 'CANCELLED_BY_BUSINESS';

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
}

export interface BusinessOnboardingPayload {
  name: string;
  description: string;
  address: string;
  wardCode: string;
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
  displayName: string;
  color: string;
  icon: string;
}

interface NestedBusinessForLocation {
  name: string;
  address: string;
  category: BusinessCategory;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  imageUrl: string[];
  business: NestedBusinessForLocation; // <-- Dữ liệu business lồng nhau
  tags: {
    id: number;
    tagId: number;
    tag: Tag; // <-- Dữ liệu tag đã được populate đầy đủ
  }[];
}


// --- TYPE CHO API /v1/business/location-request (LỊCH SỬ YÊU CẦU) ---

interface CreatedByBusiness {
  accountId: string;
  name: string;
  address: string;
  wardCode: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: BusinessCategory;
  // ...
}

interface ProcessedByAdmin {
  id: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN';
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
  createdBy: CreatedByBusiness;
  processedBy: ProcessedByAdmin | null;
  tags: {
    id: number;
    tagId: number;
    // Lưu ý: API này không trả về object `tag` đầy đủ
  }[];
  latitude: string;
  longitude: string;
  locationImageUrls: string[];
  locationValidationDocuments: {
    documentType: string;
    documentImageUrls: string[];
  }[];
}

export interface CreateLocationPayload {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  addressLine: string;
  addressLevel1: string; // Tên Tỉnh/Thành
  addressLevel2: string; // Tên Quận/Huyện hoặc Phường/Xã
  locationImageUrls: string[];
  locationValidationDocuments: LocationValidationDocument[];
  tagIds: number[];
}
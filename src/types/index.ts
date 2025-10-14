export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export type UserRole = 'USER' | 'BUSINESS_OWNER' | 'EVENT_CREATOR';
export type BusinessCategory = 'FOOD' | 'RETAIL' | 'SERVICE' | 'ENTERTAINMENT' | 'HEALTH' | 'EDUCATION' | 'TECHNOLOGY' | 'OTHER';
export type CreatorType = 'INDIVIDUAL' | 'ORGANIZATION';

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
  type: CreatorType ;
  social: SocialLink[];
}

export interface BusinessStatusResponse {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

export interface Province {
  code: string;
  name: string;
}

export interface Ward {
  code: string;
  name: string;
  provinceCode: string;
}
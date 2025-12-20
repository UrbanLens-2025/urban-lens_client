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

export type UserRole = 'USER' | 'BUSINESS_OWNER' | 'EVENT_CREATOR' | 'ADMIN';
export type BusinessCategory =
  | 'FOOD'
  | 'RETAIL'
  | 'SERVICE'
  | 'ENTERTAINMENT'
  | 'HEALTH'
  | 'EDUCATION'
  | 'TECHNOLOGY'
  | 'OTHER';
export type CreatorType = 'INDIVIDUAL' | 'ORGANIZATION';
export type LocationStatus =
  | 'AUTO_VALIDATING'
  | 'AWAITING_ADMIN_REVIEW'
  | 'APPROVED'
  | 'NEEDS_MORE_INFO'
  | 'REJECTED'
  | 'CANCELLED_BY_BUSINESS';
export type SortDirection = 'ASC' | 'DESC';
export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW';

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
  adminNotes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export enum AcceptedBusinessLicenseTypes {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  OPERATING_PERMIT = 'OPERATING_PERMIT',
  TAX_IDENTIFICATION = 'TAX_IDENTIFICATION',
}

export interface BusinessLicense {
  licenseType: AcceptedBusinessLicenseTypes;
  documentImageUrls: string[];
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
  licenses: BusinessLicense[];
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

export interface TagCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  applicableTypes: ('USER' | 'LOCATION' | 'EVENT')[];
}

export interface GetTagsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface TagCreationItem {
  groupName: string;
  displayName: string;
  color: string;
  icon: string;
  isSelectable: boolean;
}

export interface CreateTagPayload {
  list: TagCreationItem[];
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
  createdBy: User;
  processedBy: ProcessedByAdmin | null;
  tags: Tag[];
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
  categoryIds: number[];
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
  sortBy?: string | string[];
  searchBy?: string[];
  filterVisibleOnMap?: 'true' | 'false';
}

export interface ProcessRequestPayload {
  status: 'APPROVED' | 'REJECTED';
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
  target: number;
  reward: number;
  startDate: string;
  endDate: string;
  imageUrls: string[];
}

export interface UpdateTagPayload {
  groupName: string;
  displayName: string;
  color: string;
  icon: string;
  isSelectable: boolean;
}

export interface GetLocationVouchersParams {
  locationId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface LocationVoucher {
  id: string;
  locationId: string;
  title: string;
  description: string;
  voucherCode: string;
  imageUrl: string;
  pricePoint: number;
  maxQuantity: number;
  userRedeemedLimit: number;
  voucherType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  location: LocationForVoucher;
  statistics?: {
    total: number;
    used: number;
    remaining: number;
  };
}

export interface CreateLocationVoucherPayload {
  title: string;
  description: string;
  voucherCode: string;
  imageUrl: string;
  pricePoint: number;
  maxQuantity: number;
  userRedeemedLimit: number;
  voucherType: string;
  startDate: string;
  endDate: string;
}

interface LocationForVoucher {
  id: string;
  name: string;
  description: string;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  radiusMeters: number;
  imageUrl: string[];
  latitude: string;
  longitude: string;
  isVisibleOnMap: boolean;
}

export interface GetLocationVouchersParams {
  locationId: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface UpdateLocationVoucherPayload {
  title: string;
  description: string;
  voucherCode: string;
  imageUrl: string;
  pricePoint: number;
  maxQuantity: number;
  userRedeemedLimit: number;
  voucherType: string;
  startDate: string;
  endDate: string;
}

export type AnnouncementStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export interface Announcement {
  id: string;
  locationId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: User | null;
  audience?: string[] | null;
  location?: Location | null;
}

export interface GetAnnouncementsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  locationId?: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isHidden: boolean;
  locationId: string;
}

export interface UpdateAnnouncementPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isHidden: boolean;
}

export interface EventRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  eventName: string;
  eventDescription: string;
  expectedNumberOfParticipants: number;
  allowTickets: boolean;
  specialRequirements: string;
  status: EventRequestStatus;
  referencedLocationBookingId: string;
  referencedLocationBooking: ReferencedLocationBooking;
  eventValidationDocuments: {
    documentType: string;
    documentImageUrls: string[];
  }[];

  requestedLocation?: string;
  locationOwner?: string;
  eventDate?: string;
  locationBooking?: LocationBooking;
}

export interface GetEventRequestsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface CreateEventRequestPayload {
  eventName: string;
  eventDescription: string;
  expectedNumberOfParticipants: number;
  allowTickets: boolean;
  specialRequirements?: string;
  tagIds: number[];
  social?: {
    platform: string;
    url: string;
    isMain: boolean;
  }[];
  locationId: string;
  dates: {
    startDateTime: string;
    endDateTime: string;
  }[];
  eventValidationDocuments: {
    documentType: string;
    documentImageUrls: string[];
  }[];
}

export interface LocationBookingConfig {
  id?: string;
  locationId: string;
  allowBooking: boolean;
  baseBookingPrice: string;
  currency: string;
  minBookingDurationMinutes: number;
  maxBookingDurationMinutes: number;
  minGapBetweenBookingsMinutes: number;
  maxCapacity?: number;
  refundEnabled?: boolean;
  refundCutoffHours?: number;
  refundPercentageAfterCutoff?: number;
  refundPercentageBeforeCutoff?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocationBookingConfigPayload {
  locationId: string;
  allowBooking: boolean;
  baseBookingPrice: number;
  currency: string;
  minBookingDurationMinutes: number;
  maxBookingDurationMinutes: number;
  minGapBetweenBookingsMinutes: number;
  maxCapacity?: number;
  refundEnabled?: boolean;
  refundCutoffHours?: number;
  refundPercentageAfterCutoff?: number;
  refundPercentageBeforeCutoff?: number;
}

export interface UpdateLocationBookingConfigPayload {
  allowBooking: boolean;
  baseBookingPrice: number;
  currency: string;
  minBookingDurationMinutes: number;
  maxBookingDurationMinutes: number;
  minGapBetweenBookingsMinutes: number;
  maxCapacity?: number;
  refundEnabled?: boolean;
  refundCutoffHours?: number;
  refundPercentageAfterCutoff?: number;
  refundPercentageBeforeCutoff?: number;
}

export interface BookableLocation {
  id: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  addressLine: string;
  addressLevel1: string;
  addressLevel2: string;
  imageUrl: string[];
  isVisibleOnMap: boolean;
  businessId: string;
  bookingConfig: LocationBookingConfig;
  tags?: Tag[];
}

export interface GetBookableLocationsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  startTime?: string;
  endTime?: string;
  minPrice?: number;
  maxPrice?: number;
  maxCapacity?: number;
}

export interface ReferencedLocationBooking {
  id: string;
  bookingObject: string;
  status: string;
  amountToPay: string;
  dates: {
    startDateTime: string;
    endDateTime: string;
  }[];
  locationId: string;
  referencedTransactionId: string | null;
  softLockedUntil: string;
}

export interface GetEventRequestsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

export interface Wallet {
  id: string;
  ownedBy: string | null;
  walletType: string;
  balance: string;
  lockedBalance: string;
  currency: string;
  totalTransactions: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProviderResponse {
  vnp_Amount: number;
  vnp_TxnRef: string;
  vnp_PayDate: number;
  vnp_TmnCode: string;
  vnp_BankCode: string;
  vnp_CardType: string | null;
  vnp_OrderInfo: string;
  vnp_BankTranNo: string;
  vnp_SecureHash: string;
  vnp_ResponseCode: number;
  vnp_TransactionNo: number;
  vnp_TransactionStatus: number;
}

export interface WalletExternalTransaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  walletId: string;
  provider: string | null;
  providerTransactionId: string | null;
  direction: string;
  amount: string;
  currency: string;
  paymentUrl: string | null;
  expiresAt: string | null;
  providerResponse: ProviderResponse | null;
  status: string;
  createdById: string;
  createdBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    hasOnboarded: boolean;
  };
  withdrawBankName?: string | null;
  withdrawBankAccountNumber?: string | null;
  withdrawBankAccountName?: string | null;
  timeline?: WalletExternalTransactionTimelineEvent[];
  customMetadata?: {
    paymentUrl?: string;
    provider?: string;
    checkoutFields?: Record<string, string>;
  };
}

export interface GetWalletExternalTransactionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface WalletExternalTransactionTimelineEvent {
  id: string;
  createdAt: string;
  transactionId: string;
  statusChangedTo: string;
  action: string;
  actorType: string;
  actorId: string | null;
  actorName: string;
  note: string;
  metadata: any;
}

export interface CreateExternalDepositPayload {
  amount: number;
  currency: string; // e.g., "VND"
  returnUrl: string;
  afterAction: string; // e.g., "NONE"
}

export interface CreateExternalWithdrawPayload {
  amountToWithdraw: number;
  currency: string; // e.g., "VND"
  withdrawBankName: string;
  withdrawBankAccountNumber: string;
  withdrawBankAccountName: string;
}

export interface WalletTransaction {
  id: string;
  amount: string;
  currency: string;
  type: string; // e.g., TO_ESCROW, FROM_ESCROW
  status: string; // e.g., COMPLETED
  createdAt: string;
  note: string | null;
}

export interface GetWalletTransactionsParams {
  page?: number;
  limit?: number;
  sortBy?: string; // e.g., createdAt:DESC
}

// Admin: get internal wallet transactions for a specific wallet
export interface GetAdminWalletTransactionsParams
  extends GetWalletTransactionsParams {
  walletId: string;
}

export interface ReferencedEventRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  eventName: string;
  eventDescription: string;
  expectedNumberOfParticipants: number;
  allowTickets: boolean;
  specialRequirements: string;
  status: string;
  referencedLocationBookingId: string;
  eventValidationDocuments: {
    documentType: string;
    documentImageUrls: string[];
  }[];
}

export interface CreatorProfile {
  accountId: string;
  displayName: string;
  description: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  coverUrl: string;
  type: string;
  social: SocialLink[];
}

export interface UserWithCreatorProfile extends User {
  creatorProfile?: CreatorProfile;
}

export interface ReferencedTransaction {
  id: string;
  amount: string;
  currency: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface LocationBooking {
  id: string;
  bookingObject: string;
  status: string;
  amountToPay: string;
  amountToReceive: string;
  dates: {
    startDateTime: string;
    endDateTime: string;
  }[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
  locationId: string;
  referencedTransactionId: string | null;
  softLockedUntil: string | null;
  createdBy: User;
  location: LocationForEvent;
  referencedEventRequest: ReferencedEventRequest;
}

export interface LocationBookingDetail
  extends Omit<LocationBooking, 'createdBy'> {
  createdBy: UserWithCreatorProfile;
  referencedTransaction: ReferencedTransaction | null;
}

export interface GetOwnerLocationBookingsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  status?: string;
}

export interface ProcessLocationBookingPayload {
  status: 'APPROVED' | 'REJECTED';
}

interface LocationForEvent {
  id: string;
  ownershipType: string;
  name: string;
  description: string | null;
  latitude: string;
  longitude: string;
  addressLine: string;
  addressLevel1: string | null;
  addressLevel2: string | null;
  radiusMeters: number;
  imageUrl: string[];
  createdAt: string;
  updatedAt: string;
  isVisibleOnMap: boolean;
  businessId: string | null;
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
}

// Core Event entity used across creator & admin dashboards
export interface Event {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Basic info
  displayName: string;
  description: string | null;
  expectedNumberOfParticipants?: number | null;
  status: string;

  // Media
  avatarUrl?: string | null;
  coverUrl?: string | null;

  // Timing
  startDate?: string | null;
  endDate?: string | null;

  // Relations
  locationId?: string | null;
  location?: LocationForEvent | null;
  tags?: Tag[];

  // Social & documents
  social?: {
    platform: string;
    url: string;
    isMain: boolean;
  }[];
  eventValidationDocuments?: {
    documentType: string;
    documentImageUrls: string[];
  }[];

  // Policies
  refundPolicy?: string | null;
  termsAndConditions?: string | null;

  // Misc / extensions (keep flexible for API evolution)
  referencedEventRequestId?: string | null;
  [key: string]: unknown;
}

export interface UpdateEventPayload {
  displayName?: string;
  description?: string;
  expectedNumberOfParticipants?: number;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  social?: SocialLink[];
  eventValidationDocuments?: {
    documentType: string;
    documentImageUrls: string[];
  }[];
}

export interface AddEventTagsPayload {
  tagIds: number[];
}

export interface RemoveEventTagsPayload {
  tagIds: number[];
}

export interface EventTagResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  eventId: string;
  tagId: number;
}

export interface CreateTicketPayload {
  displayName: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  tos: string | null;
  totalQuantityAvailable: number;
  saleStartDate: string;
  saleEndDate: string;
  minQuantityPerOrder: number;
  maxQuantityPerOrder: number;
  allowRefunds?: boolean;
  refundPercentageBeforeCutoff?: number;
  refundCutoffHoursAfterPayment?: number;
}

export interface UpdateTicketPayload {
  displayName?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string | null;
  isActive?: boolean;
  tos?: string | null;
  totalQuantityAvailable?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  minQuantityPerOrder?: number;
  maxQuantityPerOrder?: number;
  allowRefunds?: boolean;
  refundPercentageBeforeCutoff?: number;
  refundCutoffHoursAfterPayment?: number;
}

export interface Ticket {
  totalQuantity: number;
  id: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: User;
  displayName: string;
  description: string;
  price: string;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  tos: string | null;
  totalQuantityAvailable: number;
  quantityReserved: number;
  saleStartDate: string;
  saleEndDate: string;
  minQuantityPerOrder: number;
  maxQuantityPerOrder: number;
  eventId: string;
  event?: Event;
}

export interface TicketSnapshot {
  id: string;
  tos: string | null;
  price: string;
  eventId: string;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  description: string;
  displayName: string;
  saleEndDate: string;
  saleStartDate: string;
  totalQuantity: number;
  quantityReserved: number;
  maxQuantityPerOrder: number;
  minQuantityPerOrder: number;
  totalQuantityAvailable: number;
}

export interface OrderDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  quantity: number;
  unitPrice: string;
  currency: string;
  subTotal: number;
  ticketId: string;
  orderId: string;
  ticketSnapshot: TicketSnapshot;
  ticket: Ticket;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  totalPaymentAmount: string;
  currency: string;
  status: string;
  referencedTransactionId: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  refundedAmount?: number;
  refundTransactionId?: string | null;
  eventId: string;
  createdBy: User;
  orderDetails: OrderDetail[];
  eventAttendances?: OrderEventAttendance[];
  referencedTransaction?: any;
}

export interface OrderEventAttendance {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  eventId: string;
  status: string;
  ownerId: string;
  ownerEmail: string;
  ownerPhoneNumber: string | null;
  referencedTicketOrderId: string;
  ticketId: string;
  numberOfAttendees: number;
  checkedInAt: string | null;
}

export interface EventAttendance {
  checkInTime: any;
  id: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  status: string;
  ticketSnapshot?: TicketSnapshot;
  numberOfAttendees?: number;
  order: Order;
}

export interface GetEventAttendanceParams {
  page?: number;
  limit?: number;
  sortBy?: string;
}

export interface GetEventOrdersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  searchBy?: string[];
  status?: string;
}

export interface ConfirmAttendancePayload {
  eventAttendanceId: string;
  checkingInAccountId: string;
}

export interface CreatorAnnouncement {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetCreatorAnnouncementsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  eventId?: string;
}

export interface CreateCreatorAnnouncementPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isHidden: boolean;
  eventId: string;
}

export interface UpdateCreatorAnnouncementPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string | null;
  isHidden: boolean;
}

// Push Notification Types
export interface RegisterDevicePayload {
  token: string;
}

export interface RegisteredDevice {
  id: string;
  deviceToken: string;
  deviceType: string;
  deviceName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationStatus = 'SEEN' | 'UNSEEN';
export type NotificationType = 'CUSTOM' | string;

export interface NotificationPayload {
  body: string;
  title: string;
  imageUrl?: string | null;
}

export interface Notification {
  id: number;
  createdAt: string;
  type: NotificationType;
  payload: NotificationPayload;
  toUserId: string;
  status: NotificationStatus;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  status?: NotificationStatus;
}

export interface MarkNotificationsSeenPayload {
  notificationId: string[];
}

export interface MarkNotificationSeenResponse {
  success: boolean;
  message: string;
}

// Report Types
export enum ScheduledJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type ReportStatus = 'PENDING' | 'CLOSED';
export type ReportTargetType = 'post' | 'event' | 'location' | 'booking';

export enum PostReportResolutionActions {
  NO_ACTION_TAKEN = 'NO_ACTION_TAKEN',
  MALICIOUS_REPORT = 'MALICIOUS_REPORT',
  BAN_POST = 'BAN_POST',
}

export enum LocationReportResolutionActions {
  NO_ACTION_TAKEN = 'NO_ACTION_TAKEN',
  MALICIOUS_REPORT = 'MALICIOUS_REPORT',
}

export enum EventReportResolutionActions {
  CANCEL_EVENT = 'CANCEL_EVENT',
  NO_ACTION_TAKEN = 'NO_ACTION_TAKEN',
  MALICIOUS_REPORT = 'MALICIOUS_REPORT',
}

export const ReportResolutionActions = {
  ...PostReportResolutionActions,
  ...LocationReportResolutionActions,
  ...EventReportResolutionActions,
};

export type ReportResolutionActions =
  (typeof ReportResolutionActions)[keyof typeof ReportResolutionActions];

export type ResolutionAction = ReportResolutionActions | null;

export interface ReportedReasonEntity {
  key: string;
  displayName: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferencedTargetPost {
  postId: string;
  content: string;
  type: string;
  rating: number | null;
  imageUrls: string[];
  locationId: string | null;
  eventId: string | null;
  visibility: string;
  isVerified: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface ReferencedTargetEvent {
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  locationId: string | null;
  // Add other event fields as needed
}

export interface ReferencedTargetLocation {
  locationId: string;
  name: string;
  description: string | null;
  // Add other location fields as needed
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reportedReasonKey: string;
  title: string;
  description: string;
  attachedImageUrls: string[];
  status: ReportStatus;
  scheduledJobStatus?: ScheduledJobStatus | null;
  resolutionAction: ResolutionAction;
  resolvedByType: string | null;
  resolvedById: string | null;
  resolvedBy?: User | null;
  resolvedAt: string | null;
  createdAt: string;
  createdById: string;
  createdBy: User;
  updatedAt: string;
  firstSeenAt?: string | null;
  firstSeenByAdminId?: string | null;
  reportedReasonEntity: ReportedReasonEntity;
  referencedTargetPost: ReferencedTargetPost | null;
  referencedTargetEvent: ReferencedTargetEvent | null;
  referencedTargetLocation: ReferencedTargetLocation | null;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  status?: ReportStatus;
  targetType?: ReportTargetType;
  targetId?: string;
  denormSecondaryTargetId?: string;
}

export type ReportEntityType = 'post' | 'location' | 'event';

export type ReportPenaltyActions =
  | 'WARN_USER'
  | 'SUSPEND_ACCOUNT'
  | 'BAN_ACCOUNT'
  | 'SUSPEND_LOCATION_BOOKING'
  | 'BAN_POST';

export interface Penalty {
  id: string;
  targetId: string;
  targetType: ReportEntityType;
  penaltyAction: ReportPenaltyActions;
  reason?: string | null;
  createdById?: string | null;
  createdBy?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessReportPayload {
  status: 'RESOLVED' | 'REJECTED';
  resolutionAction: ReportResolutionActions; // Required: must be NO_ACTION_TAKEN, MALICIOUS_REPORT, or CANCEL_EVENT
  adminNotes?: string; // Optional notes field if API supports it
}

export type RevenuePeriod = 'day' | 'month' | 'year';

export interface RevenueSummary {
  totalRevenue: number;
  available: number;
  pending: number;
  pendingWithdraw: number;
  totalBalance: number;
}

export interface RevenueChartItem {
  locationId: string;
  name: string;
  revenue: number;
}

export interface DashboardOverviewStats {
  totalLocations: number;
  approvedLocations: number;
  totalReviews: number;
  totalCheckIns: number;
  totalBookings: number;
  recentBookingsCount: number;
}

export interface TopRevenueEvent {
  eventId: string;
  eventName: string;
  totalRevenue: number;
  totalTicketsSold: number;
}

export interface TopRevenueLocation {
  locationId: string;
  locationName: string;
  revenue: number;
}
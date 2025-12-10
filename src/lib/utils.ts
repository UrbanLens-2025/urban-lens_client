import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Document type labels mapping
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  LOCATION_REGISTRATION_CERTIFICATE: 'Location Registration Certificate',
  BUSINESS_LICENSE: 'Business License',
  TAX_REGISTRATION: 'Tax Registration',
  EVENT_PERMIT: 'Event Permit',
  OTHER: 'Other Document',
};

/**
 * Formats a document type string for display.
 * Converts enum-style strings (e.g., "LOCATION_REGISTRATION_CERTIFICATE")
 * to readable format (e.g., "Location Registration Certificate").
 */
export function formatDocumentType(type: string): string {
  // Check if we have a predefined label
  if (DOCUMENT_TYPE_LABELS[type]) {
    return DOCUMENT_TYPE_LABELS[type];
  }

  // Fallback: format the string by splitting on underscores and capitalizing
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a group/category name for display.
 * Converts technical names (e.g., "USER_TYPE") to readable format (e.g., "User Type").
 */
export function formatGroupName(groupName: string | null): string {
  if (!groupName) return '—';

  return groupName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

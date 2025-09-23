export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  role: string;
  token?: string;
}
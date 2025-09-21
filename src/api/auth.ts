import type { ApiResponse, User } from "@/types";
import axiosInstance from "./axios-config";

export interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
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

export async function signup(payload: SignupPayload): Promise<ApiResponse<SignupResponse>> {
  const { data } = await axiosInstance.post('/public/auth/register/user', payload);

  if (data.success && data.data.confirmCode) {
    localStorage.setItem("signupEmail", payload.email);
    localStorage.setItem("confirmCode", data.data.confirmCode);
  }
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.post('/public/auth/register/confirm', payload);
  return data;
}

export async function resendOtp(payload: { email: string; confirmCode: string }): Promise<ApiResponse<SignupResponse>> {
  const { data } = await axiosInstance.post('/public/auth/register/resend-otp', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.post('/public/auth/login', payload);

  if (data.success && data.data.token) {
    localStorage.setItem("token", data.data.token);
  }
  return data;
}
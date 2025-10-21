import type { ApiResponse, LoginPayload, LoginResponseData, SignupPayload, SignupResponse, User, VerifyOtpPayload } from "@/types";
import axiosInstance from "./axios-config";

export async function signup(payload: SignupPayload): Promise<ApiResponse<SignupResponse>> {
  const { data } = await axiosInstance.post('/v1/public/auth/register/user', payload);

  if (data.success && data.data.confirmCode) {
    localStorage.setItem("signupEmail", payload.email);
    localStorage.setItem("confirmCode", data.data.confirmCode);
  }
  return data;
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<ApiResponse<User>> {
  const { data } = await axiosInstance.post('/v1/public/auth/register/confirm', payload);
  return data;
}

export async function resendOtp(payload: { email: string; confirmCode: string }): Promise<ApiResponse<SignupResponse>> {
  const { data } = await axiosInstance.post('/v1/public/auth/register/resend-otp', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> {
  const { data } = await axiosInstance.post('/v1/public/auth/login', payload);

  if (data.success && data.data.token) {
    localStorage.setItem("token", data.data.token);
  }
  return data;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

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

export async function signup(
  payload: SignupPayload
): Promise<ApiResponse<SignupResponse>> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/auth/register/user`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data: ApiResponse<SignupResponse> = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Signup request failed");
  }

  if (data.success && data.data.confirmCode) {
    localStorage.setItem("signupEmail", payload.email);
    localStorage.setItem("confirmCode", data.data.confirmCode);
  }

  return data;
}

// ----- VERIFY OTP -----
export interface VerifyOtpPayload {
  email: string;
  confirmCode: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  token: string;
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<ApiResponse<VerifyOtpResponse>> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/auth/register/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "OTP verification failed");
  }

  return data;
}

export async function resendOtp(
  payload: VerifyOtpPayload
): Promise<ApiResponse<VerifyOtpResponse>> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/auth/register/resend-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "OTP verification failed");
  }

  return data;
}

// ----- LOGIN -----
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  token: string;
}

export async function login(
  payload: LoginPayload
): Promise<ApiResponse<LoginResponse>> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data: ApiResponse<LoginResponse> = await res.json();

    if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (data.success && data.data.token) {
    localStorage.setItem("token", data.data.token);
  }

  return data;
}

// ----- GET USER -----
export async function getUser(): Promise<ApiResponse<LoginResponse>> {
  const token = localStorage.getItem("token");
  if (!token) {
    return {
      success: false,
      message: "Not authenticated",
      statusCode: 401,
      data: {} as LoginResponse,
    };
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/user/auth/profile`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return res.json();
}

import { ApiResponse } from "@/types";
import axiosInstance from "./axios-config";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axiosInstance.post<ApiResponse<string>>(
    "/v1/file-storage/image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data.data;
}

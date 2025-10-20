"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLocationRequest } from "@/api/locations"; // Đảm bảo import đúng
import { CreateLocationPayload } from "@/types";

export function useCreateLocationRequest() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    // 1. Cung cấp hàm gọi API
    mutationFn: (payload: CreateLocationPayload) => createLocationRequest(payload),
    
    // 2. Xử lý khi thành công
    onSuccess: () => {
      toast.success("Location request submitted successfully for review!");
      
      // Vô hiệu hóa và fetch lại danh sách các yêu cầu để cập nhật bảng
      queryClient.invalidateQueries({ queryKey: ['myLocationRequests'] });

      // Chuyển người dùng về trang quản lý địa điểm
      router.push('/dashboard/business/locations');
    },

    // 3. Xử lý khi có lỗi
    onError: (err) => {
      toast.error(err.message || "Failed to submit location request.");
    },
  });
}
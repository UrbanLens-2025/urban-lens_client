"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocationRequestById } from "@/api/locations";

/**
 * Custom hook để fetch dữ liệu chi tiết của một location request theo ID.
 * @param id - ID của request cần fetch, có thể là null.
 */
export function useLocationRequestById(id: string | null) {
  return useQuery({
    // queryKey phải chứa ID để cache dữ liệu cho từng request riêng biệt
    queryKey: ['locationRequest', id],
    
    // queryFn gọi đến hàm API và truyền vào ID
    queryFn: () => getLocationRequestById(id!),
    
    // Rất quan trọng: Query này chỉ được kích hoạt khi `id` có giá trị
    enabled: !!id,
  });
}
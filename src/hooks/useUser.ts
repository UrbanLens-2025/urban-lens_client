// hooks/useUser.ts
"use client";

import { useState, useEffect } from "react"; // <-- Cần useState và useEffect
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/user";

export function useUser() {
  const [isMounted, setIsMounted] = useState(false);

  // useEffect đảm bảo logic chỉ chạy ở client sau khi hydration hoàn tất
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const token = isMounted ? localStorage.getItem("token") : null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 1, // 1 phút
    
    enabled: isMounted && !!token,
    
  });
  
  return {
    user: data,
    isLoading: !isMounted || (!!token && isLoading),
    isError,
  };
}
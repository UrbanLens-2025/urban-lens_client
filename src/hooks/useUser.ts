"use client";

import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/auth";

export function useUser() {
  
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 1, // 1 phút
    enabled: !!token,
  });

  return {
    user: data?.data,
    isLoading,
    isError,
  };
}
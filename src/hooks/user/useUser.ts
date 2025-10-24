"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserById } from "@/api/user";

export function useUser(userId?: string | null) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isCurrentUserQuery = !userId;
  const token = isMounted ? localStorage.getItem("token") : null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user", userId || "current"],

    queryFn: () => {
      if (isCurrentUserQuery) {
        return getUser();
      }
      return getUserById(userId!);
    },

    enabled: isCurrentUserQuery ? (isMounted && !!token) : !!userId,

    staleTime: 1000 * 60 * 1,
  });
  
  return {
    user: data,
    isLoading: isCurrentUserQuery ? (!isMounted || (!!token && isLoading)) : isLoading,
    isError,
    error,
  };
}
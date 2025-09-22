"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser, getUserById } from "@/api/user";

export function useUser() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const token = isMounted ? localStorage.getItem("token") : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 1,

    enabled: isMounted && !!token,
  });

  return {
    user: data,
    isLoading: !isMounted || (!!token && isLoading),
    isError,
  };
}

export function useUserById(userId: string | null | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
  });

  return {
    user: data,
    isLoading: isLoading,
    isError,
  };
}

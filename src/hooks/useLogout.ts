"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    queryClient.clear();
    router.push("/login");
  };

  return logout;
}

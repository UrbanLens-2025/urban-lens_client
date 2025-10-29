"use client";

import { useEffect } from "react";
import { useUser } from "@/hooks/user/useUser";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "BUSINESS_OWNER") {
      if (!user.hasOnboarded) {
        router.replace("/onboarding");
        return;
      }

      if (user.businessProfile?.status === "PENDING") {
        router.replace("/onboarding/pending");
        return;
      }

      if (user.businessProfile?.status === "REJECTED") {
        router.replace("/login");
        return;
      }

      if (user.businessProfile?.status === "APPROVED") {
        router.replace("/dashboard/business");
        return;
      }
    }

    if (user.role === "ADMIN") {
      router.replace("/admin");
    } else if (user.role === "BUSINESS_OWNER") {
      router.replace("/dashboard/business");
    } else if (user.role === "EVENT_CREATOR") {
      router.replace("/dashboard/creator");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin" />
    </div>
  );
}

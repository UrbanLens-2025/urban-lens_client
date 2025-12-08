"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user/useUser";
import { Loader2 } from "lucide-react";
import { BusinessOnboardingForm } from "@/components/onboarding/BusinessOnboardingForm";
import { CreatorOnboardingForm } from "@/components/onboarding/CreatorOnboardingForm";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { IconLogout } from "@tabler/icons-react";
import { deregisterDevice } from "@/api/notifications";
import { getFCMToken } from "@/lib/firebase";

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user || user.hasOnboarded || user.role === "USER" || user.role === "ADMIN") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.hasOnboarded || user.role === "USER" || user.role === "ADMIN") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const logout = async () => {
    // Deregister FCM token before logging out
    try {
      const fcmToken = await getFCMToken();
      if (fcmToken) {
        await deregisterDevice({ token: fcmToken });
      }
    } catch (error) {
      console.error("Failed to deregister FCM device:", error);
    }

    localStorage.removeItem("token");
    queryClient.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex">
      {user.role === "BUSINESS_OWNER" && <BusinessOnboardingForm onLogout={logout} />}
      {user.role === "EVENT_CREATOR" && <CreatorOnboardingForm onLogout={logout} />}
    </div>
  );
}

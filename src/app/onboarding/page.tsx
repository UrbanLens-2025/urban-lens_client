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

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user || user.hasOnboarded || user.role === "USER") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.hasOnboarded || user.role === "USER") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const logout = () => {
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

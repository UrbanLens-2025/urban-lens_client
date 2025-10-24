"use client";

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/user/useUser";
import { Loader2 } from "lucide-react";
import { BusinessOnboardingForm } from "@/components/onboarding/BusinessOnboardingForm";
import { CreatorOnboardingForm } from "@/components/onboarding/CreatorOnboardingForm";

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; 
    }
    
    if (!user || user.hasOnboarded || user.role === 'USER') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.hasOnboarded || user.role === 'USER') {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin" />
        </div>
      );
  }

  return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {user.role === 'BUSINESS_OWNER' && <BusinessOnboardingForm />}
        {user.role === 'EVENT_CREATOR' && <CreatorOnboardingForm />}
      </div>
  );
}
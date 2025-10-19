"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from './useUser';

const ROLES_REQUIRING_ONBOARDING = ['BUSINESS_OWNER', 'EVENT_CREATOR'];

export function useOnboardingCheck() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !user) return;

    const needsOnboarding = 
      ROLES_REQUIRING_ONBOARDING.includes(user.role) && !user.hasOnboarded;

    if (needsOnboarding && !pathname.startsWith('/onboarding')) {
      router.replace('/onboarding');
    }

  }, [user, isLoading, router, pathname]);
}
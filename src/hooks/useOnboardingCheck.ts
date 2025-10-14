"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from './useUser';
import { useBusinessOnboardStatus } from './useBusinessOnboardStatus';

export function useOnboardingCheck() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';
  const { data: businessStatus, isLoading: isStatusLoading, isError } = useBusinessOnboardStatus(isBusinessOwner);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) return;
    
    if (user.role === 'BUSINESS_OWNER') {
      if (user.hasOnboarded) return;
      if (isStatusLoading) return;

      if (businessStatus?.status === 'PENDING' && pathname !== '/onboarding/pending') {
        router.replace('/onboarding/pending');
        return;
      }

      if (isError && !pathname.startsWith('/onboarding')) {
        router.replace('/onboarding');
        return;
      }
    } 

    else if (user.role === 'EVENT_CREATOR') {
      const needsOnboarding = !user.hasOnboarded;
      
      if (needsOnboarding && !pathname.startsWith('/onboarding')) {
        router.replace('/onboarding');
      }
    }

  }, [user, isUserLoading, businessStatus, isStatusLoading, isError, router, pathname]);
}
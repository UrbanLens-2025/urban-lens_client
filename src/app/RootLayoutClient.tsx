'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import Providers from './QueryClient';
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ActiveThemeProvider } from '@/components/shared/ActiveTheme';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { useUser } from '@/hooks/user/useUser';
import { useOnboardingCheck } from '@/hooks/onboarding/useOnboardingCheck';
import { useAutoRegisterDevice } from '@/hooks/notifications/useAutoRegisterDevice';
import { useBrowserNotifications } from '@/hooks/notifications/useBrowserNotifications';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  useOnboardingCheck();
  useAutoRegisterDevice(!!user && !isLoading);
  // Enable browser notifications when user is authenticated
  useBrowserNotifications(!!user && !isLoading);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  // While determining auth or redirect target, show an app-level splash to avoid layout flash
  const requiresOnboarding = !!user && (user.role === 'BUSINESS_OWNER' || user.role === 'EVENT_CREATOR') && !user.hasOnboarded;
  const isPendingAfterOnboard = !!user && user.hasOnboarded && user.businessProfile?.status === 'PENDING';
  const redirectingToOnboarding = !isLoading && requiresOnboarding && !pathname.startsWith('/onboarding');
  const redirectingToPending = !isLoading && isPendingAfterOnboard && pathname !== '/onboarding/pending';

  // Check if dark mode is active
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (isLoading || redirectingToOnboarding || redirectingToPending) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='size-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (!user) return null;

  // Set background color based on user role
  const getBackgroundColor = () => {
    switch (user.role) {
      case 'EVENT_CREATOR':
        return 'rgb(239 246 255)'; // blue-50
      case 'BUSINESS_OWNER':
        return 'rgb(255 247 237)'; // orange-50
      case 'ADMIN':
        return 'rgb(254 242 242)'; // red-50
      default:
        return 'transparent';
    }
  };

  const getDarkBackgroundColor = () => {
    switch (user.role) {
      case 'EVENT_CREATOR':
        return 'rgb(30 58 138 / 0.2)'; // blue-950/20
      case 'BUSINESS_OWNER':
        return 'rgb(154 52 18 / 0.2)'; // orange-950/20
      case 'ADMIN':
        return 'rgb(127 29 29 / 0.2)'; // red-950/20
      default:
        return 'transparent';
    }
  };

  const sidebarBgColor = isDarkMode ? getDarkBackgroundColor() : getBackgroundColor();
  const sidebarContentBgColor = () => {
    if (isDarkMode) {
      switch (user.role) {
        case 'EVENT_CREATOR':
          return 'rgb(30 58 138 / 0.3)'; // blue-900/30
        case 'BUSINESS_OWNER':
          return 'rgb(154 52 18 / 0.3)'; // orange-900/30
        case 'ADMIN':
          return 'rgb(127 29 29 / 0.3)'; // red-900/30
        default:
          return 'transparent';
      }
    } else {
      switch (user.role) {
        case 'EVENT_CREATOR':
          return 'rgb(219 234 254)'; // blue-100
        case 'BUSINESS_OWNER':
          return 'rgb(255 237 213)'; // orange-100
        case 'ADMIN':
          return 'rgb(254 226 226)'; // red-100
        default:
          return 'transparent';
      }
    }
  };

  const getActiveButtonBgColor = () => {
    if (isDarkMode) {
      switch (user.role) {
        case 'EVENT_CREATOR':
          return 'rgb(37 99 235)'; // blue-600
        case 'BUSINESS_OWNER':
          return 'rgb(234 88 12)'; // orange-600
        case 'ADMIN':
          return 'rgb(220 38 38)'; // red-600
        default:
          return 'hsl(var(--sidebar-accent))';
      }
    } else {
      switch (user.role) {
        case 'EVENT_CREATOR':
          return 'rgb(59 130 246)'; // blue-500
        case 'BUSINESS_OWNER':
          return 'rgb(249 115 22)'; // orange-500
        case 'ADMIN':
          return 'rgb(239 68 68)'; // red-500
        default:
          return 'hsl(var(--sidebar-accent))';
      }
    }
  };

  const getActiveButtonTextColor = () => {
    // White text for all active buttons for better contrast
    return 'rgb(255 255 255)';
  };

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
          backgroundColor: sidebarBgColor,
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        variant='inset' 
        className="[&_[data-slot=sidebar-inner]]:!bg-transparent"
        style={{
          '--sidebar-bg-color': sidebarContentBgColor(),
          '--sidebar-active-bg': getActiveButtonBgColor(),
          '--sidebar-active-text': getActiveButtonTextColor(),
        } as React.CSSProperties & { 
          '--sidebar-bg-color': string;
          '--sidebar-active-bg': string;
          '--sidebar-active-text': string;
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className='flex flex-col'>
              <main className='flex-1 p-4 md:p-6'>{children}</main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/onboarding');

  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <ActiveThemeProvider>
        <Providers>
          <GoogleMapsProvider>
            {isAuthPage ? (
              <>{children}</>
            ) : (
              <>
                <AuthenticatedLayout>{children}</AuthenticatedLayout>
              </>
            )}
            <Toaster />
          </GoogleMapsProvider>
        </Providers>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}

"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import Providers from "./QueryClient";
import { GoogleMapsProvider } from "@/components/providers/GoogleMapsProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ActiveThemeProvider } from "@/components/shared/ActiveTheme";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { useUser } from "@/hooks/user/useUser";
import { useOnboardingCheck } from "@/hooks/onboarding/useOnboardingCheck";
import { ModeSwitcher } from "@/components/shared/ModeSwitcher";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  useOnboardingCheck();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <main className="flex-1 p-4 md:p-8">{children}</main>
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
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/onboarding");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ActiveThemeProvider>
        <Providers>
          <GoogleMapsProvider>
            {isAuthPage ? (
              <>
                <div className="fixed top-4 right-4 z-50">
                  <ModeSwitcher />
                </div>
                {children}
                <Toaster />
              </>
            ) : (
              <>
                <AuthenticatedLayout>
                  <div className="fixed top-4 right-4 z-50">
                    <ModeSwitcher />
                  </div>
                  {children}
                </AuthenticatedLayout>
                <Toaster />
              </>
            )}
          </GoogleMapsProvider>
        </Providers>
      </ActiveThemeProvider>
    </ThemeProvider>
  );
}

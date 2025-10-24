"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/user/useUser";
import { Loader2 } from "lucide-react";
import { Navbar } from "./navbar";
import { useOnboardingCheck } from "@/hooks/onboarding/useOnboardingCheck";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useOnboardingCheck();

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fdf8f2]">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}

      <main className={`bg-[#fdf8f2] min-h-screen ${user ? "pt-16" : ""}`}>
        {children}
      </main>
    </>
  );
}
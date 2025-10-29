"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/user/useUser";
import { IconLogout } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user && user.businessProfile?.status !== "PENDING") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
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
    <div className="min-h-screen flex items-center justify-center">
      <Button className="fixed top-4 right-16 z-50" onClick={logout}>
        <IconLogout />
        Log out
      </Button>
      <Card className="w-full max-w-md text-center p-6">
        <CardHeader>
          <MailCheck className="mx-auto h-16 w-16 text-green-500" />
          <CardTitle className="mt-4 text-2xl">Application Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Thank you! Your business profile has been submitted and is currently
            under review. We will notify you once it has been approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

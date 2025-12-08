"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/user/useUser";
import { IconLogout } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle, AlertCircle, Mail, Eye, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ModeSwitcher } from "@/components/shared/ModeSwitcher";
import { deregisterDevice } from "@/api/notifications";
import { getFCMToken } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RejectedPage() {
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

    if (user && user.businessProfile?.status !== "REJECTED") {
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

  const adminNotes = user?.businessProfile?.adminNotes;
  const businessName = user?.businessProfile?.name || "your business";

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <ModeSwitcher />
        <Button onClick={logout} variant="outline">
          <IconLogout className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
      <Card className="w-full max-w-2xl text-center p-6">
        <CardHeader>
          <div className="mx-auto mb-3 flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/50">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="mt-2 text-2xl">Application Not Approved</CardTitle>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="destructive" className="text-xs">
              <XCircle className="h-3.5 w-3.5 mr-1" /> Status: Rejected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-300 text-base">
              We're sorry, but your business profile for <strong>{businessName}</strong> has not been approved at this time.
            </p>

            {adminNotes && (
              <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="mb-2">Reason for Rejection</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap text-sm">
                  {adminNotes}
                </AlertDescription>
              </Alert>
            )}

            {!adminNotes && (
              <Alert className="text-left border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertTitle className="mb-2 text-yellow-800 dark:text-yellow-200">
                  No specific reason provided
                </AlertTitle>
                <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please contact our support team for more information about why your application was not approved.
                </AlertDescription>
              </Alert>
            )}

            <div className="mx-auto w-full max-w-md rounded-md border bg-muted/30 p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium mb-2">What can you do next?</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground space-y-2">
                    <li>Review the rejection reason above and address any issues mentioned</li>
                    <li>Contact our support team if you need clarification or have questions</li>
                    <li>You can update your business profile and resubmit for review</li>
                    <li>Make sure all required documents and information are complete and accurate</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Link href="/onboarding/business/profile">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Eye className="h-4 w-4 mr-2" />
                  Review Profile
                </Button>
              </Link>
              <a href="mailto:support@urbanlens.app?subject=Business Application Rejection Inquiry" className="inline-flex">
                <Button variant="default" className="w-full sm:w-auto">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </a>
              <Link href="/onboarding/business/profile">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update & Resubmit
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error or have additional information to provide, please contact our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


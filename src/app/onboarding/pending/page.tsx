"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/user/useUser";
import { IconLogout } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MailCheck, Clock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed top-4 right-16 z-50 flex gap-2">
        <Button onClick={logout}>
          <IconLogout />
          Log out
        </Button>
      </div>
      <Card className="w-full max-w-xl text-center p-6">
        <CardHeader>
          <div className="mx-auto mb-3 flex items-center justify-center h-16 w-16 rounded-full bg-green-50">
            <MailCheck className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="mt-2 text-2xl">Application Submitted</CardTitle>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Status: Pending Review
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Thank you! Your business profile has been submitted and is currently under review.
              We’ll notify you via email once it’s approved.
            </p>

            <div className="mx-auto w-full max-w-md rounded-md border bg-muted/30 p-3 text-left">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">What happens next?</p>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    <li>Our team reviews your submission.</li>
                    <li>We may contact you if additional info is required.</li>
                    <li>You’ll receive an email once a decision is made.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
              <a href="mailto:support@urbanlens.app" className="inline-flex">
                <Button variant="ghost">Contact Support</Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

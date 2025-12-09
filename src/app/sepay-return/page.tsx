"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SepayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    // Invalidate all relevant queries when returning from payment
    // This ensures event data, bookings, and wallet data are refreshed
    queryClient.invalidateQueries({ queryKey: ['eventDetail'] });
    queryClient.invalidateQueries({ queryKey: ['eventLocationBookings'] });
    queryClient.invalidateQueries({ queryKey: ['wallet'] });
    queryClient.invalidateQueries({ queryKey: ['walletTransactions'] });
    queryClient.invalidateQueries({ queryKey: ['eventRequests'] });
    
    // Detect if user is on mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      return mobileRegex.test(userAgent.toLowerCase());
    };

    // Allow forcing mobile mode via query param for testing
    const forceMobile = searchParams.get("forceMobile") === "true";
    const mobile = forceMobile || checkMobile();
    setIsMobile(mobile);

    if (mobile) {
      // Deep link for mobile users
      const deepLink = "urbanlens://registered-user/wallet/deposit-status";
      
      // Try to redirect to deep link
      window.location.href = deepLink;
      setHasRedirected(true);

      // Fallback: if deep link doesn't work, show manual button after delay
      const fallbackTimer = setTimeout(() => {
        setShowManualButton(true);
      }, 2000);

      return () => clearTimeout(fallbackTimer);
    }
  }, [searchParams, queryClient]);

  const handleManualRedirect = () => {
    const deepLink = "urbanlens://registered-user/wallet/deposit-status";
    window.location.href = deepLink;
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        {isMobile ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Redirecting to UrbanLens...</h1>
              <p className="text-sm text-muted-foreground">
                {hasRedirected
                  ? "Opening the app..."
                  : "Please wait..."}
              </p>
            </div>
            {showManualButton && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  If the app didn't open automatically, click below:
                </p>
                <Button onClick={handleManualRedirect}>
                  Open UrbanLens App
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Payment Return</h1>
            <p className="text-sm text-muted-foreground">
              This page is designed for mobile users. Please access this page from your mobile device.
            </p>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">For testing:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/sepay-return?forceMobile=true";
                }}
              >
                Test Mobile Mode
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SepayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SepayReturnContent />
    </Suspense>
  );
}


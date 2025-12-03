"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useBrowserNotifications } from "@/hooks/notifications/useBrowserNotifications";
import { toast } from "sonner";

export function BrowserNotificationPrompt() {
  const { permission, isRequesting, requestPermission } = useBrowserNotifications(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setHasRequested(sessionStorage.getItem("notificationPermissionRequested") === "true");
      setIsSupported("Notification" in window);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Browser notifications enabled! You'll receive notifications even when the tab is not active.");
      sessionStorage.setItem("notificationPermissionRequested", "true");
      setHasRequested(true);
    } else if (permission === "denied") {
      toast.error("Notification permission was denied. Please enable it in your browser settings.");
    }
  };

  const getStatusBadge = () => {
    switch (permission) {
      case "granted":
        return (
          <Badge className="h-7 px-3 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Enabled
          </Badge>
        );
      case "denied":
        return (
          <Badge className="h-7 px-3 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-medium">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Denied
          </Badge>
        );
      default:
        return (
          <Badge className="h-7 px-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 font-medium">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Not Set
          </Badge>
        );
    }
  };

  // Show loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Browser Notifications</CardTitle>
                <CardDescription className="mt-1">
                  Receive notifications even when the tab is not active
                </CardDescription>
              </div>
            </div>
            <Badge className="h-7 px-3 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 font-medium">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Loading
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">
              Loading notification settings...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Browser Notifications</CardTitle>
                <CardDescription className="mt-1">
                  Not supported in this browser
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Your browser does not support browser notifications. Please use a modern browser like Chrome, Firefox, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Browser Notifications</CardTitle>
              <CardDescription className="mt-1">
                Receive notifications even when the tab is not active
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {permission === "granted" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                  Browser notifications are enabled
                </p>
                <p className="text-xs text-muted-foreground">
                  You'll receive Chrome notifications when new notifications arrive, even if this tab is not active.
                </p>
              </div>
            </div>
          </div>
        ) : permission === "denied" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                  Notification permission denied
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  To enable browser notifications, please:
                </p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions list</li>
                  <li>Change it from "Block" to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                Enable browser notifications to receive alerts even when this tab is not active. You'll get Chrome notifications for new messages and updates.
              </p>
              <Button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="w-full h-11 font-medium"
                size="lg"
              >
                {isRequesting ? (
                  <>
                    <Bell className="h-4 w-4 mr-2 animate-pulse" />
                    Requesting permission...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Browser Notifications
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


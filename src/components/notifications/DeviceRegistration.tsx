"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRegisterDevice } from "@/hooks/notifications/useRegisterDevice";
import { Bell, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function DeviceRegistration() {
  const [deviceToken, setDeviceToken] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState(false);
  const { mutate: registerDevice, isPending } = useRegisterDevice();

  useEffect(() => {
    // Check if device is already registered (you might want to store this in localStorage)
    const storedToken = localStorage.getItem("deviceToken");
    const registered = localStorage.getItem("deviceRegistered") === "true";
    
    if (storedToken && registered) {
      setDeviceToken(storedToken);
      setIsRegistered(true);
    } else {
      // Generate or get device token (in a real app, this would come from browser push API)
      const token = generateDeviceToken();
      setDeviceToken(token);
    }
  }, []);

  const generateDeviceToken = (): string => {
    // In a real application, this would come from the browser's Push API
    // For now, we'll generate a unique token
    let token = localStorage.getItem("deviceToken");
    if (!token) {
      token = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("deviceToken", token);
    }
    return token;
  };

  const handleRegister = () => {
    if (!deviceToken) {
      toast.error("Device token is required");
      return;
    }

    registerDevice(
      {
        token: deviceToken,
      },
      {
        onSuccess: () => {
          setIsRegistered(true);
          localStorage.setItem("deviceRegistered", "true");
          toast.success("Device registered successfully!");
        },
      }
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Device Registration</CardTitle>
              <CardDescription className="mt-1">
                Enable push notifications on this device
              </CardDescription>
            </div>
          </div>
          {isRegistered && (
            <Badge className="h-7 px-3 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Registered
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isRegistered ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">Device Token</span>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
                  {deviceToken}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                  Device registered successfully
                </p>
                <p className="text-xs text-muted-foreground">
                  Your device is ready to receive push notifications.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">Device Token</span>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border/50">
                <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
                  {deviceToken}
                </p>
              </div>
            </div>
            <Button
              onClick={handleRegister}
              disabled={isPending}
              className="w-full h-11 font-medium"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering device...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Register Device
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Register to receive real-time push notifications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/user/useUser";
import { getNotifications } from "@/api/notifications";

/**
 * Hook to request browser notification permissions and show notifications
 * when new notifications are received.
 */
export function useBrowserNotifications(enabled: boolean) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  // Initialize with "default" to match server-side rendering
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastNotificationIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }

    if (Notification.permission === "denied") {
      setPermission("denied");
      return false;
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // Check notification permission status and auto-request if not set
  // Only run after component has mounted to avoid hydration issues
  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Auto-request permission on first load if it's default (not granted or denied)
    // Only do this once per session
    if (currentPermission === "default" && enabled && user) {
      const hasRequested = sessionStorage.getItem("notificationPermissionRequested");
      if (!hasRequested) {
        // Small delay to avoid interrupting initial page load
        const timer = setTimeout(() => {
          requestPermission().then((granted) => {
            if (granted) {
              sessionStorage.setItem("notificationPermissionRequested", "true");
            }
          });
        }, 2000); // Wait 2 seconds after page load

        return () => clearTimeout(timer);
      }
    }
  }, [mounted, enabled, user, requestPermission]);

  // Show browser notification
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    // Don't show notification if tab is focused (to avoid duplicate with in-app notifications)
    if (document.hasFocus()) {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico", // You can customize this
        badge: "/favicon.ico",
        ...options,
      });

      // Close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click on notification
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  };

  // Poll for new notifications
  // Only run after component has mounted to avoid hydration issues
  useEffect(() => {
    if (!mounted || !enabled || !user || permission !== "granted") {
      return;
    }

    if (user.role !== "BUSINESS_OWNER" && user.role !== "EVENT_CREATOR") {
      return;
    }

    // Initial fetch to get the latest notification ID
    const initializeLastNotificationId = async () => {
      try {
        const data = await getNotifications({
          page: 1,
          limit: 1,
          sortBy: "createdAt:DESC",
        });
        if (data.data && data.data.length > 0) {
          lastNotificationIdRef.current = data.data[0].id;
        }
      } catch (error) {
        console.error("Error initializing notification polling:", error);
      }
    };

    initializeLastNotificationId();

    // Poll for new notifications every 30 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const data = await getNotifications({
          page: 1,
          limit: 5,
          status: "UNSEEN",
          sortBy: "createdAt:DESC",
        });

        if (data.data && data.data.length > 0) {
          // Find new notifications (not shown in this session)
          const newNotifications = data.data.filter((notification) => {
            // Skip if we've already shown this notification
            if (shownNotificationIdsRef.current.has(notification.id)) {
              return false;
            }
            // If we have a last notification ID, only show newer ones
            if (lastNotificationIdRef.current !== null) {
              return notification.id !== lastNotificationIdRef.current;
            }
            // First time, show all unseen notifications
            return true;
          });

          // Show browser notification for each new notification
          newNotifications.forEach((notification) => {
            // Mark as shown
            shownNotificationIdsRef.current.add(notification.id);
            
            showNotification(notification.payload.title || "New Notification", {
              body: notification.payload.body || "",
              tag: notification.id, // Prevent duplicate notifications
              data: {
                notificationId: notification.id,
                url: window.location.href,
              },
            });
          });

          // Update last notification ID to the most recent one
          if (data.data.length > 0) {
            lastNotificationIdRef.current = data.data[0].id;
          }

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      } catch (error) {
        console.error("Error polling for notifications:", error);
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [mounted, enabled, user, permission, queryClient]);

  return {
    permission,
    isRequesting,
    requestPermission,
    showNotification,
  };
}


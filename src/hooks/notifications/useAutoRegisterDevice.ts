"use client";

import { useEffect } from "react";
import { registerDevice } from "@/api/notifications";
import { getFCMToken } from "@/lib/firebase";

/**
 * Automatically registers the current browser as a notification device using Firebase Cloud Messaging.
 *
 * - Requests notification permission from the browser.
 * - Gets FCM token from Firebase.
 * - Always sends the token to `/v1/private/notifications/register-device` on every login.
 * - Backend handles duplicates gracefully (returns 200 if token already exists).
 *
 * This hook is meant to be used in authenticated areas of the app only.
 */
export function useAutoRegisterDevice(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    const registerFCMDevice = async () => {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission not granted");
          return;
        }

        // Get FCM token
        const fcmToken = await getFCMToken();
        if (!fcmToken) {
          console.warn("Failed to get FCM token");
          return;
        }

        // Always register the device with the backend on every login
        // Backend handles duplicates gracefully (returns 200 if token exists)
        await registerDevice({ token: fcmToken });

        localStorage.setItem("deviceRegistered", "true");

        console.log("FCM device registered successfully");
      } catch (error) {
        // Keep this silent for UX; surfaced only in console for debugging.
        // Registration can be attempted again on future visits.
        console.error("Failed to register FCM device:", error);
      }
    };

    registerFCMDevice();
  }, [enabled]);
}

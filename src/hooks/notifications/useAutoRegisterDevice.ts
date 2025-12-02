"use client";

import { useEffect } from "react";
import { registerDevice } from "@/api/notifications";

/**
 * Automatically registers the current browser as a notification device.
 *
 * - Generates a stable `deviceToken` stored in localStorage.
 * - Calls the secure `/v1/private/notifications/register-device` endpoint once.
 * - Marks `deviceRegistered` in localStorage on success.
 *
 * This hook is meant to be used in authenticated areas of the app only.
 */
export function useAutoRegisterDevice(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const authToken = localStorage.getItem("token");
    if (!authToken) return;

    const registered = localStorage.getItem("deviceRegistered") === "true";
    let deviceToken = localStorage.getItem("deviceToken");

    // Ensure we always have a stable device token
    if (!deviceToken) {
      deviceToken = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem("deviceToken", deviceToken);
    }

    if (registered || !deviceToken) return;

    registerDevice({ token: deviceToken })
      .then(() => {
        localStorage.setItem("deviceRegistered", "true");
      })
      .catch((error) => {
        // Keep this silent for UX; surfaced only in console for debugging.
        // Registration can be attempted again on future visits.
        // eslint-disable-next-line no-console
        console.error("Failed to register notification device", error);
      });
  }, [enabled]);
}

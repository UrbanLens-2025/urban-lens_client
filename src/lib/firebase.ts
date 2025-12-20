import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {

  apiKey: "AIzaSyC3Z6NOOgbY2Zt38WDupkfm91mCKJ9aB4k",

  authDomain: "urbanlens-main.firebaseapp.com",

  projectId: "urbanlens-main",

  storageBucket: "urbanlens-main.firebasestorage.app",

  messagingSenderId: "1045080059002",

  appId: "1:1045080059002:web:50d2eb55d796854de39fc3"

};

const VAPID_KEY = "BOTzgWgyVvJFfrplTV_8nPPE-PkHtOFG0trakzA-wn0dX8KNAHXW0dDlblystVTkXa0MJ1jW-vvy_4D3ejeuob8";

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Get the FCM token for the current browser.
 * Returns null if FCM is not supported or permission is denied.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Cloud Messaging is not supported in this browser");
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error: any) {
    // Handle permission-related errors gracefully (expected behavior)
    if (
      error?.code === "messaging/permission-blocked" ||
      error?.code === "messaging/permission-default" ||
      error?.code === "messaging/permission-denied"
    ) {
      // Permission was blocked/denied - this is expected behavior, no need to log
      return null;
    }
    
    // Log other unexpected errors
    console.error("Error getting FCM token:", error);
    return null;
  }
}


export const messaging = getMessaging(app);

export function listenForMessages(showToast: (data: any) => void) {
  onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    showToast(payload); // Your toast function
  });
}

export { app };


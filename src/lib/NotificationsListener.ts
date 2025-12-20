'use client';

import { useEffect } from 'react';
import { listenForMessages } from '@/lib/firebase';
import { toast } from 'sonner';

export default function NotificationListener() {
  useEffect(() => {
    listenForMessages((payload) => {
      toast(payload.notification?.title, {
        description: payload.notification?.body,
        // Add click handler if needed
      });
    });
  }, []);

  return null;
}
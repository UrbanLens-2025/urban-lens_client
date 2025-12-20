'use client';

import { useEffect } from 'react';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { toast } from 'sonner';

export default function NotificationListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message:', payload);
      
      toast(payload.notification?.title || 'New notification', {
        className: '',
        description: payload.notification?.body || '',
        icon: '🔔',
        duration: 5000,
        richColors: false,
        position: 'top-center', 
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
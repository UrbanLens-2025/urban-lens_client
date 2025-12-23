'use client';

import { useEffect } from 'react';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationListener() {
  const queryClient = useQueryClient();

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

      queryClient.invalidateQueries({exact: false, queryKey: ['notifications']});
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return null;
}
"use client";

import { DeviceRegistration } from "@/components/notifications/DeviceRegistration";
import { NotificationList } from "@/components/notifications/NotificationList";

export default function CreatorNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Manage your push notifications and device registration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotificationList />
        </div>
        <div>
          <DeviceRegistration />
        </div>
      </div>
    </div>
  );
}


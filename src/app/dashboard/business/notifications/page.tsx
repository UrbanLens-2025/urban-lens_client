"use client";

import { NotificationList } from "@/components/notifications/NotificationList";

export default function BusinessNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-2">
          View your latest notifications.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NotificationList />
        </div>
      </div>
    </div>
  );
}


"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Ticket, Megaphone, Globe } from "lucide-react";
import Link from "next/link";

export default function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Event Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href={`/dashboard/creator/event-form/edit/${eventId}`}>
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-start gap-3">
                  <Edit className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Edit Event Details</p>
                    <p className="text-xs text-muted-foreground">Update name, description, dates, and more</p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={`/dashboard/creator/events/${eventId}/tickets/create`}>
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-start gap-3">
                  <Ticket className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Manage Tickets</p>
                    <p className="text-xs text-muted-foreground">Create and edit ticket types</p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href={`/dashboard/creator/events/${eventId}/announcements`}>
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <div className="flex items-start gap-3">
                  <Megaphone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Announcements</p>
                    <p className="text-xs text-muted-foreground">Send updates to attendees</p>
                  </div>
                </div>
              </Button>
            </Link>

            <Button variant="outline" className="w-full justify-start h-auto py-4" disabled>
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Visibility Settings</p>
                  <p className="text-xs text-muted-foreground">Control who can see your event</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Ticket, Megaphone, Globe, AlertCircle, XCircle, Scale } from "lucide-react";
import Link from "next/link";
import { useEventTabs } from "@/contexts/EventTabContext";
import { useEventById } from "@/hooks/events/useEventById";
import { CancelEventDialog } from "@/app/dashboard/creator/events/[eventId]/settings/_components/CancelEventDialog";

export default function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { openEditEventTab } = useEventTabs();
  const { data: event, isLoading: isEventLoading } = useEventById(eventId);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const isEventCancelled = event?.status?.toUpperCase() === "CANCELLED";
  const hasEventStarted = event?.startDate
    ? Date.now() >= new Date(event.startDate).getTime()
    : false;
  const isCancelEventDisabled = isEventLoading || isEventCancelled || hasEventStarted;

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
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
              disabled={isEventCancelled}
              onClick={(e) => {
                e.preventDefault();
                if (event) {
                  openEditEventTab(event.displayName);
                  router.push(`/dashboard/creator/events/${eventId}/edit`);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <Edit className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Edit Event Details</p>
                  <p className="text-xs text-muted-foreground">Update name, description, dates, and more</p>
                </div>
              </div>
            </Button>

            <Link href={`/dashboard/creator/events/${eventId}/tickets/create`}>
              <Button variant="outline" className="w-full justify-start h-auto py-4" disabled={isEventCancelled}>
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
              <Button variant="outline" className="w-full justify-start h-auto py-4" disabled={isEventCancelled}>
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

            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
              disabled={isEventCancelled}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/dashboard/creator/events/${eventId}/penalties`);
              }}
            >
              <div className="flex items-start gap-3">
                <Scale className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Penalties</p>
                  <p className="text-xs text-muted-foreground">Manage event penalties</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {!isEventCancelled && (
        <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-2">
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-1">Cancel Event</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Once you cancel an event, this action cannot be undone. All bookings and tickets will be cancelled, and refunds will be processed according to your refund policy.
                </p>
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="w-full sm:w-auto"
                  disabled={isCancelEventDisabled}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Event
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Cancel Event Dialog */}
      <CancelEventDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        eventId={eventId}
        onCancelled={() => {
          router.refresh();
        }}
      />
    </div>
  );
}


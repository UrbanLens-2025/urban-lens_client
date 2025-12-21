"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit, Ticket, Users, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventWelcomeModalProps {
  eventId: string;
  eventName: string;
  eventStatus?: string;
}

export function EventWelcomeModal({ eventId, eventName, eventStatus }: EventWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only show modal if event status is DRAFT
    const isDraft = eventStatus?.toUpperCase() === "DRAFT";
    
    if (!isDraft) {
      return;
    }

    // Check if user has seen this modal for this event
    const hasSeenModal = localStorage.getItem(`event-welcome-${eventId}`);
    
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, [eventId, eventStatus]);

  const handleClose = () => {
    // Mark this event as seen
    localStorage.setItem(`event-welcome-${eventId}`, "true");
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    router.push(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Welcome to Your Event!</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {eventName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/50 rounded-lg p-3 border">
            <p className="text-sm text-foreground leading-relaxed">
              Your event is saved as Draft. Add visuals, configure tickets, and complete setup before publishing.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-xs mb-2 text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNavigate(`/dashboard/creator/event-form/edit/${eventId}`)}
                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="text-xs font-medium">Edit Event</span>
              </button>

              <button
                onClick={() => handleNavigate(`/dashboard/creator/ticket-form/create/${eventId}`)}
                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <Ticket className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-xs font-medium">Create Tickets</span>
              </button>

              <button
                onClick={() => handleNavigate(`/dashboard/creator/events/${eventId}/tickets`)}
                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-medium">Manage Tickets</span>
              </button>

              <button
                onClick={() => handleNavigate(`/dashboard/creator/events/${eventId}/settings`)}
                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <Settings className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-xs font-medium">Settings</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Explore on My Own
          </Button>
          <Button
            onClick={() => handleNavigate(`/dashboard/creator/events/${eventId}/edit`)}
            className="w-full sm:w-auto"
          >
            Start Editing Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


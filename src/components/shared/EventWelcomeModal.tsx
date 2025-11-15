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
}

export function EventWelcomeModal({ eventId, eventName }: EventWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has seen this modal for this event
    const hasSeenModal = localStorage.getItem(`event-welcome-${eventId}`);
    
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, [eventId]);

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
      <DialogContent className="sm:max-w-[600px]">
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

        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm text-foreground leading-relaxed">
              Your event has been successfully created based on your event request. 
              We&apos;ve pre-filled the details to get you started quickly. You can review 
              and customize everything to match your vision.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              Recommended Next Steps
            </h4>
            <div className="space-y-3">
              <button
                onClick={() => handleNavigate(`/dashboard/creator/event-form/edit/${eventId}`)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                  <Edit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Review Event Details</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize your event information, description, and settings
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate(`/dashboard/creator/ticket-form/create/${eventId}`)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Create Ticket Types</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set up pricing, availability, and ticket options for your attendees
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate(`/dashboard/creator/events/${eventId}/tickets`)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Manage Tickets</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View and manage all your ticket types in one place
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate(`/dashboard/creator/events/${eventId}/settings`)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition-colors">
                  <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Configure Settings</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adjust visibility, announcements, and advanced options
                  </p>
                </div>
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


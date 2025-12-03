"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarkNotificationAsSeen } from "@/hooks/notifications/useMarkNotificationAsSeen";
import { Notification } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsSeen?: () => void;
}

export function NotificationItem({ notification, onMarkAsSeen }: NotificationItemProps) {
  const { mutate: markAsSeen, isPending } = useMarkNotificationAsSeen();
  const [isHovered, setIsHovered] = useState(false);
  const isUnseen = notification.status === "UNSEEN";

  const handleMarkAsSeen = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isUnseen) {
      markAsSeen(notification.id.toString(), {
        onSuccess: () => {
          onMarkAsSeen?.();
        },
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
        "hover:bg-accent/50 hover:border-accent-foreground/20",
        isUnseen
          ? "bg-primary/5 border-primary/20"
          : "bg-background border-border/50",
        "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isUnseen && handleMarkAsSeen()}
    >
      {/* Unread indicator dot */}
      {isUnseen && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      )}

      {/* Avatar/Image */}
      <div className="relative flex-shrink-0">
        {notification.payload.imageUrl ? (
          <div className="relative">
            <img
              src={notification.payload.imageUrl}
              alt={notification.payload.title}
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-background"
            />
            {isUnseen && (
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            )}
          </div>
        ) : (
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              isUnseen
                ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Bell className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-semibold text-sm leading-tight mb-0.5",
                isUnseen ? "text-foreground" : "text-foreground/90"
              )}
            >
              {notification.payload.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {notification.payload.body}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUnseen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleMarkAsSeen}
                disabled={isPending}
                title="Mark as read"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Add dismiss/delete functionality
              }}
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">
              {timeAgo}
            </span>
            {isUnseen && (
              <Badge
                variant="secondary"
                className="h-4 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-primary/20"
              >
                New
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


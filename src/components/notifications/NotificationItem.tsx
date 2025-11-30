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
        "group relative flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
        "hover:bg-accent/50 hover:border-accent-foreground/20 hover:shadow-sm",
        isUnseen
          ? "bg-primary/5 border-primary/20 shadow-sm"
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
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}

      {/* Avatar/Image */}
      <div className="relative flex-shrink-0">
        {notification.payload.imageUrl ? (
          <div className="relative">
            <img
              src={notification.payload.imageUrl}
              alt={notification.payload.title}
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-background shadow-sm"
            />
            {isUnseen && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
            )}
          </div>
        ) : (
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
              isUnseen
                ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Bell className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-semibold text-base leading-tight mb-0.5",
                isUnseen ? "text-foreground" : "text-foreground/90"
              )}
            >
              {notification.payload.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {notification.payload.body}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUnseen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleMarkAsSeen}
                disabled={isPending}
                title="Mark as read"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Add dismiss/delete functionality
              }}
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {timeAgo}
            </span>
            {isUnseen && (
              <Badge
                variant="secondary"
                className="h-5 px-2 text-xs font-medium bg-primary/10 text-primary border-primary/20"
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


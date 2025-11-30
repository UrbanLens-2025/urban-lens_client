"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Bell, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export function NotificationList() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Reset page to 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Fetch filtered notifications based on current tab
  const { data, isLoading, refetch } = useNotifications({
    page,
    limit: 20,
    sortBy: "createdAt:DESC",
    status: filter === "all" ? undefined : filter === "read" ? "SEEN" : "UNSEEN",
  });

  // Fetch all unread notifications to get accurate unread count
  const { data: unreadData } = useNotifications({
    page: 1,
    limit: 1000, // Get a large number to count all unread
    sortBy: "createdAt:DESC",
    status: "UNSEEN", // Only unread
  });

  // Fetch all seen notifications for the read tab
  const { data: readData, isLoading: isLoadingRead } = useNotifications({
    page,
    limit: 20,
    sortBy: "createdAt:DESC",
    status: "SEEN",
  });

  // Fetch all notifications for the all tab
  const { data: allData, isLoading: isLoadingAll } = useNotifications({
    page,
    limit: 20,
    sortBy: "createdAt:DESC",
    status: undefined,
  });

  // Get the appropriate data based on current filter
  const getCurrentNotifications = () => {
    if (filter === "read") {
      return readData?.data || [];
    } else if (filter === "unread") {
      return data?.data || [];
    } else {
      return allData?.data || [];
    }
  };

  const getCurrentMeta = () => {
    if (filter === "read") {
      return readData?.meta;
    } else if (filter === "unread") {
      return data?.meta;
    } else {
      return allData?.meta;
    }
  };

  const getCurrentLoading = () => {
    if (filter === "read") {
      return isLoadingRead;
    } else if (filter === "unread") {
      return isLoading;
    } else {
      return isLoadingAll;
    }
  };

  const notifications = getCurrentNotifications();
  const meta = getCurrentMeta();
  const isLoadingCurrent = getCurrentLoading();
  const totalUnreadCount = unreadData?.meta?.totalItems || 0;

  const handleRefresh = () => {
    refetch();
  };

  const handleMarkAsSeen = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              {totalUnreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center border-2 border-background">
                  <span className="text-[10px] font-bold text-destructive-foreground">
                    {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                  </span>
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Notifications</CardTitle>
              <CardDescription className="mt-1">
                {totalUnreadCount > 0 ? (
                  <span className="text-sm font-medium text-primary">
                    {totalUnreadCount} unread {totalUnreadCount === 1 ? "notification" : "notifications"}
                  </span>
                ) : (
                  <span className="text-sm">All caught up!</span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={handleRefresh}
            disabled={isLoadingCurrent}
            title="Refresh notifications"
          >
            <RefreshCw className={cn("h-4 w-4", isLoadingCurrent && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="all" 
              className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium text-sm"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="unread" 
              className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium text-sm relative"
            >
              Unread
              {totalUnreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="read" 
              className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium text-sm"
            >
              Read
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            {isLoadingCurrent ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsSeen={handleMarkAsSeen}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="unread" className="mt-6">
            {isLoadingCurrent ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-base font-semibold mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You don't have any unread notifications right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsSeen={handleMarkAsSeen}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="read" className="mt-6">
            {isLoadingCurrent ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">No read notifications</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Notifications you've read will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsSeen={handleMarkAsSeen}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground font-medium">
              Showing page {meta.currentPage} of {meta.totalPages} • {meta.totalItems} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoadingCurrent}
                className="h-9"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages || isLoadingCurrent}
                className="h-9"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


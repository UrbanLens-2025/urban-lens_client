"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface EventTabContextType {
  ticketDetailsTab: {
    isOpen: boolean;
    ticketId: string | null;
    ticketName: string | null;
  };
  openTicketDetailsTab: (ticketId: string, ticketName: string) => void;
  closeTicketDetailsTab: () => void;
  ticketCreateTab: {
    isOpen: boolean;
  };
  openTicketCreateTab: () => void;
  closeTicketCreateTab: () => void;
  announcementTab: {
    isOpen: boolean;
    mode: "create" | "edit" | null;
    announcementId: string | null;
    announcementName: string | null;
  };
  openAnnouncementTab: (mode: "create" | "edit", announcementId?: string, announcementName?: string) => void;
  closeAnnouncementTab: () => void;
  editEventTab: {
    isOpen: boolean;
    eventName: string | null;
  };
  openEditEventTab: (eventName: string) => void;
  closeEditEventTab: () => void;
}

const EventTabContext = createContext<EventTabContextType | undefined>(undefined);

export function EventTabProvider({ children }: { children: ReactNode }) {
  const [ticketDetailsTab, setTicketDetailsTab] = useState<{
    isOpen: boolean;
    ticketId: string | null;
    ticketName: string | null;
  }>({
    isOpen: false,
    ticketId: null,
    ticketName: null,
  });

  const [ticketCreateTab, setTicketCreateTab] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const [announcementTab, setAnnouncementTab] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | null;
    announcementId: string | null;
    announcementName: string | null;
  }>({
    isOpen: false,
    mode: null,
    announcementId: null,
    announcementName: null,
  });

  const [editEventTab, setEditEventTab] = useState<{
    isOpen: boolean;
    eventName: string | null;
  }>({
    isOpen: false,
    eventName: null,
  });

  const openTicketDetailsTab = useCallback((ticketId: string, ticketName: string) => {
    setTicketDetailsTab({
      isOpen: true,
      ticketId,
      ticketName,
    });
  }, []);

  const closeTicketDetailsTab = useCallback(() => {
    setTicketDetailsTab({
      isOpen: false,
      ticketId: null,
      ticketName: null,
    });
  }, []);

  const openTicketCreateTab = useCallback(() => {
    setTicketCreateTab({
      isOpen: true,
    });
  }, []);

  const closeTicketCreateTab = useCallback(() => {
    setTicketCreateTab({
      isOpen: false,
    });
  }, []);

  const openAnnouncementTab = useCallback((mode: "create" | "edit", announcementId?: string, announcementName?: string) => {
    setAnnouncementTab({
      isOpen: true,
      mode,
      announcementId: announcementId || null,
      announcementName: announcementName || null,
    });
  }, []);

  const closeAnnouncementTab = useCallback(() => {
    setAnnouncementTab({
      isOpen: false,
      mode: null,
      announcementId: null,
      announcementName: null,
    });
  }, []);

  const openEditEventTab = useCallback((eventName: string) => {
    setEditEventTab({
      isOpen: true,
      eventName,
    });
  }, []);

  const closeEditEventTab = useCallback(() => {
    setEditEventTab({
      isOpen: false,
      eventName: null,
    });
  }, []);

  return (
    <EventTabContext.Provider
      value={{
        ticketDetailsTab,
        openTicketDetailsTab,
        closeTicketDetailsTab,
        ticketCreateTab,
        openTicketCreateTab,
        closeTicketCreateTab,
        announcementTab,
        openAnnouncementTab,
        closeAnnouncementTab,
        editEventTab,
        openEditEventTab,
        closeEditEventTab,
      }}
    >
      {children}
    </EventTabContext.Provider>
  );
}

export function useEventTabs() {
  const context = useContext(EventTabContext);
  if (context === undefined) {
    throw new Error("useEventTabs must be used within an EventTabProvider");
  }
  return context;
}


"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface EventTabContextType {
  ticketDetailsTab: {
    isOpen: boolean;
    ticketId: string | null;
    ticketName: string | null;
  };
  openTicketDetailsTab: (ticketId: string, ticketName: string) => void;
  closeTicketDetailsTab: () => void;
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

  const openTicketDetailsTab = (ticketId: string, ticketName: string) => {
    setTicketDetailsTab({
      isOpen: true,
      ticketId,
      ticketName,
    });
  };

  const closeTicketDetailsTab = () => {
    setTicketDetailsTab({
      isOpen: false,
      ticketId: null,
      ticketName: null,
    });
  };

  return (
    <EventTabContext.Provider
      value={{
        ticketDetailsTab,
        openTicketDetailsTab,
        closeTicketDetailsTab,
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


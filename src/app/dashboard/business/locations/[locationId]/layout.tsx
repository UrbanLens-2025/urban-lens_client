"use client";

import { LocationTabProvider } from "@/contexts/LocationTabContext";

export default function LocationDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LocationTabProvider>{children}</LocationTabProvider>;
}


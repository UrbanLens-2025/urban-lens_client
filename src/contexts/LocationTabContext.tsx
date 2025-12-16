"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LocationTabContextType {
  voucherCreateTab: {
    isOpen: boolean;
  };
  openVoucherCreateTab: () => void;
  closeVoucherCreateTab: () => void;
  voucherEditTab: {
    isOpen: boolean;
    voucherId: string | null;
    voucherName: string | null;
  };
  openVoucherEditTab: (voucherId: string, voucherName: string) => void;
  closeVoucherEditTab: () => void;
  voucherDetailTab: {
    isOpen: boolean;
    voucherId: string | null;
    voucherName: string | null;
  };
  openVoucherDetailTab: (voucherId: string, voucherName: string) => void;
  closeVoucherDetailTab: () => void;
  missionCreateTab: {
    isOpen: boolean;
  };
  openMissionCreateTab: () => void;
  closeMissionCreateTab: () => void;
  missionEditTab: {
    isOpen: boolean;
    missionId: string | null;
    missionName: string | null;
  };
  openMissionEditTab: (missionId: string, missionName: string) => void;
  closeMissionEditTab: () => void;
  missionDetailTab: {
    isOpen: boolean;
    missionId: string | null;
    missionName: string | null;
  };
  openMissionDetailTab: (missionId: string, missionName: string) => void;
  closeMissionDetailTab: () => void;
  announcementCreateTab: {
    isOpen: boolean;
  };
  openAnnouncementCreateTab: () => void;
  closeAnnouncementCreateTab: () => void;
  announcementEditTab: {
    isOpen: boolean;
    announcementId: string | null;
    announcementName: string | null;
  };
  openAnnouncementEditTab: (announcementId: string, announcementName: string) => void;
  closeAnnouncementEditTab: () => void;
  announcementDetailTab: {
    isOpen: boolean;
    announcementId: string | null;
    announcementName: string | null;
  };
  openAnnouncementDetailTab: (announcementId: string, announcementName: string) => void;
  closeAnnouncementDetailTab: () => void;
}

const LocationTabContext = createContext<LocationTabContextType | undefined>(undefined);

export function LocationTabProvider({ children }: { children: ReactNode }) {
  const [voucherCreateTab, setVoucherCreateTab] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const [voucherEditTab, setVoucherEditTab] = useState<{
    isOpen: boolean;
    voucherId: string | null;
    voucherName: string | null;
  }>({
    isOpen: false,
    voucherId: null,
    voucherName: null,
  });

  const [missionCreateTab, setMissionCreateTab] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const [missionEditTab, setMissionEditTab] = useState<{
    isOpen: boolean;
    missionId: string | null;
    missionName: string | null;
  }>({
    isOpen: false,
    missionId: null,
    missionName: null,
  });

  const [voucherDetailTab, setVoucherDetailTab] = useState<{
    isOpen: boolean;
    voucherId: string | null;
    voucherName: string | null;
  }>({
    isOpen: false,
    voucherId: null,
    voucherName: null,
  });

  const [missionDetailTab, setMissionDetailTab] = useState<{
    isOpen: boolean;
    missionId: string | null;
    missionName: string | null;
  }>({
    isOpen: false,
    missionId: null,
    missionName: null,
  });

  const [announcementCreateTab, setAnnouncementCreateTab] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  const [announcementEditTab, setAnnouncementEditTab] = useState<{
    isOpen: boolean;
    announcementId: string | null;
    announcementName: string | null;
  }>({
    isOpen: false,
    announcementId: null,
    announcementName: null,
  });

  const [announcementDetailTab, setAnnouncementDetailTab] = useState<{
    isOpen: boolean;
    announcementId: string | null;
    announcementName: string | null;
  }>({
    isOpen: false,
    announcementId: null,
    announcementName: null,
  });

  const openVoucherCreateTab = useCallback(() => {
    setVoucherCreateTab({
      isOpen: true,
    });
  }, []);

  const closeVoucherCreateTab = useCallback(() => {
    setVoucherCreateTab({
      isOpen: false,
    });
  }, []);

  const openVoucherEditTab = useCallback((voucherId: string, voucherName: string) => {
    setVoucherEditTab({
      isOpen: true,
      voucherId,
      voucherName,
    });
  }, []);

  const closeVoucherEditTab = useCallback(() => {
    setVoucherEditTab({
      isOpen: false,
      voucherId: null,
      voucherName: null,
    });
  }, []);

  const openMissionCreateTab = useCallback(() => {
    setMissionCreateTab({
      isOpen: true,
    });
  }, []);

  const closeMissionCreateTab = useCallback(() => {
    setMissionCreateTab({
      isOpen: false,
    });
  }, []);

  const openMissionEditTab = useCallback((missionId: string, missionName: string) => {
    setMissionEditTab({
      isOpen: true,
      missionId,
      missionName,
    });
  }, []);

  const closeMissionEditTab = useCallback(() => {
    setMissionEditTab({
      isOpen: false,
      missionId: null,
      missionName: null,
    });
  }, []);

  const openVoucherDetailTab = useCallback((voucherId: string, voucherName: string) => {
    setVoucherDetailTab({
      isOpen: true,
      voucherId,
      voucherName,
    });
  }, []);

  const closeVoucherDetailTab = useCallback(() => {
    setVoucherDetailTab({
      isOpen: false,
      voucherId: null,
      voucherName: null,
    });
  }, []);

  const openMissionDetailTab = useCallback((missionId: string, missionName: string) => {
    setMissionDetailTab({
      isOpen: true,
      missionId,
      missionName,
    });
  }, []);

  const closeMissionDetailTab = useCallback(() => {
    setMissionDetailTab({
      isOpen: false,
      missionId: null,
      missionName: null,
    });
  }, []);

  const openAnnouncementCreateTab = useCallback(() => {
    setAnnouncementCreateTab({
      isOpen: true,
    });
  }, []);

  const closeAnnouncementCreateTab = useCallback(() => {
    setAnnouncementCreateTab({
      isOpen: false,
    });
  }, []);

  const openAnnouncementEditTab = useCallback((announcementId: string, announcementName: string) => {
    setAnnouncementEditTab({
      isOpen: true,
      announcementId,
      announcementName,
    });
  }, []);

  const closeAnnouncementEditTab = useCallback(() => {
    setAnnouncementEditTab({
      isOpen: false,
      announcementId: null,
      announcementName: null,
    });
  }, []);

  const openAnnouncementDetailTab = useCallback((announcementId: string, announcementName: string) => {
    setAnnouncementDetailTab({
      isOpen: true,
      announcementId,
      announcementName,
    });
  }, []);

  const closeAnnouncementDetailTab = useCallback(() => {
    setAnnouncementDetailTab({
      isOpen: false,
      announcementId: null,
      announcementName: null,
    });
  }, []);

  return (
    <LocationTabContext.Provider
      value={{
        voucherCreateTab,
        openVoucherCreateTab,
        closeVoucherCreateTab,
        voucherEditTab,
        openVoucherEditTab,
        closeVoucherEditTab,
        voucherDetailTab,
        openVoucherDetailTab,
        closeVoucherDetailTab,
        missionCreateTab,
        openMissionCreateTab,
        closeMissionCreateTab,
        missionEditTab,
        openMissionEditTab,
        closeMissionEditTab,
        missionDetailTab,
        openMissionDetailTab,
        closeMissionDetailTab,
        announcementCreateTab,
        openAnnouncementCreateTab,
        closeAnnouncementCreateTab,
        announcementEditTab,
        openAnnouncementEditTab,
        closeAnnouncementEditTab,
        announcementDetailTab,
        openAnnouncementDetailTab,
        closeAnnouncementDetailTab,
      }}
    >
      {children}
    </LocationTabContext.Provider>
  );
}

export function useLocationTabs() {
  const context = useContext(LocationTabContext);
  if (context === undefined) {
    throw new Error("useLocationTabs must be used within a LocationTabProvider");
  }
  return context;
}


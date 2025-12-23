"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { useEventById } from "@/hooks/events/useEventById";
import { useEventOrderByOrderCode } from "@/hooks/events/useEventOrderByOrderCode";
import { useConfirmAttendanceV2 } from "@/hooks/events/useConfirmAttendanceV2";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  QrCode,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  User,
  ScanLine,
  RotateCcw,
  Ticket,
  CreditCard,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  TicketCheck,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Order, OrderEventAttendance } from "@/types";
import Image from "next/image";

// Format relative time
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
};

const formatCurrency = (amount: number, currency: string) => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Helper to get attendance status display
const getAttendanceStatusInfo = (status: string, checkedInAt: string | null) => {
  const isCheckedIn = status.toUpperCase() === "ATTENDED" || checkedInAt !== null;
  return {
    isCheckedIn,
    label: isCheckedIn ? "Checked In" : "Take Attendance",
    className: isCheckedIn
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
};

// Group attendances by ticket
interface GroupedAttendance {
  ticketId: string;
  ticketName: string;
  attendances: OrderEventAttendance[];
  allCheckedIn: boolean;
  checkedInCount: number;
  totalCount: number;
}

const groupAttendancesByTicket = (
  attendances: OrderEventAttendance[] | undefined,
  orderDetails: Order['orderDetails']
): GroupedAttendance[] => {
  if (!attendances || attendances.length === 0) return [];

  // Create a map to group attendances
  const groupMap = new Map<string, OrderEventAttendance[]>();

  attendances.forEach((attendance) => {
    const existing = groupMap.get(attendance.ticketId) || [];
    groupMap.set(attendance.ticketId, [...existing, attendance]);
  });

  // Convert to array and enrich with ticket info
  const groups: GroupedAttendance[] = [];

  groupMap.forEach((attendanceList, ticketId) => {
    // Find ticket name from orderDetails
    const orderDetail = orderDetails.find((d) => d.ticketId === ticketId);
    const ticketName = orderDetail?.ticketSnapshot?.displayName
      || orderDetail?.ticket?.displayName
      || "Unknown Ticket";

    // Sort: not checked in first, then checked in
    const sortedAttendances = [...attendanceList].sort((a, b) => {
      const aCheckedIn = a.status.toUpperCase() === "ATTENDED" || a.checkedInAt !== null;
      const bCheckedIn = b.status.toUpperCase() === "ATTENDED" || b.checkedInAt !== null;
      if (aCheckedIn === bCheckedIn) return 0;
      return aCheckedIn ? 1 : -1;
    });

    const checkedInCount = sortedAttendances.filter(
      (a) => a.status.toUpperCase() === "ATTENDED" || a.checkedInAt !== null
    ).length;

    groups.push({
      ticketId,
      ticketName,
      attendances: sortedAttendances,
      allCheckedIn: checkedInCount === sortedAttendances.length,
      checkedInCount,
      totalCount: sortedAttendances.length,
    });
  });

  // Sort groups: groups with unchecked attendees first
  return groups.sort((a, b) => {
    if (a.allCheckedIn === b.allCheckedIn) return 0;
    return a.allCheckedIn ? 1 : -1;
  });
};

export default function QRScanPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannedOrderNumber, setScannedOrderNumber] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedAttendances, setSelectedAttendances] = useState<Set<string>>(new Set());
  const [showCheckInConfirm, setShowCheckInConfirm] = useState(false);

  const { data: event, isLoading: isLoadingEvent } = useEventById(eventId);
  const { data: orderData, isLoading: isLoadingOrder, error: orderError, refetch: refetchOrder } = useEventOrderByOrderCode(eventId, scannedOrderNumber);
  const confirmAttendance = useConfirmAttendanceV2(eventId);

  // Group attendances by ticket
  const groupedAttendances = useMemo(() => {
    if (!orderData) return [];
    return groupAttendancesByTicket(orderData.eventAttendances, orderData.orderDetails);
  }, [orderData]);

  // Auto-collapse groups where all are checked in
  useEffect(() => {
    if (groupedAttendances.length > 0) {
      const autoCollapse = new Set<string>();
      groupedAttendances.forEach((group) => {
        if (group.allCheckedIn) {
          autoCollapse.add(group.ticketId);
        }
      });
      setCollapsedGroups(autoCollapse);
    }
  }, [groupedAttendances]);

  const toggleGroupCollapse = (ticketId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const toggleAttendanceSelection = (attendanceId: string) => {
    setSelectedAttendances((prev) => {
      const next = new Set(prev);
      if (next.has(attendanceId)) {
        next.delete(attendanceId);
      } else {
        next.add(attendanceId);
      }
      return next;
    });
  };

  const selectAllInGroup = (group: GroupedAttendance) => {
    const uncheckedIds = group.attendances
      .filter((a) => a.status.toUpperCase() !== "ATTENDED" && !a.checkedInAt)
      .map((a) => a.id);

    setSelectedAttendances((prev) => {
      const next = new Set(prev);
      uncheckedIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const deselectAllInGroup = (group: GroupedAttendance) => {
    const groupIds = group.attendances.map((a) => a.id);
    setSelectedAttendances((prev) => {
      const next = new Set(prev);
      groupIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleCheckInClick = () => {
    if (selectedAttendances.size === 0) return;
    setShowCheckInConfirm(true);
  };

  const handleConfirmCheckIn = async () => {
    if (selectedAttendances.size === 0 || !orderData) return;

    try {
      await confirmAttendance.mutateAsync({
        eventAttendanceIds: Array.from(selectedAttendances),
        ticketOrderId: orderData.id,
      });
      setSelectedAttendances(new Set());
      setShowCheckInConfirm(false);
      refetchOrder();
    } catch {
      // Error is handled by the hook
      setShowCheckInConfirm(false);
    }
  };

  const getSelectedCountInGroup = (group: GroupedAttendance) => {
    return group.attendances.filter((a) => selectedAttendances.has(a.id)).length;
  };

  const getUncheckedCountInGroup = (group: GroupedAttendance) => {
    return group.attendances.filter(
      (a) => a.status.toUpperCase() !== "ATTENDED" && !a.checkedInAt
    ).length;
  };

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const element = document.getElementById("qr-reader");
      if (element) {
        const rect = element.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    if (isScanning) {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      window.addEventListener("orientationchange", updateDimensions);

      // Delay for orientation change to complete
      const orientationTimer = setTimeout(updateDimensions, 200);

      return () => {
        window.removeEventListener("resize", updateDimensions);
        window.removeEventListener("orientationchange", updateDimensions);
        clearTimeout(orientationTimer);
      };
    }
  }, [isScanning]);

  // Restart scanner on significant dimension change (e.g., orientation change)
  useEffect(() => {
    if (containerDimensions && isScanning && html5QrCodeRef.current && !isStarting) {
      const lastDim = lastDimensionsRef.current;

      // Only restart if dimensions changed significantly (more than 10% difference)
      if (lastDim) {
        const widthDiff = Math.abs(containerDimensions.width - lastDim.width) / lastDim.width;
        const heightDiff = Math.abs(containerDimensions.height - lastDim.height) / lastDim.height;

        // If significant change (likely orientation change), restart scanner
        if (widthDiff > 0.1 || heightDiff > 0.1) {
          const restartTimer = setTimeout(() => {
            if (html5QrCodeRef.current && isScanning) {
              console.log("Restarting scanner due to dimension change");
              stopScanner();
              setTimeout(() => {
                if (!html5QrCodeRef.current) {
                  startScanner();
                }
              }, 500);
            }
          }, 800); // Debounce dimension changes

          lastDimensionsRef.current = containerDimensions;
          return () => clearTimeout(restartTimer);
        }
      } else {
        // First time setting dimensions
        lastDimensionsRef.current = containerDimensions;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerDimensions]);

  // Start scanner when element is ready
  useEffect(() => {
    if (isScanning && isStarting && !html5QrCodeRef.current) {
      const timer = setTimeout(() => {
        // Double-check element exists
        const element = document.getElementById("qr-reader");
        if (element) {
          initializeScanner();
        } else {
          // Retry if element not found
          console.warn("QR reader element not found, retrying...");
          setTimeout(() => {
            const retryElement = document.getElementById("qr-reader");
            if (retryElement) {
              initializeScanner();
            } else {
              setCameraError("Scanner element not found. Please refresh the page.");
              setIsScanning(false);
              setIsStarting(false);
            }
          }, 200);
        }
      }, 300); // Wait for DOM to render

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, isStarting]);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current?.clear();
          })
          .catch(() => { });
      }
    };
  }, []);

  // Handle order error
  useEffect(() => {
    if (orderError) {
      const errorMessage = (orderError as any)?.response?.data?.message || "Could not find that order for this event.";
      setScanError(errorMessage);
      toast.error(errorMessage);
    }
  }, [orderError]);

  const getQRBoxSize = (): { width: number; height: number } => {
    const element = document.getElementById("qr-reader");
    if (element) {
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Use 70% of container size, but cap at reasonable limits
      // On mobile, use a larger percentage for better scanning
      const isMobile = window.innerWidth < 768;
      const sizePercentage = isMobile ? 0.85 : 0.70;

      const qrSize = Math.min(width, height) * sizePercentage;
      // Ensure minimum and maximum sizes
      const minSize = 200;
      const maxSize = isMobile ? Math.min(width * 0.9, height * 0.9) : 350;

      const finalSize = Math.max(minSize, Math.min(qrSize, maxSize));
      return { width: finalSize, height: finalSize };
    }

    // Fallback dimensions
    const isMobile = window.innerWidth < 768;
    return { width: isMobile ? 280 : 300, height: isMobile ? 280 : 300 };
  };

  const initializeScanner = async (cameraIdToUse?: string | null) => {
    // Check if element exists and is visible
    const element = document.getElementById("qr-reader");
    if (!element) {
      setCameraError("Scanner element not found. Please refresh the page.");
      setIsScanning(false);
      setIsStarting(false);
      return;
    }

    // Ensure element is visible and responsive
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.width = '100%';
    element.style.minHeight = '400px';

    // Wait for layout to stabilize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get responsive QR box size
    const qrBoxSize = getQRBoxSize();

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Get available cameras first
      const devices = await Html5Qrcode.getCameras();

      if (devices && devices.length) {
        // Store available cameras for switching
        setAvailableCameras(devices);

        let selectedCameraId: string;

        if (cameraIdToUse) {
          // Use the provided camera ID
          selectedCameraId = cameraIdToUse;
        } else if (currentCameraId) {
          // Use the currently selected camera
          selectedCameraId = currentCameraId;
        } else {
          // Try to use back camera first, fallback to first available
          const backCamera = devices.find(
            (device) => device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment")
          );
          selectedCameraId = backCamera?.id || devices[0].id;
        }

        setCurrentCameraId(selectedCameraId);

        await html5QrCode.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: qrBoxSize,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Error callback - ignore for continuous scanning
          }
        );
      } else {
        // Fallback to facingMode if no devices found
        await html5QrCode.start(
          { facingMode },
          {
            fps: 10,
            qrbox: qrBoxSize,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Error callback - ignore for continuous scanning
          }
        );
      }

      setIsStarting(false);
    } catch (error: any) {
      console.error("Error initializing scanner:", error);
      let errorMessage = "Failed to access camera. ";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera access and try again.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage += "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage += "Camera is already in use by another application.";
      } else if (error.message?.includes("https")) {
        errorMessage += "Camera access requires HTTPS. Please use HTTPS or localhost.";
      } else {
        errorMessage += error.message || "Please check permissions and try again.";
      }

      setCameraError(errorMessage);
      setIsScanning(false);
      setIsStarting(false);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current = null;
      }
    }
  };

  const switchCamera = async () => {
    if (!html5QrCodeRef.current || !isScanning) {
      return;
    }

    try {
      // Stop current scanner
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;

      // Find current camera index
      const currentIndex = availableCameras.findIndex(cam => cam.id === currentCameraId);

      if (currentIndex === -1 || availableCameras.length <= 1) {
        // Try switching by facing mode if no camera ID or only one camera
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
        setIsStarting(true);
        setTimeout(() => {
          initializeScanner();
        }, 300);
        return;
      }

      // Switch to next camera
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCameraId = availableCameras[nextIndex].id;

      setIsStarting(true);
      setTimeout(() => {
        initializeScanner(nextCameraId);
      }, 300);
    } catch (error) {
      console.error("Error switching camera:", error);
      toast.error("Failed to switch camera. Please try again.");
    }
  };

  const startScanner = () => {
    if (html5QrCodeRef.current || isStarting) {
      return;
    }

    setCameraError(null);
    setScanError(null);
    setScannedOrderNumber(null);
    setIsStarting(true);

    // Show the scanner container first - this will trigger useEffect to initialize
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
          setIsScanning(false);
          setCameraError(null);
          setIsStarting(false);
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err);
          // Force cleanup even if stop fails
          html5QrCodeRef.current = null;
          setIsScanning(false);
          setIsStarting(false);
        });
    }
  };

  const parseQRCodeData = (qrText: string): string | null => {
    // Trim whitespace
    const trimmed = qrText.trim();

    // Order number pattern: TO-XXXXXXXXX-XXXXXXXXX (e.g., TO-1765797079238-4EB918283645)
    const orderNumberPattern = /^TO-[A-Z0-9]+-[A-Z0-9]+$/i;

    if (orderNumberPattern.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    // Try to extract order number from JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.orderNumber && orderNumberPattern.test(parsed.orderNumber)) {
        return parsed.orderNumber.toUpperCase();
      }
      if (parsed.orderCode && orderNumberPattern.test(parsed.orderCode)) {
        return parsed.orderCode.toUpperCase();
      }
    } catch {
      // Not JSON, continue
    }

    return null;
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Prevent duplicate scans
    if (lastScannedCode === decodedText) {
      return;
    }

    setLastScannedCode(decodedText);
    stopScanner();

    const orderNumber = parseQRCodeData(decodedText);

    if (!orderNumber) {
      setScanError("Invalid QR code format. Expected a valid order number.");
      toast.error("Invalid QR code format");
      return;
    }

    // Set the order number to trigger the query
    setScannedOrderNumber(orderNumber);
    setScanError(null);
  };

  const resetScan = () => {
    setScannedOrderNumber(null);
    setScanError(null);
    setLastScannedCode(null);
    setCollapsedGroups(new Set());
    setSelectedAttendances(new Set());
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
      case "PAID":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{status}</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{status}</Badge>;
      case "CANCELLED":
      case "FAILED":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Event not found</p>
        </div>
      </div>
    );
  }

  // Show order details screen
  if (scannedOrderNumber && (orderData || isLoadingOrder)) {
    return (
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={resetScan}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Take attendances</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {event.displayName}
              </p>
            </div>
          </div>
        </div>

        {isLoadingOrder ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading order details...</p>
              </div>
            </CardContent>
          </Card>
        ) : orderData ? (
          <>
            {/* Success Banner */}
            <div className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-200">
                    Scan Ticket Successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Order Number: #{orderData.orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium font-mono">{orderData.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(orderData.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(Number(orderData.totalPaymentAmount), orderData.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{formatDateTime(orderData.createdAt)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {orderData.orderDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      {detail.ticketSnapshot.imageUrl ? (
                        <Image
                          src={detail.ticketSnapshot.imageUrl}
                          alt={detail.ticketSnapshot.displayName}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover mr-2"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{detail.ticketSnapshot.displayName}</p>
                      </div>
                      <div className="text-right text-sm">
                        <span className="text-muted-foreground">
                          {detail.quantity} × {formatCurrency(Number(detail.unitPrice), detail.currency)}
                        </span>
                        <span className="ml-2 font-medium">
                          = {formatCurrency(detail.subTotal, detail.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(Number(orderData.totalPaymentAmount), orderData.currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {orderData.createdBy.avatarUrl ? (
                      <img
                        src={orderData.createdBy.avatarUrl}
                        alt={`${orderData.createdBy.firstName} ${orderData.createdBy.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {orderData.createdBy.firstName} {orderData.createdBy.lastName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{orderData.createdBy.email}</span>
                  </div>
                  {orderData.createdBy.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{orderData.createdBy.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Attendances */}
            {groupedAttendances.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="h-5 w-5" />
                      Attendees ({orderData.eventAttendances?.length || 0})
                    </CardTitle>
                    {selectedAttendances.size > 0 && (
                      <Button
                        size="sm"
                        onClick={handleCheckInClick}
                        disabled={confirmAttendance.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {confirmAttendance.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Checking in...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In ({selectedAttendances.size})
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {groupedAttendances.map((group) => {
                    const isCollapsed = collapsedGroups.has(group.ticketId);
                    const selectedInGroup = getSelectedCountInGroup(group);
                    const uncheckedInGroup = getUncheckedCountInGroup(group);

                    return (
                      <div key={group.ticketId}>
                        {/* Ticket Group Header */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleGroupCollapse(group.ticketId)}
                            className="flex-1 px-2 py-2 flex items-center justify-between text-sm hover:bg-muted/50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{group.ticketName}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className={`text-xs ${group.allCheckedIn ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                {group.checkedInCount}/{group.totalCount} checked in
                              </span>
                              {group.allCheckedIn && (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              )}
                            </div>
                            {isCollapsed ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          {/* Select All / Deselect All for group */}
                          {!isCollapsed && uncheckedInGroup > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => {
                                if (selectedInGroup === uncheckedInGroup) {
                                  deselectAllInGroup(group);
                                } else {
                                  selectAllInGroup(group);
                                }
                              }}
                            >
                              {selectedInGroup === uncheckedInGroup ? "Deselect" : "Select All"}
                            </Button>
                          )}
                        </div>

                        {/* Attendance List */}
                        {!isCollapsed && (
                          <div className="ml-4 border-l-2 border-muted pl-4 space-y-0.5 mt-1">
                            {group.attendances.map((attendance, index) => {
                              const statusInfo = getAttendanceStatusInfo(
                                attendance.status,
                                attendance.checkedInAt
                              );
                              const isSelected = selectedAttendances.has(attendance.id);
                              const canCheckIn = attendance.status === "CREATED";
                              const isCancelled = attendance.status?.toUpperCase() === "CANCELLED";
                              const isCheckedIn = attendance.status?.toUpperCase() === "CHECKED_IN" || statusInfo.isCheckedIn;

                              return (
                                <div
                                  key={attendance.id}
                                  className={`flex items-center gap-3 py-2 px-2 rounded-md transition-colors ${
                                    isCancelled
                                      ? "opacity-60 bg-red-50/50 dark:bg-red-950/10"
                                      : isSelected
                                      ? "bg-green-50 dark:bg-green-950/20"
                                      : "hover:bg-muted/30"
                                  }`}
                                >
                                  {/* Checkbox or status indicator */}
                                  {isCancelled ? (
                                    <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                      <XCircle className="h-3 w-3 text-white" />
                                    </div>
                                  ) : isCheckedIn ? (
                                    <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <CheckCircle className="h-3 w-3 text-white" />
                                    </div>
                                  ) : (
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => {
                                        if (canCheckIn) {
                                          toggleAttendanceSelection(attendance.id);
                                        }
                                      }}
                                      disabled={!canCheckIn}
                                      className="flex-shrink-0"
                                    />
                                  )}

                                  {/* Number */}
                                  <span
                                    className={`text-xs font-mono w-5 flex-shrink-0 ${
                                      isCancelled
                                        ? "text-muted-foreground line-through"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    #{index + 1}
                                  </span>

                                  {/* Content */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <span
                                        className={`font-medium ${
                                          isCancelled
                                            ? "text-red-600 dark:text-red-400 line-through"
                                            : isCheckedIn
                                            ? "text-green-700 dark:text-green-400"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {isCancelled
                                          ? "Cancelled"
                                          : isCheckedIn
                                          ? "Checked In"
                                          : "Take Attendance"}
                                      </span>
                                      {isCheckedIn && attendance.checkedInAt && (
                                        <span className="text-xs text-muted-foreground">
                                          · {formatDate(attendance.checkedInAt)} ({getRelativeTime(attendance.checkedInAt)})
                                        </span>
                                      )}
                                    </div>
                                    <p
                                      className={`text-xs ${
                                        isCancelled
                                          ? "text-muted-foreground line-through"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      Member {index + 1}
                                    </p>
                                  </div>

                                  {/* Status badge for cancelled */}
                                  {isCancelled && (
                                    <div className="flex-shrink-0">
                                      <Badge variant="destructive" className="text-xs">
                                        Cancelled
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Uncheck button placeholder for checked-in items */}
                                  {isCheckedIn && !isCancelled && (
                                    <div className="flex-shrink-0">
                                      {/* Uncheck button will go here */}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={resetScan}
                variant="outline"
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan Another
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/creator/events/${eventId}/attendance`)}
                variant="outline"
                className="flex-1"
              >
                Go to Attendance List
              </Button>
            </div>

            {/* Check-in Confirmation Dialog */}
            <AlertDialog open={showCheckInConfirm} onOpenChange={setShowCheckInConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Check-in</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to check in {selectedAttendances.size} {selectedAttendances.size === 1 ? "attendee" : "attendees"}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={confirmAttendance.isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmCheckIn}
                    disabled={confirmAttendance.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {confirmAttendance.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Yes, Check In
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}

        {/* Error State */}
        {scanError && !isLoadingOrder && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="font-semibold text-red-600 dark:text-red-400 mb-2">
                  Failed to Load Order
                </p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {scanError}
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => refetchOrder()} variant="outline">
                    Try Again
                  </Button>
                  <Button onClick={resetScan} variant="outline">
                    Scan Another
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Scan QR Code</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {event.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Click "Start Scanner" to begin scanning QR codes
          </p>
          <p className="text-sm text-muted-foreground">
            2. Point your camera at the attendee's QR code ticket
          </p>
          <p className="text-sm text-muted-foreground">
            3. The ticket details will be displayed automatically when a valid QR code is scanned
          </p>
        </CardContent>
      </Card>

      {/* Scanner Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning && !cameraError && !isStarting && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Camera className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Ready to scan QR codes
              </p>
              <Button
                onClick={startScanner}
                size="lg"
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanner
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4 text-center max-w-md">
                Note: Camera access requires HTTPS or localhost.
                Make sure you allow camera permissions when prompted.
              </p>
            </div>
          )}

          {isStarting && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
              <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
              <p className="text-muted-foreground mb-2 font-medium">
                Initializing scanner...
              </p>
              <p className="text-sm text-muted-foreground">
                Please allow camera access if prompted
              </p>
            </div>
          )}

          {cameraError && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
              <CameraOff className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                Camera Error
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4 text-center max-w-md">
                {cameraError}
              </p>
              <div className="flex gap-2">
                <Button onClick={startScanner} variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => {
                    setCameraError(null);
                    setIsScanning(false);
                    setIsStarting(false);
                  }}
                  variant="ghost"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-600">
                    Scanning...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {availableCameras.length > 1 && (
                    <Button
                      onClick={switchCamera}
                      variant="outline"
                      size="sm"
                      disabled={isStarting}
                      title="Switch camera"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Switch Camera
                    </Button>
                  )}
                  <Button onClick={stopScanner} variant="outline" size="sm">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                </div>
              </div>
              {/* Scanner container - only rendered when scanning */}
              <div className="w-full">
                <div
                  id="qr-reader"
                  ref={qrReaderRef}
                  className="w-full rounded-lg overflow-hidden border-2 border-primary/20"
                  style={{
                    minHeight: '400px',
                    width: '100%',
                    position: 'relative',
                    backgroundColor: '#000',
                    display: 'block',
                    aspectRatio: 'auto'
                  }}
                />
              </div>
              <style dangerouslySetInnerHTML={{
                __html: `
                #qr-reader {
                  width: 100% !important;
                  min-height: 400px !important;
                }
                #qr-reader video {
                  width: 100% !important;
                  height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  display: block !important;
                  object-fit: cover !important;
                }
                #qr-reader canvas {
                  width: 100% !important;
                  height: 100% !important;
                }
                #qr-reader img {
                  display: none !important;
                }
                @media (max-width: 768px) {
                  #qr-reader {
                    min-height: 300px !important;
                  }
                }
              `}} />
            </div>
          )}

          {/* Scan Error */}
          {scanError && !scannedOrderNumber && (
            <div className="p-4 rounded-lg border-2 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-200">
                    Scan Failed
                  </p>
                  <p className="text-sm mt-1 text-red-700 dark:text-red-300">
                    {scanError}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setScanError(null);
                    setLastScannedCode(null);
                    startScanner();
                  }}
                  size="sm"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can manually enter the order ID from the QR code:
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Order Number
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-md font-mono text-sm"
                placeholder="TO-XXXXXXXXX-XXXXXXXXX"
                id="manual-qr-input"
              />
            </div>
            <Button
              onClick={() => {
                const input = document.getElementById("manual-qr-input") as HTMLInputElement;
                const value = input?.value?.trim();
                if (value) {
                  handleScanSuccess(value);
                  input.value = "";
                } else {
                  toast.error("Please enter an order number");
                }
              }}
              className="w-full"
            >
              Look Up Order
            </Button>
          </div>
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/dashboard/creator/events/${eventId}/attendance`);
              }}
              className="w-full"
            >
              Go to Attendance List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { useEventById } from "@/hooks/events/useEventById";
import { useConfirmAttendance } from "@/hooks/events/useConfirmAttendance";
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
} from "lucide-react";
import { toast } from "sonner";

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
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const { data: event, isLoading: isLoadingEvent } = useEventById(eventId);
  const confirmAttendance = useConfirmAttendance(eventId);

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
          .catch(() => {});
      }
    };
  }, []);

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

  const initializeScanner = async () => {
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
        // Try to use back camera first, fallback to first available
        const backCamera = devices.find(
          (device) => device.label.toLowerCase().includes("back") || 
                      device.label.toLowerCase().includes("rear") ||
                      device.label.toLowerCase().includes("environment")
        );
        const cameraId = backCamera?.id || devices[0].id;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: qrBoxSize,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Error callback - ignore for continuous scanning
          }
        );
      } else {
        // Fallback to facingMode if no devices found
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: qrBoxSize,
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
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

  const startScanner = () => {
    if (html5QrCodeRef.current || isStarting) {
      return;
    }

    setCameraError(null);
    setScanResult(null);
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

  const parseQRCodeData = (qrText: string): {
    eventAttendanceId?: string;
    checkingInAccountId?: string;
  } | null => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(qrText);
      return {
        eventAttendanceId: parsed.eventAttendanceId || parsed.id,
        checkingInAccountId: parsed.checkingInAccountId || parsed.accountId,
      };
    } catch {
      // If not JSON, assume it's just the attendance ID
      // Or it could be in format: attendanceId:accountId
      if (qrText.includes(":")) {
        const [eventAttendanceId, checkingInAccountId] = qrText.split(":");
        return { eventAttendanceId, checkingInAccountId };
      }
      // Assume it's just the attendance ID
      return { eventAttendanceId: qrText };
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Prevent duplicate scans
    if (lastScannedCode === decodedText) {
      return;
    }

    setLastScannedCode(decodedText);
    stopScanner();

    const qrData = parseQRCodeData(decodedText);

    if (!qrData) {
      setScanResult({
        success: false,
        message: "Invalid QR code format",
      });
      toast.error("Invalid QR code format");
      return;
    }

    // If we don't have checkingInAccountId, we might need to get it from the QR code
    // or from the user context. For now, we'll require it in the QR code.
    if (!qrData.eventAttendanceId || !qrData.checkingInAccountId) {
      setScanResult({
        success: false,
        message:
          "QR code is missing required information. Please ensure the QR code contains both attendance ID and account ID.",
      });
      toast.error("QR code missing required information");
      return;
    }

    try {
      await confirmAttendance.mutateAsync({
        eventAttendanceId: qrData.eventAttendanceId,
        checkingInAccountId: qrData.checkingInAccountId,
      });

      setScanResult({
        success: true,
        message: "Attendance confirmed successfully!",
        data: qrData,
      });

      // Auto-restart scanner after 2 seconds
      setTimeout(() => {
        setScanResult(null);
        setLastScannedCode(null);
        startScanner();
      }, 2000);
    } catch (error) {
      setScanResult({
        success: false,
        message: "Failed to confirm attendance. Please try again.",
        data: qrData,
      });
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
            3. The attendance will be confirmed automatically when a valid QR code is scanned
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
                <Button onClick={stopScanner} variant="outline" size="sm">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Scanner
                </Button>
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
              <style dangerouslySetInnerHTML={{__html: `
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

          {/* Scan Result */}
          {scanResult && (
            <div
              className={`p-4 rounded-lg border-2 ${
                scanResult.success
                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      scanResult.success
                        ? "text-green-900 dark:text-green-200"
                        : "text-red-900 dark:text-red-200"
                    }`}
                  >
                    {scanResult.success
                      ? "Attendance Confirmed!"
                      : "Confirmation Failed"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      scanResult.success
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {scanResult.message}
                  </p>
                  {scanResult.data && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Attendance ID: {scanResult.data.eventAttendanceId}</p>
                      <p>Account ID: {scanResult.data.checkingInAccountId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {confirmAttendance.isPending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Confirming attendance...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Option for Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can manually enter the QR code data:
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">
                QR Code Data (JSON or format: attendanceId:accountId)
              </label>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-md font-mono text-sm"
                placeholder='{"eventAttendanceId": "xxx", "checkingInAccountId": "xxx"}'
                id="manual-qr-input"
              />
            </div>
            <Button
              onClick={() => {
                const input = document.getElementById("manual-qr-input") as HTMLTextAreaElement;
                const value = input?.value?.trim();
                if (value) {
                  handleScanSuccess(value);
                  input.value = "";
                } else {
                  toast.error("Please enter QR code data");
                }
              }}
              className="w-full"
            >
              Confirm Attendance
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


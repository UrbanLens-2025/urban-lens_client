"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { useVerifyVoucherCode } from "@/hooks/vouchers/useVerifyVoucherCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  QrCode,
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  ScanLine,
  RotateCcw,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const verifyVoucherSchema = z.object({
  userVoucherCode: z.string().min(1, "Voucher code is required"),
});

type VerifyVoucherFormValues = z.infer<typeof verifyVoucherSchema>;

export default function VerifyVoucherPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const { data: location, isLoading: isLoadingLocation } = useLocationById(locationId);
  const verifyVoucher = useVerifyVoucherCode();

  const form = useForm<VerifyVoucherFormValues>({
    resolver: zodResolver(verifyVoucherSchema),
    defaultValues: {
      userVoucherCode: "",
    },
  });

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
      
      const isMobile = window.innerWidth < 768;
      const sizePercentage = isMobile ? 0.85 : 0.70;
      
      const qrSize = Math.min(width, height) * sizePercentage;
      const minSize = 200;
      const maxSize = isMobile ? Math.min(width * 0.9, height * 0.9) : 350;
      
      const finalSize = Math.max(minSize, Math.min(qrSize, maxSize));
      return { width: finalSize, height: finalSize };
    }
    
    const isMobile = window.innerWidth < 768;
    return { width: isMobile ? 280 : 300, height: isMobile ? 280 : 300 };
  };

  const initializeScanner = async (cameraIdToUse?: string | null) => {
    const element = document.getElementById("qr-reader");
    if (!element) {
      setCameraError("Scanner element not found. Please refresh the page.");
      setIsScanning(false);
      setIsStarting(false);
      return;
    }

    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.width = '100%';
    element.style.minHeight = '400px';

    await new Promise((resolve) => setTimeout(resolve, 100));

    const qrBoxSize = getQRBoxSize();

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length) {
        setAvailableCameras(devices);
        
        let selectedCameraId: string;
        
        if (cameraIdToUse) {
          selectedCameraId = cameraIdToUse;
        } else if (currentCameraId) {
          selectedCameraId = currentCameraId;
        } else {
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
      await html5QrCodeRef.current.stop();
      html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;

      const currentIndex = availableCameras.findIndex(cam => cam.id === currentCameraId);
      
      if (currentIndex === -1 || availableCameras.length <= 1) {
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
        setIsStarting(true);
        setTimeout(() => {
          initializeScanner();
        }, 300);
        return;
      }

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
    setScanResult(null);
    setIsStarting(true);
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
          html5QrCodeRef.current = null;
          setIsScanning(false);
          setIsStarting(false);
        });
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Prevent duplicate scans
    if (lastScannedCode === decodedText) {
      return;
    }

    setLastScannedCode(decodedText);
    stopScanner();

    // Extract voucher code from QR text (could be JSON or plain text)
    let voucherCode = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      voucherCode = parsed.userVoucherCode || parsed.voucherCode || decodedText;
    } catch {
      // If not JSON, use as-is
      voucherCode = decodedText;
    }

    await verifyVoucherCode(voucherCode);
  };

  const verifyVoucherCode = async (code: string) => {
    try {
      await verifyVoucher.mutateAsync({ userVoucherCode: code });
      
      setScanResult({
        success: true,
        message: "Voucher verified and marked as used successfully!",
      });

      // Auto-restart scanner after 2 seconds
      setTimeout(() => {
        setScanResult(null);
        setLastScannedCode(null);
        startScanner();
      }, 2000);
    } catch (error: any) {
      setScanResult({
        success: false,
        message: error.message || "Failed to verify voucher code.",
      });
    }
  };

  const onSubmit = async (values: VerifyVoucherFormValues) => {
    await verifyVoucherCode(values.userVoucherCode);
    form.reset();
  };

  useEffect(() => {
    if (isScanning && isStarting && !html5QrCodeRef.current) {
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (element) {
          initializeScanner();
        } else {
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
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning, isStarting]);

  if (isLoadingLocation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Location not found</p>
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
            onClick={() => router.push(`/dashboard/business/locations/${locationId}/vouchers`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Verify Voucher Code</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {location.name}
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
            1. Click "Start Scanner" to begin scanning QR codes, or manually enter the voucher code
          </p>
          <p className="text-sm text-muted-foreground">
            2. Point your camera at the customer's voucher QR code
          </p>
          <p className="text-sm text-muted-foreground">
            3. The voucher will be verified and marked as used automatically when scanned
          </p>
        </CardContent>
      </Card>

      {/* QR Scanner */}
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
                Ready to scan voucher QR codes
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
                      ? "Voucher Verified!"
                      : "Verification Failed"}
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
                </div>
              </div>
            </div>
          )}

          {verifyVoucher.isPending && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">
                Verifying voucher...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5" />
            Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userVoucherCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter voucher code (e.g., VC-1699999-A1B2C3)"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={verifyVoucher.isPending}
              >
                {verifyVoucher.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Voucher
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


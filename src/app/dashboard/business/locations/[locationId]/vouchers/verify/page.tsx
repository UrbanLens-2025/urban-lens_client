"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { useVerifyVoucherCode } from "@/hooks/vouchers/useVerifyVoucherCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  // Refs
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  
  // States
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment"); // Logic mới: Quản lý camera trước/sau
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Hooks
  const { data: location, isLoading: isLoadingLocation } = useLocationById(locationId);
  const verifyVoucher = useVerifyVoucherCode();

  const form = useForm<VerifyVoucherFormValues>({
    resolver: zodResolver(verifyVoucherSchema),
    defaultValues: {
      userVoucherCode: "",
    },
  });

  // Cleanup khi thoát trang
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch((err) => console.warn(err));
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  // Hàm tính toán kích thước khung quét
  const getQRBoxSize = () => {
    // Logic này giữ nguyên để không vỡ layout
    const isMobile = window.innerWidth < 768;
    return isMobile ? { width: 250, height: 250 } : { width: 300, height: 300 };
  };

  // --- LOGIC MỚI: START SCANNER ---
  const startScanner = async (modeOverride?: "environment" | "user") => {
    if (isStarting) return;

    // Đảm bảo instance tồn tại
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
    }

    const scanner = html5QrCodeRef.current;
    const modeToUse = modeOverride || facingMode;

    try {
      setIsStarting(true);
      setCameraError(null);
      setScanResult(null); // Reset kết quả cũ

      // Nếu đang chạy thì dừng trước
      if (scanner.isScanning) {
        await scanner.stop();
      }

      await scanner.start(
        { facingMode: modeToUse }, // Dùng facingMode thay vì deviceId để fix mobile
        {
          fps: 10,
          qrbox: getQRBoxSize(),
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      setIsStarting(false);
    } catch (err: any) {
      console.error("Camera Error:", err);
      setIsStarting(false);
      setIsScanning(false);
      setCameraError("Cannot access camera. Please check permissions or use HTTPS.");
    }
  };

  // --- LOGIC MỚI: STOP SCANNER ---
  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        // Không clear() ngay để giữ frame cuối cùng (tránh màn hình đen thui)
        setIsScanning(false);
      } catch (err) {
        console.error("Stop failed", err);
      }
    }
  };

  // --- LOGIC MỚI: SWITCH CAMERA ---
  const switchCamera = async () => {
    // Đảo ngược chế độ
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    
    // Restart lại scanner với chế độ mới
    await startScanner(newMode);
  };

  // --- LOGIC XỬ LÝ KẾT QUẢ & REDIRECT ---
  const handleScanSuccess = async (decodedText: string) => {
    // Dừng quét ngay để tránh submit nhiều lần
    if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop();
    }
    
    // Parse code
    let code = decodedText;
    try {
        const parsed = JSON.parse(decodedText);
        code = parsed.userVoucherCode || parsed.voucherCode || decodedText;
    } catch {}

    verifyCode(code);
  };

  const verifyCode = async (code: string) => {
    try {
        const response = await verifyVoucher.mutateAsync({ userVoucherCode: code });
        
        toast.success(`Verified: ${code}`);
        setScanResult({
            success: true,
            message: "Verification successful! Redirecting...",
        });

        // Lấy ID để redirect
        const voucherId = response?.data?.id || response?.data?.voucherId || response?.data?.voucher?.id;

        if (voucherId) {
            setTimeout(() => {
                router.push(`/dashboard/business/locations/${locationId}/vouchers/${voucherId}`);
            }, 1500); // Chờ 1.5s
        } else {
            toast.warning("Verified but cannot redirect (missing ID).");
            // Cho phép quét lại sau 3s nếu lỗi redirect
            setTimeout(() => {
                setScanResult(null);
                startScanner();
            }, 3000);
        }

    } catch (error: any) {
        setScanResult({
            success: false,
            message: error.message || "Invalid voucher code.",
        });
        // Hiện lỗi xong cho phép thử lại
        setIsScanning(false); 
    }
  };

  const onSubmitManual = async (values: VerifyVoucherFormValues) => {
    await verifyCode(values.userVoucherCode);
    form.reset();
  };

  // --- RENDER UI (Giữ nguyên cấu trúc cũ) ---

  if (isLoadingLocation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!location) return <div>Location not found</div>;

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
            1. Click "Start Scanner" to begin scanning QR codes.
          </p>
          <p className="text-sm text-muted-foreground">
            2. Point your camera at the customer's voucher QR code.
          </p>
          <p className="text-sm text-muted-foreground">
            3. Upon success, you will be redirected to the detail page.
          </p>
        </CardContent>
      </Card>

      {/* QR Code Scanner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Trạng thái chưa bắt đầu & không có kết quả */}
          {!isScanning && !cameraError && !isStarting && !scanResult && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <Camera className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Ready to scan voucher QR codes
              </p>
              <Button onClick={() => startScanner()} size="lg">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanner
              </Button>
            </div>
          )}

          {/* Trạng thái đang khởi động */}
          {isStarting && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
              <Loader2 className="h-16 w-16 text-primary mb-4 animate-spin" />
              <p className="text-muted-foreground">Starting camera...</p>
            </div>
          )}

          {/* Trạng thái Lỗi Camera */}
          {cameraError && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
              <CameraOff className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-red-600 mb-4 text-center px-4">{cameraError}</p>
              <div className="flex gap-2">
                <Button onClick={() => startScanner()} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => setCameraError(null)} variant="ghost">
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Vùng Camera (Luôn render div id="qr-reader" nhưng ẩn/hiện bằng CSS) */}
          <div 
            className={`w-full rounded-lg overflow-hidden border-2 border-primary/20 relative bg-black ${!isScanning ? 'hidden' : 'block'}`}
          >
             <div id="qr-reader" className="w-full" style={{ minHeight: '400px' }}></div>
             
             {/* Controls overlay */}
             <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
               <Button onClick={switchCamera} variant="secondary" size="sm" className="opacity-90 shadow-md">
                 <RotateCcw className="h-4 w-4 mr-2" />
                 Switch Camera
               </Button>
               <Button onClick={stopScanner} variant="destructive" size="sm" className="opacity-90 shadow-md">
                 <CameraOff className="h-4 w-4 mr-2" />
                 Stop
               </Button>
             </div>
          </div>

          {/* Kết quả Scan (Success/Fail) */}
          {scanResult && (
            <div className={`p-4 rounded-lg border-2 ${
                scanResult.success 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${scanResult.success ? "text-green-900" : "text-red-900"}`}>
                    {scanResult.success ? "Success" : "Error"}
                  </p>
                  <p className={`text-sm mt-1 ${scanResult.success ? "text-green-700" : "text-red-700"}`}>
                    {scanResult.message}
                  </p>
                  {/* Nút thử lại nếu thất bại */}
                  {!scanResult.success && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 bg-white"
                        onClick={() => { setScanResult(null); startScanner(); }}
                      >
                        Scan Again
                      </Button>
                  )}
                </div>
              </div>
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
            <form onSubmit={form.handleSubmit(onSubmitManual)} className="space-y-4">
              <FormField
                control={form.control}
                name="userVoucherCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter voucher code..."
                        {...field}
                        className="font-mono uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
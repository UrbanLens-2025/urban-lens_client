"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWalletInternalTransactionById } from "@/hooks/wallet/useWalletInternalTransactionById";
import { useWalletExternalTransactionById } from "@/hooks/wallet/useWalletExternalTransactionById";
import { useCancelWithdrawTransaction } from "@/hooks/wallet/useCancelWithdrawTransaction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, ArrowLeft, Copy, CheckCircle2, 
  Clock, XCircle, AlertCircle, Building2, 
  Receipt, Image as ImageIcon, Activity, User, Maximize2, X, ZoomIn
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

// --- Utility Components ---

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title={`Copy ${label || 'text'}`}
    >
      {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

const DetailRow = ({ label, value, copyable = false, mono = false }: { label: string; value?: string | number | null; copyable?: boolean; mono?: boolean }) => {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-3 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center font-medium">
        <span className={`${mono ? "font-mono" : ""} truncate max-w-[200px] md:max-w-[300px]`}>
          {value}
        </span>
        {copyable && <CopyButton text={value.toString()} label={label} />}
      </div>
    </div>
  );
};

// --- Helper Functions ---

function mapStatus(status: string) {
  const s = status?.toUpperCase() || "";
  if (["COMPLETED", "TRANSFERRED", "SUCCESS"].includes(s)) return "completed";
  if (["FAILED", "TRANSFER_FAILED"].includes(s)) return "failed";
  if (["CANCELLED"].includes(s)) return "cancelled";
  if (["PROCESSING"].includes(s)) return "processing";
  return "pending";
}

function getStatusConfig(status: string) {
  const s = mapStatus(status);
  const config = {
    completed: { color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400", icon: CheckCircle2, label: "Completed" },
    failed: { color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400", icon: XCircle, label: "Failed" },
    cancelled: { color: "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400", icon: XCircle, label: "Cancelled" },
    processing: { color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400", icon: Activity, label: "Processing" },
    pending: { color: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400", icon: Clock, label: "Pending" },
  };
  return config[s];
}

export default function CreatorWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = params?.transactionId || "";
  const transactionType = searchParams.get('type') || 'internal';

  const externalTransaction = useWalletExternalTransactionById(transactionType === 'external' ? transactionId : null);
  const internalTransaction = useWalletInternalTransactionById(transactionType === 'internal' ? transactionId : null);
  const cancelWithdraw = useCancelWithdrawTransaction();

  const transaction: any = transactionType === 'internal' ? internalTransaction.data : externalTransaction.data;
  const isLoading = transactionType === 'internal' ? internalTransaction.isLoading : externalTransaction.isLoading;
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  if (isLoading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>;
  if (!transaction) return <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground"><AlertCircle className="h-10 w-10 mb-2" /> Transaction not found</div>;

  const isWithdraw = transaction.direction?.toUpperCase() === 'WITHDRAW';
  const isPending = transaction.status?.toUpperCase() === 'PENDING';
  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  const formatCurrency = (amount: number | string, currency = "VND") => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const proofImages: string[] = [];
  if (transaction.proofOfTransferImages) {
    if (Array.isArray(transaction.proofOfTransferImages)) {
      transaction.proofOfTransferImages.forEach((p: string) => proofImages.push(p));
    } else if (typeof transaction.proofOfTransferImages === 'object') {
      Object.values(transaction.proofOfTransferImages).forEach((p: any) => proofImages.push(p as string));
    }
  }

  return (
    <div className="max-w-8xl mx-auto space-y-6 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallet
        </Button>
      </div>

      {/* Header Section */}
      <div className={`rounded-xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${statusConfig.color}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-sm`}>
            <StatusIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-lg font-semibold opacity-90">{isWithdraw ? 'Withdrawal' : 'Transaction'} {statusConfig.label}</h1>
            <p className="text-sm opacity-75">
              Updated {formatDateTime(transaction.updatedAt)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium opacity-75 mb-1 uppercase tracking-wide">Total Amount</p>
          <div className="text-3xl font-bold tracking-tight">
            {formatCurrency(transaction.amount, transaction.currency)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Area */}
          {isWithdraw && isPending && (
             <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/10">
               <CardContent className="p-6 flex items-center justify-between">
                 <div className="text-sm text-orange-800 dark:text-orange-300">
                    <span className="font-semibold">Pending Approval:</span> You can cancel this request while it is still pending.
                 </div>
                 <Button size="sm" variant="destructive" onClick={() => setCancelDialogOpen(true)}>
                   Cancel Withdrawal
                 </Button>
               </CardContent>
             </Card>
          )}

          {/* Timeline - Sorted Increasing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Transaction Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 border-l-2 border-muted space-y-8">
                {transaction.timeline && transaction.timeline.length > 0 ? (
                  [...transaction.timeline]
                    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((event: any, index: number, arr: any[]) => {
                      const isLatest = index === arr.length - 1;
                      return (
                        <div key={event.id || index} className="relative">
                          <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 bg-background transition-all ${isLatest ? 'border-primary ring-4 ring-primary/10 scale-110' : 'border-muted-foreground/30'}`} />
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                            <div>
                              <p className={`text-sm ${isLatest ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                                {event.action.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {event.note || `Status changed to ${event.statusChangedTo}`}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                                  {event.actorType === 'SYSTEM' ? <Activity className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                                  {event.actorName || event.actorType}
                                </Badge>
                              </div>
                            </div>
                            <time className={`text-xs font-mono whitespace-nowrap pt-1 ${isLatest ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {new Date(event.createdAt).toLocaleString()}
                            </time>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-sm text-muted-foreground italic">No timeline events recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>

           {/* Proof of Transfer Images */}
           {proofImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Proof of Transfer
                </CardTitle>
                <CardDescription>Evidence of transfer uploaded by admin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {proofImages.map((img, i) => (
                    <div 
                      key={i} 
                      className="group relative aspect-[3/4] rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all shadow-sm"
                      onClick={() => setSelectedProofImage(img)}
                    >
                      <Image 
                        src={img} 
                        alt="Proof of transfer" 
                        fill 
                        className="object-cover object-top"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-background/90 text-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg">
                           <ZoomIn className="h-3 w-3" /> Click to view
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                References
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
               <DetailRow label="Transaction ID" value={transaction.id} copyable mono />
               <DetailRow label="Wallet ID" value={transaction.walletId} copyable mono />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {transaction.transferBankTransactionId ? (
                <DetailRow label="Bank Transfer Ref" value={transaction.transferBankTransactionId} copyable mono />
              ) : (
                transaction.provider && (
                  <DetailRow label="Provider Ref" value={transaction.providerTransactionId || transaction.providerResponse?.vnp_TxnRef || "N/A"} copyable mono />
                )
              )}
              <DetailRow label="Provider" value={transaction.provider || "Manual Transfer"} />
              <DetailRow label="Created" value={formatDateTime(transaction.createdAt)} />
            </CardContent>
          </Card>

          {(transaction.withdrawBankName || transaction.withdrawBankAccountNumber) && (
            <Card>
               <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Beneficiary
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-muted/30 pt-4 rounded-b-lg space-y-1">
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground">Bank Name</p>
                  <p className="font-medium text-sm">{transaction.withdrawBankName}</p>
                </div>
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-lg font-semibold tracking-wide">{transaction.withdrawBankAccountNumber}</p>
                    <CopyButton text={transaction.withdrawBankAccountNumber} label="Account Number" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-medium text-sm">{transaction.withdrawBankAccountName}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure? The funds ({formatCurrency(transaction.amount, transaction.currency)}) will be returned to your wallet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
            <Button 
              variant="destructive" 
              onClick={() => { cancelWithdraw.mutate(transactionId); setCancelDialogOpen(false); }}
              disabled={cancelWithdraw.isPending}
            >
              {cancelWithdraw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FIXED: Full Screen Image Lightbox Modal */}
      {/* FIXED: iOS Glass Style Lightbox with Accessibility Fixes */}
      <Dialog open={!!selectedProofImage} onOpenChange={(open) => !open && setSelectedProofImage(null)}>
        <DialogContent 
          className="max-w-none w-100 h-auto p-0 backdrop-blur-sm bg-white/90 hover:bg-white border-none shadow-none z-[9999] flex flex-col justify-center items-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"
        >
          {/* ACCESSIBILITY FIX: 
              Radix UI requires these components to exist. 
              We use 'sr-only' to hide them visually but keep them accessible for screen readers. 
          */}
          <DialogTitle className="sr-only">Proof of Transfer Image Preview</DialogTitle>
          <DialogDescription className="sr-only">
            A full-screen view of the transfer proof image uploaded for this transaction.
          </DialogDescription>


          {/* Image Container with smooth scale animation */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 animate-in zoom-in-95 duration-300"
            onClick={() => setSelectedProofImage(null)} // Click outside image to close
          >
            {selectedProofImage && (
              <img 
                src={selectedProofImage} 
                alt="Proof Full View" 
                className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-2xl ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
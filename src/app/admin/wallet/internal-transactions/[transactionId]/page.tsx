'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAdminInternalWalletTransactionById } from '@/hooks/admin/useAdminInternalWalletTransactionById';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Activity,
  Calendar,
  Hash,
  Wallet,
  ArrowUpRight,
  MapPin,
  ExternalLink,
  Ticket,
  Percent,
  ShieldCheck,
  Tag,
  Users,
  Receipt,
  Undo2,
  Info,
  User,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import Image from 'next/image';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAdminLocationBookingById } from '@/hooks/admin/useAdminLocationBookingById';
import { useAdminEventById } from '@/hooks/admin/useAdminEventById';
import { useAdminTicketOrderById } from '@/hooks/admin/useAdminTicketOrderById';

// --- Helpers ---
const formatDateTime = (d: string) =>
  d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const formatCurrency = (v: string | number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(Number(v));

const getStatusVariant = (status: string) => {
  const u = (status || '').toUpperCase();
  if (['COMPLETED', 'APPROVED', 'FINISHED', 'PAID'].includes(u)) return 'default' as const;
  if (u === 'PENDING') return 'secondary' as const;
  if (['FAILED', 'CANCELLED'].includes(u)) return 'destructive' as const;
  return 'outline' as const;
};

const getTypeLabel = (type: string) => {
  const t = (type || '').toUpperCase();
  if (t === 'TO_ESCROW') return 'Transfer to escrow';
  if (t === 'FROM_ESCROW') return 'Transfer from escrow';
  if (t === 'TO_REVENUE') return 'System Revenue';
  if (t === 'TO_WALLET') return 'Refund to Wallet';
  return type || 'Internal transfer';
};

export default function AdminInternalWalletTransactionDetailPage() {
  const params = useParams<{ transactionId: string }>();
  const router = useRouter();
  const transactionId = params?.transactionId || '';

  // 1. Fetch Transaction gốc
  const { data: transaction, isLoading: isLoadingTx, isError: isErrorTx } = useAdminInternalWalletTransactionById(transactionId);

  // 2. Định nghĩa các biến điều kiện
  const initType = transaction?.referencedInitType;
  const initId = transaction?.referencedInitId;
  const isLocationBooking = initType === 'LOCATION_BOOKING';
  const isEventInit = initType === 'EVENT';
  const isTicketOrder = initType === 'TICKET_ORDER';

  // 3. Fetch dữ liệu tham chiếu (Sử dụng flag enabled để tối ưu performance)
  const { data: bookingData, isLoading: isLoadingBooking } = useAdminLocationBookingById(initId, isLocationBooking);
  const { data: eventData, isLoading: isLoadingEvent } = useAdminEventById(initId, isEventInit);
  const { data: ticketOrderData, isLoading: isLoadingTicket } = useAdminTicketOrderById(initId, isTicketOrder);

  // Logic hiển thị Loading
  const isGlobalLoading = isLoadingTx ||
    (isLocationBooking && isLoadingBooking) ||
    (isEventInit && isLoadingEvent) ||
    (isTicketOrder && isLoadingTicket);

  if (isGlobalLoading) {
    return <PageContainer><div className="flex items-center justify-center py-20 animate-pulse text-muted-foreground italic font-medium">Processing audit data...</div></PageContainer>;
  }

  if (isErrorTx || !transaction) {
    return <PageContainer><div className="p-4 text-destructive border rounded-lg bg-destructive/10 text-center font-bold">Failed to retrieve transaction audit record.</div></PageContainer>;
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="group hover:bg-muted transition-all">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Audit Log
        </Button>
      </div>

      <Card className="shadow-2xl border-muted/50 overflow-hidden bg-slate-50/30">
        <CardHeader className="border-b bg-white/60 py-5 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-black flex items-center gap-2 tracking-tight uppercase text-slate-800 text-left">
              <Activity className="h-5 w-5 text-primary" /> AUDIT MEMORANDUM
            </CardTitle>
            <CardDescription className="text-[10px] font-mono opacity-60 uppercase tracking-widest text-left">
              Ref Type: {initType || 'DIRECT_TRANSFER'}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(transaction.status)} className="px-4 py-1 font-black uppercase tracking-tighter shadow-sm border-none text-[11px]">
            {transaction.status}
          </Badge>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* SECTION 1: TRANSACTION MASTER DATA */}
          <div className="rounded-[2rem] bg-slate-950 p-10 text-white relative shadow-2xl overflow-hidden border border-white/5">
            <div className="absolute -right-6 -bottom-6 opacity-10 text-white rotate-12 pointer-events-none"><Wallet size={200} /></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-left">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2">Net Value Impact</p>
                <h2 className="text-5xl md:text-6xl font-black tabular-nums tracking-tighter leading-none underline decoration-primary decoration-4 underline-offset-8">
                  {formatCurrency(transaction.amount)}
                </h2>
                <div className="flex items-center gap-3 pt-4">
                  <Badge className="bg-primary text-white border-none text-[10px] font-black py-1 px-3 uppercase tracking-widest leading-none">{getTypeLabel(transaction.type)}</Badge>
                  <Separator orientation="vertical" className="h-4 bg-white/20" />
                  <span className="text-[11px] text-slate-400 font-medium italic">Verified at {formatDateTime(transaction.createdAt)}</span>
                </div>
              </div>
              <div className="hidden md:block bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm min-w-[220px]">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 italic">Internal Audit ID</p>
                <p className="text-[10px] font-mono text-slate-300 break-all leading-relaxed">{transaction.id}</p>
              </div>
            </div>
          </div>

          {/* DYNAMIC SECTION */}
          {/* --- CASE 1: TICKET ORDER --- */}
          {(isTicketOrder && ticketOrderData) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <div className="lg:col-span-2">
                <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col md:flex-row bg-white rounded-[1.5rem]">
                  <div className="w-full md:w-72 shrink-0 border-r border-slate-100 bg-slate-50/50 flex flex-col text-left">
                    <div className="relative aspect-video md:aspect-square">
                      {ticketOrderData.event?.avatarUrl ? (
                        <Image src={ticketOrderData.event.avatarUrl} fill className="object-cover" alt="event" />
                      ) : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Ticket size={40} /></div>}
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 italic text-primary">Order Trace</p>
                        <div className="space-y-4">
                          <div className="flex items-start gap-2 text-[11px] text-slate-600 font-mono">
                            <Receipt className="h-3.5 w-3.5 mt-0.5 opacity-40" /> {ticketOrderData.orderNumber}
                          </div>
                          <Badge variant="outline" className="text-[9px] h-5 font-black px-2 uppercase border-emerald-100 text-emerald-600">{ticketOrderData.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 italic text-[11px] text-slate-400">
                        &ldquo;{transaction.note || "System processed ticket order payment."}&rdquo;
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 opacity-70 italic">Purchased for</h4>
                        <h4 className="font-black text-2xl text-slate-900 leading-tight tracking-tighter uppercase">{ticketOrderData.event?.displayName}</h4>
                      </div>
                      <div className="p-5 rounded-[1.5rem] bg-indigo-50/50 border border-indigo-100 flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100"><MapPin size={28} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-md font-black text-slate-800 truncate uppercase tracking-tighter leading-none italic">{ticketOrderData.event?.location?.name || 'Standard Site'}</p>
                          <p className="text-xs text-slate-400 mt-2 font-medium italic">{ticketOrderData.event?.location?.addressLine}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="flex flex-col gap-6">
                <Card className="flex-1 bg-white p-8 shadow-xl ring-1 ring-slate-200 rounded-[2rem] flex flex-col justify-center text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 border-b pb-2">Financial Analysis</p>
                  <div className="space-y-5">
                    <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase italic">
                      <span>Gross Payment</span>
                      <span className="font-mono text-slate-600 tabular-nums">{formatCurrency(ticketOrderData.totalPaymentAmount)}</span>
                    </div>
                    {ticketOrderData.refundedAmount > 0 && (
                      <div className="flex justify-between items-center text-sm py-4 px-5 bg-red-50 rounded-[1rem] border border-dashed border-red-200 relative">
                        <div className="absolute left-0 top-0 h-full w-1.5 bg-red-500"></div>
                        <span className="text-red-800 font-black italic text-[10px] uppercase tracking-tighter">Refund Applied</span>
                        <span className="font-mono font-black text-red-600 tabular-nums">-{formatCurrency(ticketOrderData.refundedAmount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic opacity-60">Impacted Amount</p>
                      <p className="font-mono text-slate-900 font-black text-3xl tracking-tighter leading-none tabular-nums italic underline decoration-primary decoration-2 underline-offset-4">{formatCurrency(transaction.amount)}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* --- CASE 2: EVENT --- */}
          {(isEventInit && eventData) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch animate-in slide-in-from-bottom-2 duration-500">
              <div className="lg:col-span-2 text-left">
                <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col md:flex-row bg-white rounded-[1.5rem]">
                  <div className="w-full md:w-72 shrink-0 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                    <div className="relative aspect-video md:aspect-square">
                      {eventData.avatarUrl ? <Image src={eventData.avatarUrl} fill className="object-cover" alt="event" /> : <div className="h-full w-full bg-slate-100" />}
                    </div>
                    <div className="p-6 space-y-6 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 italic text-emerald-600">Event Metadata</p>
                        <div className="flex flex-wrap gap-1.5">
                          {eventData.tags?.slice(0, 8).map((tag: any) => (
                            <Badge key={tag.id} style={{ color: tag.color, borderColor: `${tag.color}30`, backgroundColor: `${tag.color}10` }} variant="outline" className="text-[9px] font-black px-1.5 py-0 border italic">{tag.icon} {tag.displayName}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Expected PAX</span>
                          <span className="font-mono font-black text-primary flex items-center gap-1.5 uppercase tracking-tighter"><Users size={12} /> {eventData.expectedNumberOfParticipants}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div className="space-y-8">
                      <div>
                        <h4 className="font-black text-3xl text-slate-900 leading-tight tracking-tighter uppercase mb-2 italic underline decoration-primary/10 decoration-4 underline-offset-4">{eventData.displayName}</h4>
                        <p className="text-sm text-slate-500 italic leading-relaxed border-l-2 border-primary/20 pl-4 italic">"{eventData.description}"</p>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 italic">
                          <span className="h-px w-5 bg-slate-200"></span> Ticketing Context
                        </p>
                        <div className="grid gap-3">
                          {eventData.tickets?.map((t: any) => (
                            <div key={t.id} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                              <div className="flex gap-4 items-center">
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10 shadow-inner"><Ticket size={18} /></div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black text-slate-700 uppercase italic tracking-tighter leading-none">{t.displayName}</p>
                                  <p className="text-[9px] text-slate-400 font-mono tracking-tighter mt-1 leading-none uppercase italic">Sold: {t.totalQuantity - t.totalQuantityAvailable}/{t.totalQuantity}</p>
                                </div>
                              </div>
                              <span className="text-sm font-black text-primary tabular-nums tracking-tighter leading-none italic">{formatCurrency(t.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col gap-6 text-left">
                <Card className="flex-1 bg-emerald-600 p-8 text-white overflow-hidden shadow-xl border-none relative flex flex-col justify-center rounded-[2rem]">
                  <div className="absolute -top-6 -right-6 opacity-10 rotate-12 pointer-events-none"><Percent size={140} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2 leading-none uppercase tracking-widest">Admin Net Payout (Result)</p>
                  <p className="text-4xl font-black tabular-nums tracking-tighter shadow-emerald-700 drop-shadow-md italic leading-none font-mono">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <div className="mt-8 space-y-3 pt-6 border-t border-white/20">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-emerald-100 opacity-60 italic leading-none">
                      <span>Total Processed Volume</span>
                      <span className="font-mono tabular-nums leading-none tracking-tight">{formatCurrency(Number(transaction.amount) / (parseFloat(eventData?.systemCutPercentage)))}</span>
                    </div>
                  </div>
                </Card>
                <div className="p-6 rounded-[1.5rem] bg-white border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-primary transition-colors cursor-default">
                  <Avatar className="h-12 w-12 border-4 border-slate-50 shadow-md ring-1 ring-slate-100 shrink-0">
                    <AvatarImage src={eventData.createdBy?.avatarUrl || ''} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5 opacity-70 tracking-widest italic leading-none uppercase">Requested by Organizer</p>
                    <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tighter leading-none italic">{eventData.createdBy?.firstName} {eventData.createdBy?.lastName}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 group-hover:text-primary transition-colors" onClick={() => router.push(`/admin/accounts/${eventData.createdById}`)}>
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* --- CASE 3: LOCATION BOOKING --- */}
          {(isLocationBooking && bookingData) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch animate-in slide-in-from-bottom-2 duration-500">
              <div className="lg:col-span-2 text-left">
                <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col md:flex-row bg-white rounded-[1.5rem]">
                  <div className="w-full md:w-72 shrink-0 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                    <div className="relative aspect-video md:aspect-square">
                      {bookingData.location.imageUrl?.[0] ? <Image src={bookingData.location.imageUrl[0]} fill className="object-cover" alt="location" /> : <div className="h-full w-full bg-slate-100" />}
                    </div>
                    <div className="p-6 space-y-6 flex-1 flex flex-col">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 italic text-amber-600 leading-none">Booking Trace</p>
                        <div className="space-y-4 font-mono">
                          <div className="flex items-start gap-2 text-[11px] text-slate-600 italic">
                            <Hash className="h-3.5 w-3.5 mt-0.5 opacity-40 shrink-0" />
                            <span className="break-all">{transaction.id}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] h-5 font-black uppercase border-amber-100 text-amber-600 leading-none">{transaction.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div className="space-y-10">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-3xl text-slate-900 tracking-tighter uppercase italic">{bookingData.location.name}</h4>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1 uppercase text-[10px] shadow-sm">{bookingData.status}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium italic leading-none opacity-70">
                          <MapPin className="h-4 w-4 text-primary opacity-60" /> {bookingData.location.addressLine}
                        </p>
                      </div>
                      <div className="p-6 rounded-[1.5rem] bg-indigo-50/50 border border-indigo-100 flex items-center gap-6 group hover:bg-indigo-50 transition-all shadow-sm">
                        <div className="h-16 w-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100 group-hover:scale-110 transition-transform"><Calendar size={32} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-60 italic leading-none uppercase tracking-widest">Assignment context</p>
                          <p className="text-lg font-black text-slate-800 truncate uppercase tracking-tighter leading-none italic underline decoration-indigo-200 underline-offset-4 decoration-2">{bookingData.event.displayName}</p>
                          <p className="text-xs text-slate-400 mt-3 font-medium italic leading-none italic">{formatDateTime(bookingData.event.startDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex flex-col gap-8 text-left">
                <Card className="flex-1 bg-amber-500 p-8 text-white overflow-hidden shadow-xl border-none relative flex flex-col justify-center rounded-[2rem]">
                  <div className="absolute -top-6 -right-6 opacity-10 rotate-12 pointer-events-none"><Percent size={140} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2 leading-none uppercase tracking-widest italic">Platform Commission Result</p>
                  <p className="text-4xl font-black tabular-nums tracking-tighter drop-shadow-md italic leading-none font-mono">
                    {formatCurrency(parseFloat(bookingData.amountToPay) * parseFloat(bookingData.systemCutPercentage))}
                  </p>
                  <div className="mt-8 space-y-3 pt-6 border-t border-white/10 italic text-[10px] font-bold uppercase text-amber-100 opacity-70">
                    <div className="flex justify-between items-center leading-none">
                      <span>Gross Transaction Vol</span>
                      <span className="font-mono tabular-nums leading-none tracking-tight">{formatCurrency(bookingData.amountToPay)}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6 space-y-5 border-none shadow-sm ring-1 ring-slate-200 rounded-[1.5rem] bg-white">
                  <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-50 pb-3 italic text-center leading-none uppercase tracking-widest">Stakeholder Identity</h5>
                  <div className="flex items-center gap-4 group border-t border-slate-50 pt-4 cursor-default first:border-none first:pt-0">
                    <Avatar className="h-11 w-11 border-2 border-white shadow-md ring-1 ring-slate-100 shrink-0 transition-transform group-hover:scale-110"><AvatarImage src={bookingData.createdBy?.avatarUrl || ''} /></Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 opacity-70 tracking-widest italic uppercase leading-none">Client Identity</p>
                      <p className="text-[13px] font-black text-slate-800 truncate uppercase tracking-tighter leading-none italic">{bookingData.createdBy?.firstName}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-primary transition-all" onClick={() => router.push(`/admin/accounts/${bookingData.createdById}`)}><ExternalLink size={15} /></Button>
                  </div>
                  <div className="flex items-center gap-4 group border-t border-slate-50 pt-4 cursor-default">
                    <Avatar className="h-11 w-11 border-2 border-white shadow-md ring-1 ring-slate-100 shrink-0 transition-transform group-hover:scale-110"><AvatarImage src={bookingData.location.business?.avatar || ''} /></Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 opacity-70 tracking-widest italic uppercase leading-none">Provider Holder</p>
                      <p className="text-[13px] font-black text-slate-800 truncate uppercase tracking-tighter leading-none italic">{bookingData.location.business?.name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-primary transition-all" onClick={() => router.push(`/admin/accounts/${bookingData.location.businessId}`)}><ExternalLink size={15} /></Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* --- CASE: FALLBACK / DIRECT REVENUE (When referencedInitType is NULL) --- */}
          {!isLocationBooking && !isEventInit && !isTicketOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch animate-in fade-in duration-700">

              {/* Cột Trái: Thông tin đối soát từ Ghi chú (2/3 width) */}
              <div className="lg:col-span-2">
                <Card className="h-full border-none shadow-sm ring-1 ring-slate-200 bg-white rounded-[1.5rem] overflow-hidden flex flex-col md:flex-row">
                  {/* Sidebar Kỹ thuật */}
                  <div className="w-full md:w-72 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col">
                    <div className="p-4 rounded-2xl bg-white shadow-inner mb-6 flex items-center justify-center">
                      <ShieldCheck size={48} className="text-slate-300" />
                    </div>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Accounting Trace</p>
                        <div className="p-3 bg-white rounded-xl border border-slate-100 font-mono text-[10px] break-all leading-relaxed text-slate-500">
                          {transaction.id}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Type</span>
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold px-2">{transaction.type}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Nội dung chính: Phân tích ghi chú */}
                  <div className="p-8 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70 italic leading-none">Manual Liquidity Entry</h4>
                        <h4 className="font-black text-2xl text-slate-900 leading-tight tracking-tighter uppercase mb-6">Unstructured Transaction Data</h4>

                        <div className="p-6 rounded-[1.5rem] bg-slate-50 border-2 border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Receipt size={14} /> Official Record Note
                          </p>
                          <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                            &ldquo;{transaction.note || "No additional context provided for this manual transaction."}&rdquo;
                          </p>
                        </div>

                        {/* Gợi ý cho Admin: Trích xuất ID nếu có trong Note */}
                        {transaction.note?.includes("ID:") && (
                          <div className="mt-6 flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <Info size={16} className="text-amber-500" />
                            <p className="text-[11px] text-amber-700 font-medium tracking-tight">
                              Detected a reference ID in notes. Use the <b>Trace ID</b> for manual verification.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between opacity-50">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none tracking-[0.3em]">Operational Auditing</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200"></div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Cột Phải: Tài chính & Revenue (1/3 width) */}
              <div className="flex flex-col gap-6 text-left">
                <Card className="flex-1 bg-slate-900 p-8 text-white overflow-hidden shadow-xl border-none relative flex flex-col justify-center rounded-[2rem]">
                  <div className="absolute -top-6 -right-6 opacity-5 rotate-12 pointer-events-none"><Activity size={140} /></div>

                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2 leading-none italic">
                    Platform Net Impact
                  </p>

                  <p className="text-4xl font-black tabular-nums tracking-tighter drop-shadow-md italic leading-none font-mono text-emerald-400">
                    {formatCurrency(transaction.amount)}
                  </p>

                  <div className="mt-8 space-y-4 pt-6 border-t border-white/10 italic text-[10px] font-bold uppercase text-slate-500">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 text-center text-[9px] leading-relaxed">
                      This transaction was logged without an explicit reference type. Figures represent the net impact to the system revenue wallet.
                    </div>
                  </div>
                </Card>

                {/* Placeholder Stakeholder */}
                <Card className="p-6 border-none shadow-sm ring-1 ring-slate-200 rounded-[1.5rem] bg-white opacity-60 grayscale">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                      <User size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 opacity-70 tracking-widest italic uppercase">Stakeholder Offline</p>
                      <p className="text-[11px] font-bold text-slate-400 italic">No associated entity profile.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
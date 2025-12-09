'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  IconArrowLeft,
  IconUser,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconBriefcase,
  IconStar,
  IconActivity,
  IconReceipt,
  IconId,
  IconBuildingStore,
  IconBrandFacebook,
  IconWorld,
  IconWallet,
  IconCalendarStats,
  IconClock,
  IconLock,
  IconSettings,
  IconBell,
  IconMessageCircle,
  IconFileText,
  IconPhoto
} from '@tabler/icons-react';
import { useAccountById } from '@/hooks/admin/useAccountById';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { StatCard } from '@/components/shared/StatCard';
import { Separator } from '@/components/ui/separator';
import { Copy, CheckCircle2, XCircle, Calendar, Clock, User as UserIcon, Mail, Phone, MapPin, Wallet, Receipt, Star, MessageCircle, Lock as LockIcon, Settings, Bell, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: account, isLoading, error } = useAccountById(accountId);
  
  const currentTab = searchParams.get('tab') || 'profile';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-violet-100 text-violet-700 hover:bg-violet-100 border-violet-200';
      case 'BUSINESS_OWNER':
        return 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200';
      case 'EVENT_CREATOR':
        return 'bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <IconShieldCheck className="h-3 w-3 mr-1" />;
      case 'BUSINESS_OWNER':
        return <IconBriefcase className="h-3 w-3 mr-1" />;
      case 'EVENT_CREATOR':
        return <IconStar className="h-3 w-3 mr-1" />;
      default:
        return <IconUser className="h-3 w-3 mr-1" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Account not found</h2>
        <p className="text-muted-foreground">
          The account you are looking for does not exist or there was an error loading it.
        </p>
        <Link href="/admin/accounts">
          <Button variant="outline">
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </Link>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <PageContainer>
      {/* Professional Header */}
      <PageHeader
        title={`${account.firstName} ${account.lastName}`}
        description={account.email}
        icon={UserIcon}
        actions={
          <Link href="/admin/accounts">
            <Button variant="outline" className="h-11 border-2 border-primary/20">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Accounts
            </Button>
          </Link>
        }
      />

      {/* Enhanced Profile Card */}
      <Card className="overflow-hidden border-2 border-primary/10 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="p-0">
          <div className="relative">
            {/* Header Background */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            
            {/* Profile Content */}
            <div className="relative px-6 pb-6 -mt-16">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Section */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                      <AvatarImage src={account.avatarUrl || ''} alt={account.firstName} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                        {account.firstName[0]}
                        {account.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {(account as any).isLocked && (
                      <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg border-2 border-background">
                        <LockIcon className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-4 pt-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
                      {account.firstName} {account.lastName}
                      {(account as any).isLocked ? (
                        <Badge variant="destructive" className="h-6">
                          <LockIcon className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-6 bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <IconMail className="h-4 w-4" />
                        <span>{account.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => copyToClipboard(account.email, 'Email')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {account.phoneNumber && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <div className="flex items-center gap-1.5">
                            <IconPhone className="h-4 w-4" />
                            <span>{account.phoneNumber}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1"
                              onClick={() => copyToClipboard(account.phoneNumber || '', 'Phone')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <IconId className="h-4 w-4" />
                        <span>{account.id.substring(0, 8)}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1"
                          onClick={() => copyToClipboard(account.id, 'Account ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 text-sm font-medium ${getRoleBadgeStyles(account.role)}`}
                    >
                      {getRoleIcon(account.role)}
                      {account.role.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant={account.hasOnboarded ? "default" : "secondary"}
                      className={cn(
                        "px-3 py-1 text-sm font-medium",
                        account.hasOnboarded 
                          ? "bg-green-500 hover:bg-green-600 text-white" 
                          : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      )}
                    >
                      {account.hasOnboarded ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Onboarded
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Onboarding
                        </>
                      )}
                    </Badge>
                    {(account as any).createdAt && (
                      <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {format(new Date((account as any).createdAt), 'MMM yyyy')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wallet Balance"
          value="₫0"
          icon={Wallet}
        />
        <StatCard
          title="Total Bookings"
          value="0"
          icon={Calendar}
        />
        <StatCard
          title="Reviews"
          value="0"
          icon={Star}
        />
        <StatCard
          title="Support Tickets"
          value="0"
          icon={MessageCircle}
        />
      </div>

      {/* Content Section */}
      <div>
        <Tabs 
          value={currentTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
            {/* Tabs Content Area */}
            <div className="w-full">
              <TabsContent value="profile" className="mt-0 space-y-6">
              
              {/* Business Profile Section */}
              {account.businessProfile && (
                <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-primary/10 bg-gradient-to-r from-orange-50/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 shadow-md">
                        <IconBuildingStore className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                          Business Profile
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">Details for business account</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <IconBuildingStore className="h-3.5 w-3.5" />
                          Business Name
                        </label>
                        <p className="text-base font-semibold text-foreground">{account.businessProfile.name}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                        <div>
                          <Badge variant="secondary" className="rounded-md px-3 py-1 font-medium">
                            {account.businessProfile.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <IconMail className="h-3.5 w-3.5" />
                          Business Email
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{account.businessProfile.email}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(account.businessProfile?.email || '', 'Email')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <IconPhone className="h-3.5 w-3.5" />
                          Business Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{account.businessProfile.phone}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(account.businessProfile?.phone || '', 'Phone')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30 md:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          Address
                        </label>
                        <p className="text-sm font-medium">
                          {[
                            account.businessProfile.addressLine,
                            account.businessProfile.addressLevel1,
                            account.businessProfile.addressLevel2
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30 md:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-background/50 p-4 rounded-md border border-border/50">
                          {account.businessProfile.description || "No description provided."}
                        </p>
                      </div>
                      {account.businessProfile.website && (
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</label>
                          <a
                            href={account.businessProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 w-fit"
                          >
                            <IconWorld className="h-3.5 w-3.5" />
                            {account.businessProfile.website}
                          </a>
                        </div>
                      )}
                      {account.businessProfile.licenses && account.businessProfile.licenses.length > 0 && (
                        <div className="space-y-3 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <IconFileText className="h-3.5 w-3.5" />
                            Business Licenses
                          </label>
                          <div className="space-y-4">
                            {account.businessProfile.licenses.map((license: any, index: number) => (
                              <div key={index} className="border border-border rounded-lg p-4 bg-muted/20">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant="outline" className="font-medium">
                                    {license.licenseType?.replace(/_/g, ' ') || 'License'}
                                  </Badge>
                                </div>
                                {license.documentImageUrls && license.documentImageUrls.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {license.documentImageUrls.map((url: string, imgIndex: number) => (
                                      <a
                                        key={imgIndex}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative aspect-video rounded-md overflow-hidden border border-border hover:border-primary/50 transition-colors"
                                      >
                                        <img
                                          src={url}
                                          alt={`License document ${imgIndex + 1}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                          <IconPhoto className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Creator Profile Section */}
              {(account as any).creatorProfile && (
                <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4 border-b border-primary/10 bg-gradient-to-r from-pink-50/50 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 shadow-md">
                        <IconStar className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                          Creator Profile
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">Details for event creator account</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Star className="h-3.5 w-3.5" />
                          Display Name
                        </label>
                        <p className="text-base font-semibold text-foreground">{(account as any).creatorProfile.displayName}</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
                        <div>
                          <Badge variant="secondary" className="rounded-md px-3 py-1 font-medium">
                            {(account as any).creatorProfile.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          Contact Email
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{(account as any).creatorProfile.email}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard((account as any).creatorProfile?.email || '', 'Email')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          Contact Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{(account as any).creatorProfile.phoneNumber}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard((account as any).creatorProfile?.phoneNumber || '', 'Phone')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-primary/10 bg-muted/30 md:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio</label>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-background/50 p-4 rounded-md border border-border/50">
                          {(account as any).creatorProfile.description || "No bio provided."}
                        </p>
                      </div>
                      {(account as any).creatorProfile.social && (account as any).creatorProfile.social.length > 0 && (
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Social Links</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(account as any).creatorProfile.social.map((social: any, index: number) => (
                              <a
                                key={index}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-secondary-foreground text-xs font-medium hover:bg-secondary transition-colors"
                              >
                                {social.platform === 'Facebook' && <IconBrandFacebook className="h-3.5 w-3.5" />}
                                {social.platform}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State if no additional profiles */}
              {!account.businessProfile && !(account as any).creatorProfile && (
                <Card className="border-2 border-dashed border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-16 flex flex-col items-center justify-center text-center gap-4">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full border-2 border-primary/20">
                      <IconUser className="h-12 w-12 text-primary/50" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-foreground">Standard User Account</p>
                      <p className="text-sm mt-2 text-muted-foreground max-w-md">
                        This account does not have any associated business or creator profiles.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 shadow-md">
                      <IconReceipt className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Transaction History</CardTitle>
                      <CardDescription className="text-sm mt-1">Recent financial activity for this account</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-full mb-4 border-2 border-blue-500/20">
                    <IconReceipt className="h-12 w-12 text-blue-500/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">No transactions found</p>
                  <p className="text-sm mt-2">Transaction history feature is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 shadow-md">
                      <IconActivity className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Activity Log</CardTitle>
                      <CardDescription className="text-sm mt-1">System events and user actions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-full mb-4 border-2 border-purple-500/20">
                    <IconActivity className="h-12 w-12 text-purple-500/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">No activity recorded</p>
                  <p className="text-sm mt-2">Activity logging feature is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-red-50/50 to-transparent border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 shadow-md">
                      <LockIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Security Settings</CardTitle>
                      <CardDescription className="text-sm mt-1">Manage account security and access</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-full mb-4 border-2 border-red-500/20">
                    <LockIcon className="h-12 w-12 text-red-500/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">Security logs unavailable</p>
                  <p className="text-sm mt-2">Login history and security features are coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-50/50 to-transparent border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 shadow-md">
                      <IconMessageCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">User Content</CardTitle>
                      <CardDescription className="text-sm mt-1">Reviews, posts, and other user-generated content</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-full mb-4 border-2 border-green-500/20">
                    <IconMessageCircle className="h-12 w-12 text-green-500/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">No content found</p>
                  <p className="text-sm mt-2">Content moderation features are coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-amber-50/50 to-transparent border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 shadow-md">
                      <IconBell className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Notifications</CardTitle>
                      <CardDescription className="text-sm mt-1">System notifications sent to this user</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-full mb-4 border-2 border-amber-500/20">
                    <IconBell className="h-12 w-12 text-amber-500/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">No notifications</p>
                  <p className="text-sm mt-2">Notification history is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50/50 to-transparent border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500/20 to-slate-500/10 shadow-md">
                      <IconSettings className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Account Settings</CardTitle>
                      <CardDescription className="text-sm mt-1">Administrative actions for this account</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                  <div className="p-6 bg-gradient-to-br from-slate-500/10 to-slate-500/5 rounded-full mb-4 border-2 border-slate-500/20">
                    <IconSettings className="h-12 w-12 text-slate-500/50" />
                  </div>
                  <p className="font-semibold text-lg text-foreground">Settings unavailable</p>
                  <p className="text-sm mt-2">Account settings management is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </PageContainer>
    );
  }

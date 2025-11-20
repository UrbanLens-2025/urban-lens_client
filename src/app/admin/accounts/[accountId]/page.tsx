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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconFileText,
  IconPhoto
} from '@tabler/icons-react';
import { useAccountById } from '@/hooks/admin/useAccountById';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  
  const [isTabSidebarCollapsed, setIsTabSidebarCollapsed] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/accounts">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <IconArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Account Details</h1>
      </div>

      {/* Core Profile & Stats Card */}
      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left Side: User Info */}
            <div className="p-6 md:p-8 flex-1 flex flex-col md:flex-row gap-6 items-start md:items-center border-b md:border-b-0 md:border-r border-border/50">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl ring-1 ring-border/10">
                <AvatarImage src={account.avatarUrl || ''} alt={account.firstName} />
                <AvatarFallback className="text-2xl font-bold bg-primary/5 text-primary">
                  {account.firstName[0]}
                  {account.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-3 flex-1">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    {account.firstName} {account.lastName}
                    {account.isLocked && <IconShieldCheck className="h-5 w-5 text-red-500" />}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <IconMail className="h-3.5 w-3.5" /> {account.email}
                    <span className="text-border mx-1">|</span>
                    <IconPhone className="h-3.5 w-3.5" /> {account.phoneNumber || 'N/A'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={`px-2.5 py-0.5 ${getRoleBadgeStyles(account.role)}`}
                  >
                    {getRoleIcon(account.role)}
                    {account.role.replace('_', ' ')}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={account.hasOnboarded ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-slate-100 text-slate-600"}
                  >
                    {account.hasOnboarded ? 'Onboarded' : 'Pending Onboarding'}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                    ID: {account.id.substring(0, 8)}...
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right Side: Key Stats (Placeholder for now) */}
            <div className="p-6 md:p-8 w-full md:w-[320px] bg-muted/30 flex flex-col justify-center gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconWallet className="h-4 w-4" /> Wallet Balance
                </div>
                <span className="font-bold text-lg font-mono">₫0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconCalendarStats className="h-4 w-4" /> Total Bookings
                </div>
                <span className="font-bold text-lg">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconClock className="h-4 w-4" /> Last Active
                </div>
                <span className="text-sm font-medium">Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Tabs 
          value={currentTab} 
          onValueChange={handleTabChange}
          orientation="vertical" 
          className="lg:col-span-12 flex flex-col lg:flex-row gap-6"
        >
          {/* Vertical Tabs List Sidebar */}
          <div className={cn(
            "flex flex-col transition-all duration-300 ease-in-out self-start sticky top-6 gap-2 border-r border-border/50 bg-muted/10 rounded-lg py-4",
            isTabSidebarCollapsed ? "w-16 items-center px-2" : "w-full lg:w-52 pr-4"
          )}>
            <div className="flex justify-end mb-2 hidden lg:flex px-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsTabSidebarCollapsed(!isTabSidebarCollapsed)}
                className="h-8 w-8 text-muted-foreground hover:bg-muted"
              >
                {isTabSidebarCollapsed ? <IconLayoutSidebarLeftExpand className="h-4 w-4" /> : <IconLayoutSidebarLeftCollapse className="h-4 w-4" />}
              </Button>
            </div>

            <TabsList className={cn(
              "flex flex-row lg:flex-col h-auto bg-transparent p-0 w-full overflow-x-auto lg:overflow-visible",
              isTabSidebarCollapsed ? "items-center gap-3" : "gap-1"
            )}>
              <TooltipProvider delayDuration={0}>
                {[
                  { value: "profile", icon: IconUser, label: "Profile Details" },
                  { value: "security", icon: IconLock, label: "Security" },
                  { value: "transactions", icon: IconReceipt, label: "Transactions" },
                  { value: "content", icon: IconMessageCircle, label: "Content" },
                  { value: "activity", icon: IconActivity, label: "Activity Log" },
                  { value: "notifications", icon: IconBell, label: "Notifications" },
                  { value: "settings", icon: IconSettings, label: "Settings" },
                ].map((tab) => (
                  <Tooltip key={tab.value}>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value={tab.value}
                        className={cn(
                          "h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 hover:bg-muted/50 transition-all rounded-md",
                          isTabSidebarCollapsed 
                            ? "w-12 h-12 p-0 justify-center" 
                            : "w-full justify-start px-4 py-3"
                        )}
                      >
                        <tab.icon className={cn(isTabSidebarCollapsed ? "h-7 w-7" : "h-5 w-5", !isTabSidebarCollapsed && "mr-3")} />
                        {!isTabSidebarCollapsed && <span className="font-medium">{tab.label}</span>}
                      </TabsTrigger>
                    </TooltipTrigger>
                    {isTabSidebarCollapsed && (
                      <TooltipContent side="right">
                        {tab.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </TooltipProvider>
            </TabsList>
          </div>

          {/* Tabs Content Area */}
          <div className="flex-1 min-w-0">
            {/* Small Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-muted/20 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Total Spent</span>
                  <span className="text-lg font-bold">₫0</span>
                </CardContent>
              </Card>
              <Card className="bg-muted/20 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Active Days</span>
                  <span className="text-lg font-bold">12</span>
                </CardContent>
              </Card>
              <Card className="bg-muted/20 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Reviews</span>
                  <span className="text-lg font-bold">0</span>
                </CardContent>
              </Card>
              <Card className="bg-muted/20 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Support</span>
                  <span className="text-lg font-bold">0</span>
                </CardContent>
              </Card>
            </div>

            <TabsContent value="profile" className="mt-0 space-y-6">
              
              {/* Business Profile Section */}
              {account.businessProfile && (
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <IconBuildingStore className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle>Business Profile</CardTitle>
                        <CardDescription>Details for business account</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business Name</label>
                        <p className="text-sm font-medium text-foreground">{account.businessProfile.name}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                        <div><Badge variant="secondary" className="rounded-sm">{account.businessProfile.category}</Badge></div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business Email</label>
                        <p className="text-sm">{account.businessProfile.email}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business Phone</label>
                        <p className="text-sm">{account.businessProfile.phone}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</label>
                        <p className="text-sm">
                          {[
                            account.businessProfile.addressLine,
                            account.businessProfile.addressLevel1,
                            account.businessProfile.addressLevel2
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
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
              {account.creatorProfile && (
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <IconStar className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <CardTitle>Creator Profile</CardTitle>
                        <CardDescription>Details for event creator account</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</label>
                        <p className="text-sm font-medium">{account.creatorProfile.displayName}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                        <div><Badge variant="secondary" className="rounded-sm">{account.creatorProfile.type}</Badge></div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Email</label>
                        <p className="text-sm">{account.creatorProfile.email}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Phone</label>
                        <p className="text-sm">{account.creatorProfile.phoneNumber}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bio</label>
                        <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                          {account.creatorProfile.description || "No bio provided."}
                        </p>
                      </div>
                      {account.creatorProfile.social && account.creatorProfile.social.length > 0 && (
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Social Links</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {account.creatorProfile.social.map((social: any, index: number) => (
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
              {!account.businessProfile && !account.creatorProfile && (
                <Card className="border-dashed">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                    <div className="p-3 bg-muted rounded-full">
                      <IconUser className="h-6 w-6 opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Standard User Account</p>
                      <p className="text-sm mt-1">This account does not have any associated business or creator profiles.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="transactions" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Recent financial activity for this account</CardDescription>
                </CardHeader>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <IconReceipt className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">No transactions found</p>
                  <p className="text-sm mt-1">Transaction history feature is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                  <CardDescription>System events and user actions</CardDescription>
                </CardHeader>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <IconActivity className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">No activity recorded</p>
                  <p className="text-sm mt-1">Activity logging feature is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage account security and access</CardDescription>
                </CardHeader>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <IconLock className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">Security logs unavailable</p>
                  <p className="text-sm mt-1">Login history and security features are coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>User Content</CardTitle>
                  <CardDescription>Reviews, posts, and other user-generated content</CardDescription>
                </CardHeader>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <IconMessageCircle className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">No content found</p>
                  <p className="text-sm mt-1">Content moderation features are coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>System notifications sent to this user</CardDescription>
                </CardHeader>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <IconBell className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">No notifications</p>
                  <p className="text-sm mt-1">Notification history is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Administrative actions for this account</CardDescription>
                </CardHeader>
                <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <IconSettings className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="font-medium">Settings unavailable</p>
                  <p className="text-sm mt-1">Account settings management is coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

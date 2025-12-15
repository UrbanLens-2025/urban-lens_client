'use client';

import { use, useState, useMemo, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable } from '@/components/shared/DataTable';
import { useAccountSuspensions } from '@/hooks/admin/useAccountSuspensions';
import { useAccountWarnings } from '@/hooks/admin/useAccountWarnings';
import { useSuspendAccount } from '@/hooks/admin/useSuspendAccount';
import { useLiftSuspension } from '@/hooks/admin/useLiftSuspension';
import { useCreateWarning } from '@/hooks/admin/useCreateWarning';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  IconPhoto,
  IconAlertTriangle,
  IconBan,
} from '@tabler/icons-react';
import { useAccountById } from '@/hooks/admin/useAccountById';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Receipt,
  Star,
  MessageCircle,
  Lock as LockIcon,
  Settings,
  Bell,
  Activity,
  Plus,
  Loader2,
  MoreVertical,
  Unlock,
} from 'lucide-react';
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
  console.log('🚀 ~ AdminAccountDetailPage ~ account:', account);

  const currentTab = searchParams.get('tab') || 'warnings';

  // Warnings state
  const [warningsPage, setWarningsPage] = useState(1);
  const [warningsSearch, setWarningsSearch] = useState('');
  const [debouncedWarningsSearch] = useDebounce(warningsSearch, 300);
  const [warningsSort, setWarningsSort] = useState<{
    column: string;
    direction: 'ASC' | 'DESC';
  }>({ column: 'createdAt', direction: 'DESC' });
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Suspensions state
  const [suspensionsPage, setSuspensionsPage] = useState(1);
  const [suspensionsSearch, setSuspensionsSearch] = useState('');
  const [debouncedSuspensionsSearch] = useDebounce(suspensionsSearch, 300);
  const [suspensionsStatusFilter, setSuspensionsStatusFilter] = useState<
    string
  >('all');
  const [suspensionsSort, setSuspensionsSort] = useState<{
    column: string;
    direction: 'ASC' | 'DESC';
  }>({ column: 'suspendedUntil', direction: 'DESC' });
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspensionToLift, setSuspensionToLift] = useState<{ id: string; reason: string | null } | null>(null);

  const suspendAccountMutation = useSuspendAccount();
  const liftSuspensionMutation = useLiftSuspension();
  const createWarningMutation = useCreateWarning();

  // Reset page when search changes
  useEffect(() => {
    setWarningsPage(1);
  }, [debouncedWarningsSearch]);

  useEffect(() => {
    setSuspensionsPage(1);
  }, [debouncedSuspensionsSearch]);

  const {
    data: warningsData,
    isLoading: isLoadingWarnings,
  } = useAccountWarnings({
    accountId,
    page: warningsPage,
    limit: 20,
    sortBy: `${warningsSort.column}:${warningsSort.direction}`,
    search: debouncedWarningsSearch || undefined,
  });

  const {
    data: suspensionsDataRaw,
    isLoading: isLoadingSuspensions,
  } = useAccountSuspensions({
    accountId,
    page: suspensionsPage,
    limit: 20,
    sortBy: `${suspensionsSort.column}:${suspensionsSort.direction}`,
    search: debouncedSuspensionsSearch || undefined,
    isActive: undefined, // Fetch all, filter client-side
  });

  // Compute client-side status and filter
  const suspensionsData = useMemo(() => {
    if (!suspensionsDataRaw) return suspensionsDataRaw;

    const now = new Date();
    const filtered = suspensionsDataRaw.data.filter((suspension) => {
      if (suspensionsStatusFilter === 'all') return true;

      const suspendedUntil = suspension.suspendedUntil ? new Date(suspension.suspendedUntil) : null;
      const isExpired = suspendedUntil && suspendedUntil < now;
      const status = isExpired 
        ? 'EXPIRED' 
        : suspension.isActive 
          ? 'ACTIVE' 
          : 'LIFTED';

      return status === suspensionsStatusFilter.toUpperCase();
    });

    return {
      ...suspensionsDataRaw,
      data: filtered,
      meta: {
        ...suspensionsDataRaw.meta,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / 20),
      },
    };
  }, [suspensionsDataRaw, suspensionsStatusFilter]);

  // Suspend form schema
  const suspendSchema = z.object({
    suspensionReason: z.string().min(1, 'Suspension reason is required'),
    suspendUntil: z.string().min(1, 'Suspension end date is required'),
  });

  type SuspendFormValues = z.infer<typeof suspendSchema>;

  const suspendForm = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendSchema),
    defaultValues: {
      suspensionReason: '',
      suspendUntil: '',
    },
  });

  const onSuspendSubmit = (values: SuspendFormValues) => {
    suspendAccountMutation.mutate(
      {
        accountId,
        payload: {
          suspensionReason: values.suspensionReason,
          suspendUntil: new Date(values.suspendUntil).toISOString(),
        },
      },
      {
        onSuccess: () => {
          setIsSuspendModalOpen(false);
          suspendForm.reset();
        },
      }
    );
  };

  // Warning form schema
  const warningSchema = z.object({
    warningNote: z.string().min(1, 'Warning note is required'),
  });

  type WarningFormValues = z.infer<typeof warningSchema>;

  const warningForm = useForm<WarningFormValues>({
    resolver: zodResolver(warningSchema),
    defaultValues: {
      warningNote: '',
    },
  });

  const onWarningSubmit = (values: WarningFormValues) => {
    createWarningMutation.mutate(
      {
        accountId,
        payload: {
          warningNote: values.warningNote,
        },
      },
      {
        onSuccess: () => {
          setIsWarningModalOpen(false);
          warningForm.reset();
        },
      }
    );
  };

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
        return <IconShieldCheck className='h-3 w-3 mr-1' />;
      case 'BUSINESS_OWNER':
        return <IconBriefcase className='h-3 w-3 mr-1' />;
      case 'EVENT_CREATOR':
        return <IconStar className='h-3 w-3 mr-1' />;
      default:
        return <IconUser className='h-3 w-3 mr-1' />;
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10 rounded-md' />
          <div className='space-y-2'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>
        <Skeleton className='h-[200px] w-full rounded-xl' />
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          <Skeleton className='h-[400px] w-full rounded-xl' />
          <Skeleton className='h-[400px] w-full rounded-xl lg:col-span-3' />
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[50vh] gap-4'>
        <h2 className='text-2xl font-bold'>Account not found</h2>
        <p className='text-muted-foreground'>
          The account you are looking for does not exist or there was an error
          loading it.
        </p>
        <Link href='/admin/accounts'>
          <Button variant='outline'>
            <IconArrowLeft className='mr-2 h-4 w-4' />
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
      

      {/* Enhanced Profile Card */}
      <Card className='overflow-hidden border-2 border-primary/10 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 pt-0'>
        <CardContent className='p-0'>
          <div className='relative'>
            {/* Header Background */}
            <div className='h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent' />
            <div className='absolute top-4 left-4'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => router.back()}
              >
                <IconArrowLeft className='h-4 w-4' />
              </Button>
            </div>

            {/* Profile Content */}
            <div className='relative px-6 pb-6 -mt-16'>
              <div className='flex flex-col md:flex-row gap-6'>
                {/* Avatar Section */}
                <div className='flex-shrink-0'>
                  <div className='relative'>
                    <Avatar className='h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-primary/10'>
                      <AvatarImage
                        src={account.avatarUrl || ''}
                        alt={account.firstName}
                      />
                      <AvatarFallback className='text-3xl font-bold bg-gradient-to-br from-primary/20 to-primary/10 text-primary'>
                        {account.firstName[0]}
                        {account.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {(account as any).isLocked && (
                      <div className='absolute -bottom-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg border-2 border-background'>
                        <LockIcon className='h-4 w-4 text-white' />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className='flex-1 space-y-4 pt-4'>
                  <div>
                    <h2 className='text-3xl font-bold text-foreground flex items-center gap-3 mb-2'>
                      {account.firstName} {account.lastName}
                      {(account as any).isLocked ? (
                        <Badge variant='destructive' className='h-6'>
                          <LockIcon className='h-3 w-3 mr-1' />
                          Locked
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='h-6 bg-green-50 text-green-700 border-green-200'
                        >
                          <CheckCircle2 className='h-3 w-3 mr-1' />
                          Active
                        </Badge>
                      )}
                    </h2>
                    <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-1.5'>
                        <IconMail className='h-4 w-4' />
                        <span>{account.email}</span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-5 w-5 ml-1'
                          onClick={() =>
                            copyToClipboard(account.email, 'Email')
                          }
                        >
                          <Copy className='h-3 w-3' />
                        </Button>
                      </div>
                      {account.phoneNumber && (
                        <>
                          <Separator orientation='vertical' className='h-4' />
                          <div className='flex items-center gap-1.5'>
                            <IconPhone className='h-4 w-4' />
                            <span>{account.phoneNumber}</span>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-5 w-5 ml-1'
                              onClick={() =>
                                copyToClipboard(
                                  account.phoneNumber || '',
                                  'Phone'
                                )
                              }
                            >
                              <Copy className='h-3 w-3' />
                            </Button>
                          </div>
                        </>
                      )}
                      <Separator orientation='vertical' className='h-4' />
                      <div className='flex items-center gap-1.5 font-mono text-xs'>
                        <IconId className='h-4 w-4' />
                        <span>{account.id.substring(0, 8)}...</span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-5 w-5 ml-1'
                          onClick={() =>
                            copyToClipboard(account.id, 'Account ID')
                          }
                        >
                          <Copy className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    <Badge
                      variant='outline'
                      className={`px-3 py-1 text-sm font-medium ${getRoleBadgeStyles(
                        account.role
                      )}`}
                    >
                      {getRoleIcon(account.role)}
                      {account.role.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant={account.hasOnboarded ? 'default' : 'secondary'}
                      className={cn(
                        'px-3 py-1 text-sm font-medium',
                        account.hasOnboarded
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      )}
                    >
                      {account.hasOnboarded ? (
                        <>
                          <CheckCircle2 className='h-3 w-3 mr-1' />
                          Onboarded
                        </>
                      ) : (
                        <>
                          <Clock className='h-3 w-3 mr-1' />
                          Pending Onboarding
                        </>
                      )}
                    </Badge>
                    {(account as any).createdAt && (
                      <Badge
                        variant='outline'
                        className='px-3 py-1 text-sm font-medium'
                      >
                        <Calendar className='h-3 w-3 mr-1' />
                        Joined{' '}
                        {format(
                          new Date((account as any).createdAt),
                          'MMM yyyy'
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Section */}
      <div>
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2 mb-6'>
            <TabsTrigger value='warnings' className='flex items-center gap-2'>
              <IconAlertTriangle className='h-4 w-4' />
              Warnings
            </TabsTrigger>
            <TabsTrigger value='suspensions' className='flex items-center gap-2'>
              <IconBan className='h-4 w-4' />
              Suspensions
            </TabsTrigger>
          </TabsList>
          {/* Tabs Content Area */}
          <div className='w-full'>
            <TabsContent value='warnings' className='mt-0'>
              <DataTable
                columns={[
                  { key: 'number', label: '#', sortable: false, className: 'text-center' },
                  { key: 'warningNote', label: 'Warning Note', sortable: false },
                  { key: 'createdBy', label: 'Created By', sortable: false },
                  {
                    key: 'createdAt',
                    label: 'Created At',
                    sortable: true,
                  },
                ]}
                data={warningsData?.data || []}
                isLoading={isLoadingWarnings}
                searchValue={warningsSearch}
                onSearchChange={setWarningsSearch}
                searchPlaceholder='Search by warning note...'
                sort={warningsSort}
                onSort={(column, direction) => {
                  if (direction) {
                    setWarningsSort({ column, direction });
                  }
                }}
                actions={
                  <Button
                    onClick={() => setIsWarningModalOpen(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Create Warning
                  </Button>
                }
                emptyState={{
                  icon: <IconAlertTriangle className='h-12 w-12 text-amber-500/50' />,
                  title: 'No warnings found',
                  description: 'This account has no warning history.',
                }}
                renderRow={(warning, index) => (
                  <TableRow key={warning.id}>
                    <TableCell className="text-center">
                      {(warningsPage - 1) * 20 + index + 1}
                    </TableCell>
                    <TableCell className='max-w-md'>
                      <div className='truncate' title={warning.warningNote || 'N/A'}>
                        {warning.warningNote || (
                          <span className='text-muted-foreground'>N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {warning.createdBy ? (
                        <div>
                          <div className='font-medium'>
                            {warning.createdBy.firstName}{' '}
                            {warning.createdBy.lastName}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {warning.createdBy.email}
                          </div>
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(warning.createdAt), 'PPp')}
                    </TableCell>
                  </TableRow>
                )}
                pagination={
                  warningsData?.meta &&
                  warningsData.meta.totalPages > 1 ? (
                    <div className='flex items-center justify-between'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setWarningsPage(warningsPage - 1)}
                        disabled={warningsPage <= 1}
                      >
                        Previous
                      </Button>
                      <div className='text-sm text-muted-foreground'>
                        Page {warningsPage} of{' '}
                        {warningsData.meta.totalPages} (
                        {warningsData.meta.totalItems} total)
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setWarningsPage(warningsPage + 1)}
                        disabled={
                          warningsPage >= warningsData.meta.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  ) : undefined
                }
              />

              {/* Create Warning Modal */}
              <Dialog open={isWarningModalOpen} onOpenChange={setIsWarningModalOpen}>
                <DialogContent className='sm:max-w-[500px]'>
                  <DialogHeader>
                    <DialogTitle>Create Warning</DialogTitle>
                    <DialogDescription>
                      Add a warning note for this account. This will be recorded in the account&apos;s warning history.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...warningForm}>
                    <form
                      onSubmit={warningForm.handleSubmit(onWarningSubmit)}
                      className='space-y-4'
                    >
                      <FormField
                        control={warningForm.control}
                        name='warningNote'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warning Note *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Enter the warning note...'
                                rows={4}
                                {...field}
                                className='resize-none'
                              />
                            </FormControl>
                            <FormDescription>
                              Provide a clear warning note for this account.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            setIsWarningModalOpen(false);
                            warningForm.reset();
                          }}
                          disabled={createWarningMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          type='submit'
                          disabled={createWarningMutation.isPending}
                        >
                          {createWarningMutation.isPending ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Creating...
                            </>
                          ) : (
                            'Create Warning'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value='suspensions' className='mt-0'>
              <DataTable
                columns={[
                  { key: 'number', label: '#', sortable: false, className: 'text-center' },
                  { key: 'suspensionReason', label: 'Reason', sortable: false },
                  {
                    key: 'suspendedUntil',
                    label: 'Suspended Until',
                    sortable: true,
                  },
                  { key: 'suspendedBy', label: 'Suspended By', sortable: false },
                  { key: 'isActive', label: 'Status', sortable: false },
                  {
                    key: 'createdAt',
                    label: 'Created At',
                    sortable: true,
                  },
                  { key: 'actions', label: '', sortable: false },
                ]}
                data={suspensionsData?.data || []}
                isLoading={isLoadingSuspensions}
                searchValue={suspensionsSearch}
                onSearchChange={setSuspensionsSearch}
                searchPlaceholder='Search by reason...'
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    value: suspensionsStatusFilter,
                    options: [
                      { value: 'all', label: 'All' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'LIFTED', label: 'Lifted' },
                      { value: 'EXPIRED', label: 'Expired' },
                    ],
                    onValueChange: setSuspensionsStatusFilter,
                  },
                ]}
                sort={suspensionsSort}
                onSort={(column, direction) => {
                  if (direction) {
                    setSuspensionsSort({ column, direction });
                  }
                }}
                actions={
                  <Button
                    onClick={() => setIsSuspendModalOpen(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Add Suspension
                  </Button>
                }
                emptyState={{
                  icon: <IconBan className='h-12 w-12 text-red-500/50' />,
                  title: 'No suspensions found',
                  description: 'This account has no suspension history.',
                }}
                renderRow={(suspension, index) => {
                  const now = new Date();
                  const suspendedUntil = suspension.suspendedUntil ? new Date(suspension.suspendedUntil) : null;
                  const isExpired = suspendedUntil && suspendedUntil < now;
                  const status = isExpired 
                    ? 'EXPIRED' 
                    : suspension.isActive 
                      ? 'ACTIVE' 
                      : 'LIFTED';

                  const badgeConfig = {
                    EXPIRED: {
                      variant: 'secondary' as const,
                      className: 'bg-slate-700 hover:bg-slate-800 text-white font-semibold border-slate-600',
                      label: 'Expired',
                    },
                    ACTIVE: {
                      variant: 'destructive' as const,
                      className: 'bg-red-500 hover:bg-red-600',
                      label: 'Active',
                    },
                    LIFTED: {
                      variant: 'secondary' as const,
                      className: 'bg-orange-500 hover:bg-orange-600 text-white font-semibold border-orange-400',
                      label: 'Lifted',
                    },
                  };

                  const config = badgeConfig[status as keyof typeof badgeConfig];

                  return (
                    <TableRow 
                      key={suspension.id}
                      className={status === 'ACTIVE' ? 'bg-red-50/50 hover:bg-red-50' : ''}
                    >
                      <TableCell className="text-center">
                        {(suspensionsPage - 1) * 20 + index + 1}
                      </TableCell>
                      <TableCell className='max-w-md'>
                        <div className='truncate' title={suspension.suspensionReason || 'N/A'}>
                          {suspension.suspensionReason || (
                            <span className='text-muted-foreground'>N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {suspension.suspendedUntil ? (
                          format(new Date(suspension.suspendedUntil), 'PPp')
                        ) : (
                          <span className='text-muted-foreground'>N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {suspension.suspendedBy ? (
                          <div>
                            <div className='font-medium'>
                              {suspension.suspendedBy.firstName}{' '}
                              {suspension.suspendedBy.lastName}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {suspension.suspendedBy.email}
                            </div>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={config.variant}
                          className={config.className}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                    <TableCell>
                      {format(new Date(suspension.createdAt), 'PPp')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            className='h-8 w-8 p-0'
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              onClick={() => setSuspensionToLift({ id: suspension.id, reason: suspension.suspensionReason })}
                              className='text-orange-600 focus:text-orange-600'
                            >
                              <Unlock className='mr-2 h-4 w-4' />
                              Lift
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                }}
                pagination={
                  suspensionsData?.meta &&
                  suspensionsData.meta.totalPages > 1 ? (
                    <div className='flex items-center justify-between'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setSuspensionsPage(suspensionsPage - 1)}
                        disabled={suspensionsPage <= 1}
                      >
                        Previous
                      </Button>
                      <div className='text-sm text-muted-foreground'>
                        Page {suspensionsPage} of{' '}
                        {suspensionsData.meta.totalPages} (
                        {suspensionsData.meta.totalItems} total)
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setSuspensionsPage(suspensionsPage + 1)}
                        disabled={
                          suspensionsPage >= suspensionsData.meta.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  ) : undefined
                }
              />

              {/* Suspend Account Modal */}
              <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
                <DialogContent className='sm:max-w-[500px]'>
                  <DialogHeader>
                    <DialogTitle>Suspend Account</DialogTitle>
                    <DialogDescription>
                      Suspend this account until a specified date. The account will be unable to access the platform during this period.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...suspendForm}>
                    <form
                      onSubmit={suspendForm.handleSubmit(onSuspendSubmit)}
                      className='space-y-4'
                    >
                      <FormField
                        control={suspendForm.control}
                        name='suspensionReason'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suspension Reason *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='Enter the reason for suspension...'
                                rows={4}
                                {...field}
                                className='resize-none'
                              />
                            </FormControl>
                            <FormDescription>
                              Provide a clear reason for suspending this account.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={suspendForm.control}
                        name='suspendUntil'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Suspended Until *</FormLabel>
                            <FormControl>
                              <Input
                                type='datetime-local'
                                {...field}
                                className='h-11'
                                min={new Date().toISOString().slice(0, 16)}
                              />
                            </FormControl>
                            <FormDescription>
                              Select the date and time when the suspension should end.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            setIsSuspendModalOpen(false);
                            suspendForm.reset();
                          }}
                          disabled={suspendAccountMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          type='submit'
                          disabled={suspendAccountMutation.isPending}
                        >
                          {suspendAccountMutation.isPending ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Suspending...
                            </>
                          ) : (
                            'Suspend Account'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Lift Suspension Confirmation Dialog */}
              <AlertDialog
                open={!!suspensionToLift}
                onOpenChange={(open) => !open && setSuspensionToLift(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lift Suspension</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to lift this suspension? This action is irreversible.
                      {suspensionToLift?.reason && (
                        <div className='mt-2 p-3 bg-muted rounded-md'>
                          <p className='text-sm font-medium mb-1'>Suspension Reason:</p>
                          <p className='text-sm text-muted-foreground'>{suspensionToLift.reason}</p>
                        </div>
                      )}
                      <p className='mt-3 text-sm font-medium text-amber-600'>
                        Note: If you need to suspend this account again, you must create a new suspension.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={liftSuspensionMutation.isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (suspensionToLift) {
                          liftSuspensionMutation.mutate(
                            {
                              accountId,
                              suspensionId: suspensionToLift.id,
                            },
                            {
                              onSuccess: () => {
                                setSuspensionToLift(null);
                              },
                            }
                          );
                        }
                      }}
                      disabled={liftSuspensionMutation.isPending}
                      className='bg-orange-600 hover:bg-orange-700'
                    >
                      {liftSuspensionMutation.isPending ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Lifting...
                        </>
                      ) : (
                        'Lift Suspension'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageContainer>
  );
}

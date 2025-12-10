'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { IconRefresh, IconSearch, IconEdit } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';
import { useSystemConfigValues, useUpdateSystemConfigValue } from '@/hooks/admin/useSystemConfig';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { SystemConfigValue } from '@/api/admin';

// Map system config keys to readable labels
const getConfigKeyLabel = (key: string): string => {
  const keyMap: Record<string, string> = {
    LOCATION_BOOKING_SYSTEM_PAYOUT_PERCENTAGE: 'Location Booking System Payout Percentage',
    EVENT_SYSTEM_PAYOUT_PERCENTAGE: 'Event System Payout Percentage',
    LOCATION_BOOKING_FORCE_CANCELLATION_FINE_PERCENTAGE: 'Location Booking Force Cancellation Fine Percentage',
  };

  return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

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
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
};

const createUpdateConfigSchema = (key: string) => {
  const isPercentage = key.includes('PERCENTAGE');
  
  if (isPercentage) {
    return z.object({
      value: z
        .string()
        .min(1, 'Value is required')
        .refine(
          (val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 1;
          },
          {
            message: 'Percentage value must be between 0 and 1',
          }
        ),
    });
  }
  
  return z.object({
    value: z.string().min(1, 'Value is required'),
  });
};

type UpdateConfigFormValues = {
  value: string;
};

export default function SystemConfigurationPage() {
  const queryClient = useQueryClient();
  const { data: configValues, isLoading, isFetching } = useSystemConfigValues();
  const { mutate: updateConfig, isPending: isUpdating } = useUpdateSystemConfigValue();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [editingConfig, setEditingConfig] = useState<SystemConfigValue | null>(null);

  const form = useForm<UpdateConfigFormValues>({
    resolver: zodResolver(z.object({ value: z.string().min(1, 'Value is required') })),
    defaultValues: {
      value: '',
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminSystemConfigValues'] });
  };

  const handleEdit = (config: SystemConfigValue) => {
    setEditingConfig(config);
    // Update form resolver based on the config key
    form.clearErrors();
    // Convert value to string for the form (handles both number and string values)
    form.reset({ value: String(config.value) });
  };

  const handleCloseDialog = () => {
    setEditingConfig(null);
    form.reset();
  };

  const onSubmit = (values: UpdateConfigFormValues) => {
    if (!editingConfig) return;

    // Check if value has changed
    const originalValue = String(editingConfig.value);
    const newValue = values.value.trim();
    
    if (originalValue === newValue) {
      form.setError('value', {
        type: 'manual',
        message: 'Value has not changed',
      });
      return;
    }

    // Validate percentage values
    const isPercentage = editingConfig.key.includes('PERCENTAGE');
    if (isPercentage) {
      const numValue = parseFloat(newValue);
      if (isNaN(numValue) || numValue < 0 || numValue > 1) {
        form.setError('value', {
          type: 'manual',
          message: 'Percentage value must be between 0 and 1',
        });
        return;
      }
    }

    updateConfig(
      {
        key: editingConfig.key,
        payload: { value: newValue },
      },
      {
        onSuccess: () => {
          handleCloseDialog();
        },
      }
    );
  };

  // Filter and search logic
  const filteredConfigValues = useMemo(() => {
    if (!configValues) return [];

    let filtered = configValues;

    // Apply search filter - search by label, key, and value
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((config) => {
        const valueStr = String(config.value).toLowerCase();
        const labelStr = getConfigKeyLabel(config.key).toLowerCase();
        return (
          labelStr.includes(searchLower) ||
          config.key.toLowerCase().includes(searchLower) ||
          valueStr.includes(searchLower)
        );
      });
    }

    // Sort by label
    filtered = [...filtered].sort((a, b) => {
      const labelA = getConfigKeyLabel(a.key).toLowerCase();
      const labelB = getConfigKeyLabel(b.key).toLowerCase();
      return labelA.localeCompare(labelB);
    });

    return filtered;
  }, [configValues, debouncedSearchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Config Table</h1>
        <p className="text-muted-foreground mt-1">
          View and manage system configuration values
        </p>
      </div>

      {/* Table Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading...'
                  : `Showing ${filteredConfigValues.length} of ${configValues?.length || 0} configuration values`}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by label, key, or value..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-[300px] h-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isFetching}
                className="w-full sm:w-auto h-10"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconRefresh className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && !configValues ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border-t overflow-hidden">
              <Table className="[&_tbody_tr:last-child]:border-b-0">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16 font-semibold pl-6">#</TableHead>
                    <TableHead className="font-semibold">Label</TableHead>
                    <TableHead className="font-semibold">Value</TableHead>
                    <TableHead className="font-semibold">Updated By</TableHead>
                    <TableHead className="font-semibold">Updated At</TableHead>
                    <TableHead className="w-24 font-semibold pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigValues.length > 0 ? (
                    filteredConfigValues.map((config, index) => (
                      <TableRow key={config.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-muted-foreground font-medium pl-6">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getConfigKeyLabel(config.key)}
                        </TableCell>
                        <TableCell className="font-mono text-sm break-all">
                          {config.value}
                        </TableCell>
                        <TableCell className="text-sm">
                          {config.updatedBy ? (
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {config.updatedBy.firstName} {config.updatedBy.lastName}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {config.updatedBy.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getRelativeTime(config.updatedAt)}
                        </TableCell>
                        <TableCell className="pr-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(config)}
                            className="h-8 w-8 p-0"
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        {debouncedSearchTerm
                          ? 'No configuration values match your search'
                          : 'No configuration values found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update System Configuration</DialogTitle>
            <DialogDescription>
              {editingConfig && `Update the value for "${getConfigKeyLabel(editingConfig.key)}"`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => {
                  const isPercentage = editingConfig?.key.includes('PERCENTAGE');
                  return (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            isPercentage
                              ? 'Enter value between 0 and 1 (e.g., 0.15 for 15%)'
                              : 'Enter configuration value'
                          }
                          className="font-mono"
                          type={isPercentage ? 'number' : 'text'}
                          step={isPercentage ? '0.01' : undefined}
                          min={isPercentage ? '0' : undefined}
                          max={isPercentage ? '1' : undefined}
                        />
                      </FormControl>
                      {isPercentage && (
                        <p className="text-sm text-muted-foreground">
                          Percentage value must be between 0 and 1 (e.g., 0.15 = 15%)
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    isUpdating || 
                    (editingConfig && String(editingConfig.value) === form.watch('value')?.trim())
                  }
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


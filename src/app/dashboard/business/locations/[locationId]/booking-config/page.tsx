"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Save,
  DollarSign,
  Clock,
  Users,
  RotateCcw,
  Info,
  ArrowLeft,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOwnerLocationBookingConfig } from "@/hooks/locations/useOwnerLocationBookingConfig";
import {
  useCreateLocationBookingConfig,
  useUpdateLocationBookingConfig,
} from "@/hooks/locations/useCreateLocationBookingConfig";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import type { UpdateLocationBookingConfigPayload } from "@/types";
import { PageHeader, PageContainer } from "@/components/shared";
import { toast } from "sonner";

const bookingConfigSchema = z
  .object({
    allowBooking: z.boolean(),
    baseBookingPrice: z
      .number()
      .positive("Base booking price must be greater than 0")
      .min(0.01, "Base booking price must be at least 0.01"),
    currency: z.literal("VND"),
    minBookingDurationMinutes: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0")
      .min(1, "Minimum duration must be at least 1 minute"),
    maxBookingDurationMinutes: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0"),
    minGapBetweenBookingsMinutes: z
      .number()
      .int("Must be a whole number")
      .min(0, "Minimum gap cannot be negative"),
    maxCapacity: z
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than 0")
      .optional(),
    refundEnabled: z.boolean().optional(),
    refundCutoffHours: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .optional(),
    refundPercentageAfterCutoff: z
      .number()
      .min(0, "Cannot be negative")
      .max(1, "Cannot exceed 1 (100%)")
      .optional(),
    refundPercentageBeforeCutoff: z
      .number()
      .min(0, "Cannot be negative")
      .max(1, "Cannot exceed 1 (100%)")
      .optional(),
  })
  .refine(
    (data) => data.maxBookingDurationMinutes >= data.minBookingDurationMinutes,
    {
      message:
        "Maximum duration must be greater than or equal to minimum duration",
      path: ["maxBookingDurationMinutes"],
    }
  )
  .refine(
    (data) =>
      !data.refundEnabled ||
      (data.refundCutoffHours !== undefined &&
        data.refundCutoffHours >= 0),
    {
      message: "Refund cutoff hours is required when refund is enabled",
      path: ["refundCutoffHours"],
    }
  )
  .refine(
    (data) =>
      !data.refundEnabled ||
      (data.refundPercentageAfterCutoff !== undefined &&
        data.refundPercentageBeforeCutoff !== undefined),
    {
      message: "Refund percentages are required when refund is enabled",
      path: ["refundPercentageAfterCutoff"],
    }
  );

type BookingConfigForm = z.infer<typeof bookingConfigSchema>;

export default function LocationBookingConfigPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const { data: locationsData } = useMyLocations(1, "");
  const location = locationsData?.data?.find((loc) => loc.id === locationId);
  const {
    data: existingConfig,
    isLoading: isLoadingConfig,
    error: configError,
  } = useOwnerLocationBookingConfig(locationId);
  const createConfig = useCreateLocationBookingConfig();
  const updateConfig = useUpdateLocationBookingConfig();

  const form = useForm<BookingConfigForm>({
    resolver: zodResolver(bookingConfigSchema),
    defaultValues: {
      allowBooking: true,
      baseBookingPrice: 0,
      currency: "VND",
      minBookingDurationMinutes: 30,
      maxBookingDurationMinutes: 240,
      minGapBetweenBookingsMinutes: 15,
      maxCapacity: undefined,
      refundEnabled: false,
      refundCutoffHours: 24,
      refundPercentageAfterCutoff: 0.8,
      refundPercentageBeforeCutoff: 1,
    },
  });

  // Load existing config when available
  useEffect(() => {
    if (existingConfig && !configError) {
      form.reset({
        allowBooking: existingConfig.allowBooking,
        baseBookingPrice: parseFloat(existingConfig.baseBookingPrice),
        currency: "VND",
        minBookingDurationMinutes: existingConfig.minBookingDurationMinutes,
        maxBookingDurationMinutes: existingConfig.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes:
          existingConfig.minGapBetweenBookingsMinutes,
        maxCapacity: existingConfig.maxCapacity,
        refundEnabled: existingConfig.refundEnabled ?? false,
        refundCutoffHours: existingConfig.refundCutoffHours ?? 24,
        refundPercentageAfterCutoff:
          existingConfig.refundPercentageAfterCutoff ?? 0.8,
        refundPercentageBeforeCutoff:
          existingConfig.refundPercentageBeforeCutoff ?? 1,
      });
    }
  }, [existingConfig, configError, form]);

  const onSubmit = (data: BookingConfigForm) => {
    if (hasConfig) {
      // Update existing config
      const updatePayload: UpdateLocationBookingConfigPayload = {
        allowBooking: data.allowBooking,
        baseBookingPrice: data.baseBookingPrice,
        currency: "VND",
        minBookingDurationMinutes: data.minBookingDurationMinutes,
        maxBookingDurationMinutes: data.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: data.minGapBetweenBookingsMinutes,
        maxCapacity: data.maxCapacity,
        refundEnabled: data.refundEnabled,
        refundCutoffHours: data.refundCutoffHours,
        refundPercentageAfterCutoff: data.refundPercentageAfterCutoff,
        refundPercentageBeforeCutoff: data.refundPercentageBeforeCutoff,
      };
      updateConfig.mutate(
        {
          locationId,
          payload: updatePayload,
        },
        {
          onSuccess: () => {
            toast.success("Booking configuration updated successfully");
          },
          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message ||
                "Failed to update booking configuration"
            );
          },
        }
      );
    } else {
      // Create new config
      createConfig.mutate(
        {
          locationId,
          ...data,
          currency: "VND",
        },
        {
          onSuccess: () => {
            toast.success("Booking configuration created successfully");
          },
          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message ||
                "Failed to create booking configuration"
            );
          },
        }
      );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "VND") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const basePrice = form.watch("baseBookingPrice");
  const currency = form.watch("currency");
  const minDuration = form.watch("minBookingDurationMinutes");
  const maxDuration = form.watch("maxBookingDurationMinutes");
  const refundEnabled = form.watch("refundEnabled");
  const refundCutoffHours = form.watch("refundCutoffHours") ?? 24;
  const refundPercentageAfterCutoff =
    form.watch("refundPercentageAfterCutoff") ?? 0.8;
  const refundPercentageBeforeCutoff =
    form.watch("refundPercentageBeforeCutoff") ?? 1;

  // Determine if config exists
  const hasConfig = existingConfig && !configError;
  const isSubmitting = createConfig.isPending || updateConfig.isPending;

  if (isLoadingConfig) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Booking Configuration"
        description={
          location
            ? `Configure booking settings for ${location.name}`
            : "Configure how customers can book your location"
        }
        icon={DollarSign}
        actions={
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Allow Booking Toggle */}
              <Card className="border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    Booking Settings
                  </CardTitle>
                  <CardDescription>
                    Enable or disable booking for this location
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="allowBooking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-primary/20 p-4 bg-card/50">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <DollarSign className="h-4 w-4 text-primary" />
                            </div>
                            Allow Booking
                          </FormLabel>
                          <FormDescription>
                            Enable or disable booking for this location
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card className="border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    Pricing
                  </CardTitle>
                  <CardDescription>
                    Set the base price and currency for bookings
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="baseBookingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <div className="p-1 rounded bg-primary/10">
                              <DollarSign className="h-3.5 w-3.5 text-primary" />
                            </div>
                            Base Booking Price
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00"
                              className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Base price for minimum booking duration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <div className="p-1 rounded bg-primary/10">
                              <DollarSign className="h-3.5 w-3.5 text-primary" />
                            </div>
                            Currency
                          </FormLabel>
                          <FormControl>
                            <Input
                              value="VND"
                              readOnly
                              disabled
                              className="h-12 border-2 border-primary/20 bg-muted cursor-not-allowed uppercase"
                            />
                          </FormControl>
                          <FormDescription>
                            Currency is fixed to VND
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Duration Settings */}
              <Card className="border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    Duration Settings
                  </CardTitle>
                  <CardDescription>
                    Configure booking duration limits and gaps
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minBookingDurationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <div className="p-1 rounded bg-primary/10">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                            </div>
                            Minimum Duration (minutes)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum booking duration in minutes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxBookingDurationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <div className="p-1 rounded bg-primary/10">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                            </div>
                            Maximum Duration (minutes)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="240"
                              className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum booking duration in minutes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="minGapBetweenBookingsMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <div className="p-1 rounded bg-primary/10">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                          </div>
                          Minimum Gap Between Bookings (minutes)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="15"
                            className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum time required between consecutive bookings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Capacity */}
              <Card className="border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    Capacity
                  </CardTitle>
                  <CardDescription>
                    Set the maximum number of participants
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <div className="p-1 rounded bg-primary/10">
                            <Users className="h-3.5 w-3.5 text-primary" />
                          </div>
                          Maximum Capacity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="100"
                            className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of participants allowed (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Refund Settings */}
              <Card className="border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <RotateCcw className="h-5 w-5 text-primary" />
                    </div>
                    Refund Settings
                  </CardTitle>
                  <CardDescription>
                    Configure refund policies for cancellations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="refundEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-primary/20 p-4 bg-card/50">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base font-semibold flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <RotateCcw className="h-4 w-4 text-primary" />
                            </div>
                            Enable Refunds
                          </FormLabel>
                          <FormDescription>
                            Allow customers to receive refunds for cancellations
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {refundEnabled && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <Alert className="bg-primary/5 border-primary/20">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          Configure refund percentages based on cancellation
                          timing
                        </AlertDescription>
                      </Alert>

                      <FormField
                        control={form.control}
                        name="refundCutoffHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <div className="p-1 rounded bg-primary/10">
                                <Clock className="h-3.5 w-3.5 text-primary" />
                              </div>
                              Refund Cutoff (hours)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="24"
                                className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Hours before booking start time for refund cutoff
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="refundPercentageBeforeCutoff"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <div className="p-1 rounded bg-primary/10">
                                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                                </div>
                                Refund % Before Cutoff
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  placeholder="1.0"
                                  className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Refund percentage (0-1) before cutoff time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="refundPercentageAfterCutoff"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <div className="p-1 rounded bg-primary/10">
                                  <RotateCcw className="h-3.5 w-3.5 text-primary" />
                                </div>
                                Refund % After Cutoff
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  placeholder="0.8"
                                  className="h-12 border-2 border-primary/20 focus:ring-2 focus:ring-primary/20"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Refund percentage (0-1) after cutoff time
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-6 -mb-6 mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {hasConfig ? "Update Configuration" : "Create Configuration"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-1">
          <Card className="border-2 border-primary/10 shadow-xl sticky top-24">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                Preview
              </CardTitle>
              <CardDescription>
                How your booking configuration will appear
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">
                    Status
                  </Label>
                  <p className="font-semibold mt-1">
                    {form.watch("allowBooking") ? (
                      <span className="text-green-600 dark:text-green-400">
                        Booking Enabled
                      </span>
                    ) : (
                      <span className="text-gray-500">Booking Disabled</span>
                    )}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">
                    Base Price
                  </Label>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(basePrice, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    per {minDuration} minutes
                  </p>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Min Duration</span>
                    <span className="font-medium">{minDuration} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Duration</span>
                    <span className="font-medium">{maxDuration} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gap Required</span>
                    <span className="font-medium">
                      {form.watch("minGapBetweenBookingsMinutes")} min
                    </span>
                  </div>
                  {form.watch("maxCapacity") && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Max Capacity</span>
                      <span className="font-medium">
                        {form.watch("maxCapacity")} people
                      </span>
                    </div>
                  )}
                </div>

                {refundEnabled && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Refund Policy
                    </Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Before {refundCutoffHours}h:
                        </span>
                        <span className="font-medium">
                          {((refundPercentageBeforeCutoff ?? 1) * 100).toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          After {refundCutoffHours}h:
                        </span>
                        <span className="font-medium">
                          {((refundPercentageAfterCutoff ?? 0.8) * 100).toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Example Calculation */}
                {basePrice > 0 && minDuration > 0 && (
                  <div className="border-t border-border pt-4 space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Example Calculations
                    </Label>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {minDuration} min booking:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(basePrice, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {maxDuration} min booking:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            basePrice * (maxDuration / minDuration),
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

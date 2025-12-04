"use client";

import { use, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
import { Loader2, Save, DollarSign, Clock, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useOwnerLocationBookingConfig } from "@/hooks/locations/useOwnerLocationBookingConfig";
import { useCreateLocationBookingConfig, useUpdateLocationBookingConfig } from "@/hooks/locations/useCreateLocationBookingConfig";
import { useMyLocations } from "@/hooks/locations/useMyLocations";
import type { UpdateLocationBookingConfigPayload } from "@/types";

const bookingConfigSchema = z
  .object({
    allowBooking: z.boolean(),
    baseBookingPrice: z
      .number()
      .positive("Base booking price must be greater than 0")
      .min(0.01, "Base booking price must be at least 0.01"),
    currency: z.string().min(1, "Currency is required"),
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
  })
  .refine(
    (data) => data.maxBookingDurationMinutes >= data.minBookingDurationMinutes,
    {
      message: "Maximum duration must be greater than or equal to minimum duration",
      path: ["maxBookingDurationMinutes"],
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
  const pathname = usePathname();
  const isBookingConfig = pathname.includes("/booking-config");
  const isAvailability = pathname.includes("/availability");
  const { data: locationsData } = useMyLocations(1, "");
  const location = locationsData?.data?.find((loc) => loc.id === locationId);
  const { data: existingConfig, isLoading: isLoadingConfig, error: configError } =
    useOwnerLocationBookingConfig(locationId);
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
    },
  });

  // Load existing config when available
  useEffect(() => {
    if (existingConfig && !configError) {
      form.reset({
        allowBooking: existingConfig.allowBooking,
        baseBookingPrice: parseFloat(existingConfig.baseBookingPrice),
        currency: existingConfig.currency,
        minBookingDurationMinutes: existingConfig.minBookingDurationMinutes,
        maxBookingDurationMinutes: existingConfig.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: existingConfig.minGapBetweenBookingsMinutes,
      });
    }
  }, [existingConfig, configError, form]);

  const onSubmit = (data: BookingConfigForm) => {
    if (hasConfig) {
      // Update existing config
      const updatePayload: UpdateLocationBookingConfigPayload = {
        allowBooking: data.allowBooking,
        baseBookingPrice: data.baseBookingPrice,
        currency: data.currency,
        minBookingDurationMinutes: data.minBookingDurationMinutes,
        maxBookingDurationMinutes: data.maxBookingDurationMinutes,
        minGapBetweenBookingsMinutes: data.minGapBetweenBookingsMinutes,
      };
      updateConfig.mutate({
        locationId,
        payload: updatePayload,
      });
    } else {
      // Create new config
      createConfig.mutate({
        locationId,
        ...data,
      });
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

  // Determine if config exists
  const hasConfig = existingConfig && !configError;
  const isSubmitting = createConfig.isPending || updateConfig.isPending;

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b">
        <Link
          href={`/dashboard/business/locations/${locationId}/booking-config`}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
            isBookingConfig
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Booking Settings
          </div>
        </Link>
        <Link
          href={`/dashboard/business/locations/${locationId}/availability`}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
            isAvailability
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Booking Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how customers can book your location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Allow Booking Toggle */}
                  <FormField
                    control={form.control}
                    name="allowBooking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
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
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Pricing</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="baseBookingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Booking Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
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
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="VND"
                                maxLength={3}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Currency code (e.g., VND, USD)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Duration Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Duration Settings
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="minBookingDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="30"
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
                            <FormLabel>Maximum Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="240"
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
                          <FormLabel>Minimum Gap Between Bookings (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="15"
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
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
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
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>
                How your booking configuration will appear
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="font-semibold">
                    {form.watch("allowBooking") ? (
                      <span className="text-green-600">Booking Enabled</span>
                    ) : (
                      <span className="text-gray-500">Booking Disabled</span>
                    )}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Base Price
                  </Label>
                  <p className="text-2xl font-bold">
                    {formatCurrency(basePrice, currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    per {minDuration} minutes
                  </p>
                </div>

                <div className="border-t pt-3 space-y-2">
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
                </div>

                {/* Example Calculation */}
                {basePrice > 0 && minDuration > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Example Calculations
                    </Label>
                    <div className="space-y-1 text-xs">
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
                            basePrice *
                              (maxDuration / minDuration),
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
    </div>
  );
}


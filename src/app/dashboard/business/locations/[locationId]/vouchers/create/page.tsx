"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format, startOfDay } from "date-fns";

// --- Hooks & Components ---
import { useCreateLocationVoucher } from "@/hooks/vouchers/useCreateLocationVoucher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CalendarIcon, TicketPercent } from "lucide-react";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload"; // <-- Dùng component upload 1 file
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { use, useEffect } from "react";
import { CreateLocationVoucherPayload } from "@/types";

// --- Zod Schema (Khớp với Payload) ---
const voucherSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    voucherCode: z.string().min(1, "Voucher code is required"),
    imageUrl: z
      .string()
      .min(1, "Image URL is required")
      .url("Image URL must be a valid URL"),
    pricePoint: z.number().min(0, "Price must be 0 or more"),
    maxQuantity: z.number().min(1, "Max quantity must be at least 1"),
    userRedeemedLimit: z.number().min(1, "Limit must be at least 1"),
    voucherType: z.string().min(1, "Type is required"),
    startDate: z.date({
      error: "Start date is required.",
      invalid_type_error: "Start date is required.",
    }),
    endDate: z.date({
      error: "End date is required.",
      invalid_type_error: "End date is required.",
    }),
  })
  // Start date cannot be in the past
  .refine(
    (data) => {
      const today = startOfDay(new Date());
      return data.startDate >= today;
    },
    {
      message: "Start date cannot be in the past",
      path: ["startDate"],
    }
  )
  // End date cannot be in the past
  .refine(
    (data) => {
      const today = startOfDay(new Date());
      return data.endDate >= today;
    },
    {
      message: "End date cannot be in the past",
      path: ["endDate"],
    }
  )
  // End date must be strictly after start date
  .refine(
    (data) => data.endDate > data.startDate,
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );
type FormValues = z.infer<typeof voucherSchema>;

export default function CreateVoucherPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const { mutate: createVoucher, isPending } =
    useCreateLocationVoucher(locationId);
  const { data: location, isLoading: isLoadingLocation } = useLocationById(locationId);

  const form = useForm<FormValues>({
    resolver: zodResolver(voucherSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      voucherCode: "",
      imageUrl: "",
      pricePoint: 0,
      maxQuantity: 100,
      userRedeemedLimit: 1,
      voucherType: "public",
    },
  });

  const voucherType = form.watch("voucherType");
  const isPublicVoucher = voucherType === "public";
  const startDate = form.watch("startDate");

  // Reset pricePoint to 0 when voucher type changes to "public"
  useEffect(() => {
    if (isPublicVoucher) {
      form.setValue("pricePoint", 0);
    }
  }, [isPublicVoucher, form]);

  function onSubmit(values: FormValues) {
    // Chuyển đổi Date objects thành ISO strings
    const payload: CreateLocationVoucherPayload = {
      title: values.title,
      description: values.description,
      voucherCode: values.voucherCode,
      imageUrl: values.imageUrl,
      pricePoint: isPublicVoucher ? 0 : values.pricePoint,
      maxQuantity: values.maxQuantity,
      userRedeemedLimit: values.userRedeemedLimit,
      voucherType: values.voucherType,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    createVoucher(payload);
  }

  if (isLoadingLocation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Voucher</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new voucher for {location?.name || "this location"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TicketPercent className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 20% off drinks" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe what this voucher includes..."
                        rows={4}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="voucherCode"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., SUMMER20" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  name="voucherType"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voucher Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Free Voucher</SelectItem>
                          <SelectItem value="mission_only">Exchange Voucher</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="pricePoint"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (Points)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={isNaN(field.value) ? "" : (field.value ?? "")}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === "" ? 0 : Number(value);
                            field.onChange(isNaN(numValue) ? 0 : numValue);
                          }}
                          disabled={isPublicVoucher}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="maxQuantity"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={isNaN(field.value) ? "" : (field.value ?? "")}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === "" ? 0 : Number(value);
                            field.onChange(isNaN(numValue) ? 0 : numValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="userRedeemedLimit"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit per User</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={isNaN(field.value) ? "" : (field.value ?? "")}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value === "" ? 0 : Number(value);
                            field.onChange(isNaN(numValue) ? 0 : numValue);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  name="startDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = startOfDay(new Date());
                              return date < today;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="endDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = startOfDay(new Date());
                              const minDate = startDate
                                ? startOfDay(startDate)
                                : today;
                              return date < minDate;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Image</FormLabel>
                    <FormControl>
                      <SingleFileUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Voucher
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

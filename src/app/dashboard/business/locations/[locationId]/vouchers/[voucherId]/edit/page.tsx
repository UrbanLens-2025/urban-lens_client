"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// --- Hooks & Components ---
import { useUpdateLocationVoucher } from "@/hooks/vouchers/useUpdateLocationVoucher";
import { useLocationVoucherById } from "@/hooks/vouchers/useLocationVoucherById";
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
import { Loader2, ArrowLeft, CalendarIcon, TicketPercent } from "lucide-react";
import { useLocationById } from "@/hooks/locations/useLocationById";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
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
import { Switch } from "@/components/ui/switch";

// --- Zod Schema (Khớp với Payload API PUT) ---
const voucherSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  voucherCode: z.string().min(1, "Voucher code is required"),
  imageUrl: z.string().url("Image URL is required").nullable(),
  pricePoint: z.number().min(0, "Price must be 0 or more"),
  maxQuantity: z.number().min(1, "Max quantity must be at least 1"),
  userRedeemedLimit: z.number().min(1, "Limit must be at least 1"),
  voucherType: z.string().min(1, "Type is required"),
  startDate: z.date({ error: "Start date is required." }),
  endDate: z.date({ error: "End date is required." }),
});
type FormValues = z.infer<typeof voucherSchema>;

export default function EditVoucherPage({
  params,
}: {
  params: Promise<{ locationId: string; voucherId: string }>;
}) {
  const { locationId, voucherId } = use(params);
  const router = useRouter();

  // 1. Fetch dữ liệu hiện tại của voucher
  const { data: voucher, isLoading: isLoadingData } =
    useLocationVoucherById(voucherId);
  const { data: location } = useLocationById(locationId);

  // 2. Chuẩn bị hook mutation
  const { mutate: updateVoucher, isPending: isUpdating } =
    useUpdateLocationVoucher();

  const form = useForm<FormValues>({
    resolver: zodResolver(voucherSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      voucherCode: "",
      imageUrl: null,
      pricePoint: 0,
      maxQuantity: 1,
      userRedeemedLimit: 1,
      voucherType: "public",
    },
  });

  // 3. Điền (pre-fill) form khi dữ liệu được tải
  useEffect(() => {
    if (voucher) {
      form.reset({
        title: voucher.title,
        description: voucher.description,
        voucherCode: voucher.voucherCode,
        imageUrl: voucher.imageUrl || null,
        pricePoint: voucher.pricePoint,
        maxQuantity: voucher.maxQuantity,
        userRedeemedLimit: voucher.userRedeemedLimit,
        voucherType: voucher.voucherType,
        startDate: new Date(voucher.startDate),
        endDate: new Date(voucher.endDate),
      });
    }
  }, [voucher, form]);

  const voucherType = form.watch("voucherType");
  const isPublicVoucher = voucherType === "public";

  // Reset pricePoint to 0 when voucher type changes to "public"
  useEffect(() => {
    if (isPublicVoucher) {
      form.setValue("pricePoint", 0);
    }
  }, [isPublicVoucher, form]);

  // 4. Hàm xử lý submit
  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      imageUrl: values.imageUrl || "",
      pricePoint: isPublicVoucher ? 0 : values.pricePoint,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };
    updateVoucher({ locationId, voucherId, payload });
  }

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Voucher not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Voucher</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update voucher details for {location?.name || "this location"}
            </p>
          </div>
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

          <div className="mt-8 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isUpdating}
              className="ml-4"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

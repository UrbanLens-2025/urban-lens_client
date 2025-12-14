"use client";

import { use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventById } from "@/hooks/events/useEventById";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { useUpdateTicket } from "@/hooks/events/useUpdateTicket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
import { DatePicker } from "@/components/shared/DatePicker";
import {
  Loader2,
  ArrowLeft,
  Save,
  Ticket,
  DollarSign,
  Calendar,
  Hash,
  ImageIcon,
} from "lucide-react";
import type { UpdateTicketPayload } from "@/types";

const createUpdateTicketSchema = (eventStartDate?: string, eventEndDate?: string) => z.object({
  displayName: z
    .string()
    .min(3, "Ticket name must be at least 3 characters")
    .max(255, "Ticket name must not exceed 255 characters"),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(1024, "Description must not exceed 1024 characters"),
  price: z
    .number()
    .min(0, "Price must be 0 or greater")
    .refine((val) => {
      // Convert to string to check for leading zeros
      const priceStr = val.toString();
      // Allow 0, decimals starting with 0 (like 0.5), or numbers without leading zeros
      // Reject numbers like 01, 02, 0123, etc. (but allow 0, 0.5, 10, etc.)
      if (val === 0) return true; // Allow zero
      // Check if it starts with "0" followed by a digit (not decimal point)
      if (/^0[0-9]/.test(priceStr)) return false;
      return true;
    }, {
      message: "Price cannot start with 0 (except for 0 or decimals like 0.5)",
    }),
  currency: z
    .string()
    .min(1, "Currency is required"),
  imageUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .transform((val) => (val === "" || !val ? null : val)),
  isActive: z.boolean().default(true),
  tos: z
    .string()
    .nullable()
    .or(z.literal("").transform(() => null)),
  totalQuantityAvailable: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 ticket available"),
  saleStartDate: z
    .string()
    .min(1, "Sale start date is required"),
  saleEndDate: z
    .string()
    .min(1, "Sale end date is required"),
  minQuantityPerOrder: z
    .number()
    .int("Must be a whole number")
    .min(1, "Minimum quantity must be at least 1"),
  maxQuantityPerOrder: z
    .number()
    .int("Must be a whole number")
    .min(1, "Maximum quantity must be at least 1"),
}).refine((data) => {
  return data.saleEndDate > data.saleStartDate;
}, {
  message: "Sale end date must be after sale start date",
  path: ["saleEndDate"],
}).refine((data) => {
  return data.maxQuantityPerOrder >= data.minQuantityPerOrder;
}, {
  message: "Maximum quantity must be greater than or equal to minimum quantity",
  path: ["maxQuantityPerOrder"],
}).refine((data) => {
  if (eventEndDate) {
    const saleEnd = new Date(data.saleEndDate);
    const eventEnd = new Date(eventEndDate);
    return saleEnd <= eventEnd;
  }
  return true;
}, {
  message: "Sale end date must be on or before the event end date",
  path: ["saleEndDate"],
});

type UpdateTicketForm = z.infer<ReturnType<typeof createUpdateTicketSchema>>;

export default function EditTicketPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketId: string }>;
}) {
  const { eventId, ticketId } = use(params);
  const router = useRouter();
  const updateTicket = useUpdateTicket();

  const { data: event, isLoading: isLoadingEvent, isError: isEventError } = useEventById(eventId);
  const { data: tickets, isLoading: isLoadingTickets, isError: isTicketsError } = useEventTickets(eventId);

  // Find the ticket from the list
  const ticket = tickets?.find(t => t.id === ticketId);
  const isLoading = isLoadingEvent || isLoadingTickets;
  const isError = isEventError || isTicketsError || !ticket;

  // Create schema with event dates for validation - recreate when event data changes
  const updateTicketSchema = useMemo(
    () => createUpdateTicketSchema(event?.startDate, event?.endDate),
    [event?.startDate, event?.endDate]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<UpdateTicketForm>({
    resolver: zodResolver(updateTicketSchema) as any,
    mode: "onChange",
    defaultValues: {
      displayName: "",
      description: "",
      price: 0,
      currency: "VND",
      imageUrl: null,
      isActive: true,
      tos: null,
      totalQuantityAvailable: 100,
      saleStartDate: "",
      saleEndDate: "",
      minQuantityPerOrder: 1,
      maxQuantityPerOrder: 5,
    },
  });

  // Update form when ticket data loads
  useEffect(() => {
    if (ticket) {
      // Convert price from string to number
      const price = parseFloat(ticket.price) || 0;

      // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      form.reset({
        displayName: ticket.displayName || "",
        description: ticket.description || "",
        price: price,
        currency: ticket.currency || "VND",
        imageUrl: ticket.imageUrl || null,
        isActive: ticket.isActive ?? true,
        tos: ticket.tos || null,
        totalQuantityAvailable: ticket.totalQuantityAvailable || 100,
        saleStartDate: formatDateForInput(ticket.saleStartDate),
        saleEndDate: formatDateForInput(ticket.saleEndDate),
        minQuantityPerOrder: ticket.minQuantityPerOrder || 1,
        maxQuantityPerOrder: ticket.maxQuantityPerOrder || 5,
      });
    }
  }, [ticket, form]);

  // Re-validate form when event data loads to apply event date constraints
  useEffect(() => {
    if (event && (event.startDate || event.endDate)) {
      form.trigger(["saleStartDate", "saleEndDate"]);
    }
  }, [event?.startDate, event?.endDate, form]);

  const onSubmit = async (data: UpdateTicketForm) => {
    const payload: UpdateTicketPayload = {
      displayName: data.displayName,
      description: data.description,
      price: data.price,
      currency: data.currency,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive,
      tos: data.tos || null,
      totalQuantityAvailable: data.totalQuantityAvailable,
      saleStartDate: new Date(data.saleStartDate),
      saleEndDate: new Date(data.saleEndDate),
      minQuantityPerOrder: data.minQuantityPerOrder,
      maxQuantityPerOrder: data.maxQuantityPerOrder,
    };

    updateTicket.mutate({ eventId, ticketId, payload });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event || !ticket) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading ticket details</p>
          <p className="text-sm text-muted-foreground mt-2">
            {!ticket ? "Ticket not found" : "Please try refreshing the page"}
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
            <h1 className="text-3xl font-bold">Edit Ticket</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update ticket details for {event.displayName}
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
                <Ticket className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., General Admission, VIP Pass"
                        {...field}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this ticket includes..."
                        rows={4}
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormMessage />
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/1024 characters
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable ticket sales
                      </p>
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

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Image</FormLabel>
                    <FormControl>
                      <SingleFileUpload
                        value={field.value || undefined}
                        onChange={(url) => field.onChange(url || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Handle empty input
                            if (value === "" || value === "-") {
                              field.onChange(0);
                              return;
                            }

                            // Remove leading zeros that are followed by digits (not decimal point)
                            // Allow: 0, 0.5, 0.99, 10, 100, etc.
                            // Reject: 01, 02, 0123, etc.
                            if (/^0+[1-9]/.test(value)) {
                              // Remove all leading zeros
                              value = value.replace(/^0+/, "");
                              // Update the input value
                              e.target.value = value;
                            }

                            // Handle negative values (shouldn't happen with min="0" but just in case)
                            if (value.startsWith("-")) {
                              value = value.replace("-", "");
                            }

                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              field.onChange(numValue);
                            } else if (value === "" || value === "0") {
                              field.onChange(0);
                            }
                          }}
                          onBlur={(e) => {
                            field.onBlur();
                            // Ensure the displayed value matches the stored value
                            const currentValue = field.value ?? 0;
                            if (e.target.value !== currentValue.toString()) {
                              e.target.value = currentValue.toString();
                            }
                          }}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Currency</FormLabel>
                  <p className="text-sm text-muted-foreground mt-2">
                    {ticket.currency || "VND"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity & Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Quantity & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="totalQuantityAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Quantity Available *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minQuantityPerOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Quantity Per Order *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxQuantityPerOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Quantity Per Order *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sale Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sale Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="saleStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Start Date *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          error={form.formState.errors.saleStartDate?.message}
                          maxDate={event?.endDate ? new Date(event.endDate) : undefined}
                          placeholder="Select start date"
                          showTime={true}
                          defaultTime="00:00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="saleEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale End Date *</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          error={form.formState.errors.saleEndDate?.message}
                          maxDate={event?.endDate ? new Date(event.endDate) : undefined}
                          placeholder="Select end date"
                          showTime={true}
                          defaultTime="23:59"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateTicket.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTicket.isPending || !form.formState.isValid}
            >
              {updateTicket.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


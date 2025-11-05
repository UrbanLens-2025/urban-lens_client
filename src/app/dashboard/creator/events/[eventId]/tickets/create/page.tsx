"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventById } from "@/hooks/events/useEventById";
import { useCreateTicket } from "@/hooks/events/useCreateTicket";
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
import type { CreateTicketPayload } from "@/types";

const createTicketSchema = z.object({
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
    .min(0, "Price must be 0 or greater"),
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
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

const currencies = ["VND", "USD", "EUR"];

export default function CreateTicketPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const createTicket = useCreateTicket();

  const { data: event, isLoading, isError } = useEventById(eventId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema) as any,
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

  const onSubmit = async (data: CreateTicketForm) => {
    const payload: CreateTicketPayload = {
      displayName: data.displayName,
      description: data.description,
      price: data.price,
      currency: data.currency,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive,
      tos: data.tos || null,
      totalQuantityAvailable: data.totalQuantityAvailable,
      saleStartDate: new Date(data.saleStartDate).toISOString(),
      saleEndDate: new Date(data.saleEndDate).toISOString(),
      minQuantityPerOrder: data.minQuantityPerOrder,
      maxQuantityPerOrder: data.maxQuantityPerOrder,
    };

    createTicket.mutate({ eventId, payload });
  };

  // Set default dates based on event dates if available
  useEffect(() => {
    if (event && event.referencedEventRequestId) {
      // You might want to get event dates from the event request
      // For now, we'll set default dates to today and 30 days from now
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      
      form.setValue("saleStartDate", today.toISOString().slice(0, 16));
      form.setValue("saleEndDate", endDate.toISOString().slice(0, 16));
    }
  }, [event, form]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Error loading event details</p>
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
            <h1 className="text-3xl font-bold">Create Ticket</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new ticket type for {event.displayName}
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
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Image</FormLabel>
                    <FormDescription>
                      Upload an image for this ticket type
                    </FormDescription>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    <FormDescription>
                      Maximum number of tickets available for sale
                    </FormDescription>
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
                      <FormDescription>
                        Minimum tickets a customer can purchase
                      </FormDescription>
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
                      <FormDescription>
                        Maximum tickets a customer can purchase
                      </FormDescription>
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
                      <FormDescription>
                        When ticket sales begin
                      </FormDescription>
                      <FormControl>
                        <Input
                          type="datetime-local"
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
                  name="saleEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale End Date *</FormLabel>
                      <FormDescription>
                        When ticket sales end
                      </FormDescription>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
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

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                name="tos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms of Service</FormLabel>
                    <FormDescription>
                      Additional terms and conditions for this ticket type
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        placeholder="Enter terms and conditions..."
                        rows={4}
                        {...field}
                        value={field.value || ""}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createTicket.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicket.isPending || !form.formState.isValid}
            >
              {createTicket.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}


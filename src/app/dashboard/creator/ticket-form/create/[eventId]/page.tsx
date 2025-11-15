"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventById } from "@/hooks/events/useEventById";
import { useCreateTicket } from "@/hooks/events/useCreateTicket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SingleFileUpload } from "@/components/shared/SingleFileUpload";
import {
  Loader2,
  ArrowLeft,
  Save,
  Ticket,
  DollarSign,
  Calendar,
  Hash,
  Info,
  Sparkles,
} from "lucide-react";
import type { CreateTicketPayload } from "@/types";
import { Separator } from "@/components/ui/separator";

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
    .min(0, "Price must be 0 or greater")
    .refine((val) => {
      const priceStr = val.toString();
      if (val === 0) return true;
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
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

const currencies = ["VND"];

export default function CreateTicketFormPage({
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
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => router.push(`/dashboard/creator/events/${eventId}/tickets`)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Create New Ticket
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Add a new ticket type for {event.displayName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/creator/events/${eventId}/tickets`)}
                  disabled={createTicket.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
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
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card className="border-t-4 border-t-purple-500">
                <CardHeader className="bg-purple-500/10 dark:bg-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                        <Ticket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Basic Information
                      </CardTitle>
                      <CardDescription className="mt-1 text-purple-600 dark:text-purple-300">
                        Name, description, and visual identity
                      </CardDescription>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>These details will be displayed to customers when browsing tickets</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Ticket Name *
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Choose a clear, descriptive name (e.g., &quot;VIP Access&quot;, &quot;Early Bird&quot;)</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          Description *
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Explain what&apos;s included, benefits, and any restrictions</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          Ticket Image
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add an eye-catching image to make your ticket stand out</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormDescription>
                          Upload an image for this ticket type (optional)
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
              <Card className="border-t-4 border-t-green-500">
                <CardHeader className="bg-green-500/10 dark:bg-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Pricing
                      </CardTitle>
                      <CardDescription className="mt-1 text-green-600 dark:text-green-300">
                        Set your ticket price and currency
                      </CardDescription>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Consider market rates and your event&apos;s value proposition</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Price *
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Enter 0 for free tickets</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            let value = e.target.value;
                            
                            if (value === "" || value === "-") {
                              field.onChange(0);
                              return;
                            }

                            if (/^0+[1-9]/.test(value)) {
                              value = value.replace(/^0+/, "");
                              e.target.value = value;
                            }

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
                            const currentValue = field.value ?? 0;
                            if (e.target.value !== currentValue.toString()) {
                              e.target.value = currentValue.toString();
                            }
                          }}
                          className="h-11 text-lg font-semibold"
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
                          disabled
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {currencies.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>Currently only VND is supported</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quantity & Availability */}
          <Card className="border-t-4 border-t-orange-500">
            <CardHeader className="bg-orange-500/10 dark:bg-orange-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Hash className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    Quantity & Limits
                  </CardTitle>
                  <CardDescription className="mt-1 text-orange-600 dark:text-orange-300">
                    Control inventory and purchase limits
                  </CardDescription>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Set limits to prevent overselling and manage demand</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
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
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="bg-blue-500/10 dark:bg-blue-500/20">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Sale Period
              </CardTitle>
              <CardDescription className="mt-1 text-blue-600 dark:text-blue-300">
                Control when customers can purchase this ticket
              </CardDescription>
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
          <Card className="border-t-4 border-t-gray-500">
            <CardHeader className="bg-gray-500/10 dark:bg-gray-500/20">
              <CardTitle className="text-gray-700 dark:text-gray-400">Additional Settings</CardTitle>
              <CardDescription className="mt-1 text-gray-600 dark:text-gray-300">
                Advanced options and terms of service
              </CardDescription>
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
              onClick={() => router.push(`/dashboard/creator/events/${eventId}/tickets`)}
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
      </div>
    </TooltipProvider>
  );
}


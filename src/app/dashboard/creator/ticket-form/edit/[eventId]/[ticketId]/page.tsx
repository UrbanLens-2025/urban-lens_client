"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventTickets } from "@/hooks/events/useEventTickets";
import { useUpdateTicket } from "@/hooks/events/useUpdateTicket";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
} from "lucide-react";
import type { UpdateTicketPayload } from "@/types";

const updateTicketSchema = z.object({
  displayName: z
    .string()
    .min(3, "Ticket name must be at least 3 characters")
    .max(255, "Ticket name must not exceed 255 characters")
    .optional(),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(1024, "Description must not exceed 1024 characters")
    .optional(),
  price: z
    .number()
    .min(0, "Price must be 0 or greater")
    .optional(),
  currency: z
    .string()
    .min(1, "Currency is required")
    .optional(),
  imageUrl: z
    .union([
      z.string().url("Invalid URL"),
      z.literal(""),
      z.null(),
    ])
    .nullable()
    .transform((val) => (val === "" || !val ? null : val))
    .optional(),
  isActive: z.boolean().optional(),
  tos: z
    .string()
    .nullable()
    .or(z.literal("").transform(() => null))
    .optional(),
  totalQuantityAvailable: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 ticket available")
    .optional(),
  saleStartDate: z
    .string()
    .min(1, "Sale start date is required")
    .optional(),
  saleEndDate: z
    .string()
    .min(1, "Sale end date is required")
    .optional(),
  minQuantityPerOrder: z
    .number()
    .int("Must be a whole number")
    .min(1, "Minimum quantity must be at least 1")
    .optional(),
  maxQuantityPerOrder: z
    .number()
    .int("Must be a whole number")
    .min(1, "Maximum quantity must be at least 1")
    .optional(),
}).refine((data) => {
  if (data.saleEndDate && data.saleStartDate) {
    return data.saleEndDate > data.saleStartDate;
  }
  return true;
}, {
  message: "Sale end date must be after sale start date",
  path: ["saleEndDate"],
}).refine((data) => {
  if (data.maxQuantityPerOrder && data.minQuantityPerOrder) {
    return data.maxQuantityPerOrder >= data.minQuantityPerOrder;
  }
  return true;
}, {
  message: "Maximum quantity must be greater than or equal to minimum quantity",
  path: ["maxQuantityPerOrder"],
});

type UpdateTicketForm = z.infer<typeof updateTicketSchema>;

const currencies = ["VND"];

export default function EditTicketFormPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketId: string }>;
}) {
  const { eventId, ticketId } = use(params);
  const router = useRouter();
  const updateTicket = useUpdateTicket();

  const { data: tickets, isLoading } = useEventTickets(eventId);
  const ticket = tickets?.find(t => t.id === ticketId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<UpdateTicketForm>({
    resolver: zodResolver(updateTicketSchema) as any,
    mode: "onChange",
  });

  // Populate form with existing ticket data
  useEffect(() => {
    if (ticket) {
      form.reset({
        displayName: ticket.displayName,
        description: ticket.description,
        price: parseFloat(ticket.price),
        currency: ticket.currency,
        imageUrl: ticket.imageUrl,
        isActive: ticket.isActive,
        tos: ticket.tos,
        totalQuantityAvailable: ticket.totalQuantityAvailable,
        saleStartDate: ticket.saleStartDate ? new Date(ticket.saleStartDate).toISOString().slice(0, 16) : "",
        saleEndDate: ticket.saleEndDate ? new Date(ticket.saleEndDate).toISOString().slice(0, 16) : "",
        minQuantityPerOrder: ticket.minQuantityPerOrder,
        maxQuantityPerOrder: ticket.maxQuantityPerOrder,
      });
    }
  }, [ticket, form]);

  const onSubmit = async (data: UpdateTicketForm) => {
    const payload: UpdateTicketPayload = {};
    
    // Only include fields that have values
    if (data.displayName) payload.displayName = data.displayName;
    if (data.description) payload.description = data.description;
    if (data.price !== undefined) payload.price = data.price;
    if (data.currency) payload.currency = data.currency;
    if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.tos !== undefined) payload.tos = data.tos;
    if (data.totalQuantityAvailable) payload.totalQuantityAvailable = data.totalQuantityAvailable;
    if (data.saleStartDate) payload.saleStartDate = new Date(data.saleStartDate);
    if (data.saleEndDate) payload.saleEndDate = new Date(data.saleEndDate);
    if (data.minQuantityPerOrder) payload.minQuantityPerOrder = data.minQuantityPerOrder;
    if (data.maxQuantityPerOrder) payload.maxQuantityPerOrder = data.maxQuantityPerOrder;

    updateTicket.mutate({ eventId, ticketId, payload });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-20 text-red-500">
          <p className="font-medium">Ticket not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please check the ticket ID and try again
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
                  <h1 className="text-2xl font-bold">Edit Ticket</h1>
                  <p className="text-sm text-muted-foreground">
                    Update ticket details
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ticket.isActive ? "default" : "secondary"}>
                  {ticket.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/creator/events/${eventId}/tickets`)}
                  disabled={updateTicket.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateTicket.isPending || !form.formState.isDirty}
                >
                  {updateTicket.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
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
                          Ticket Name
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Choose a clear, descriptive name (e.g., "VIP Access", "Early Bird")</p>
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
                          Description
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Explain what's included, benefits, and any restrictions</p>
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
                        <p>Consider market rates and your event's value proposition</p>
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
                            Price
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
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          <FormLabel>Currency</FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          Total Quantity Available
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Maximum number of tickets available for sale</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
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
                        <FormDescription>
                          Currently reserved: {ticket.quantityReserved} | Available: {ticket.totalQuantityAvailable - ticket.quantityReserved}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="minQuantityPerOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Minimum Per Order
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Minimum tickets a customer must purchase</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            Maximum Per Order
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Maximum tickets a customer can purchase</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
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

              {/* Sale Period */}
              <Card className="border-t-4 border-t-blue-500">
                <CardHeader className="bg-blue-500/10 dark:bg-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Sale Period
                      </CardTitle>
                      <CardDescription className="mt-1 text-blue-600 dark:text-blue-300">
                        When tickets will be available for purchase
                      </CardDescription>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Create urgency with limited-time sales or early bird pricing</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="saleStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Sale Start Date
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>When ticket sales begin</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            Sale End Date
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>When ticket sales end</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
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
                    Advanced options and terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
                        <div className="space-y-0.5 flex-1">
                          <FormLabel className="text-base flex items-center gap-2">
                            Active Status
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Toggle to enable or disable ticket sales immediately</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormDescription>
                            {field.value 
                              ? "Ticket is currently available for purchase" 
                              : "Ticket is hidden from customers"}
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

                  <FormField
                    control={form.control}
                    name="tos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Terms of Service
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Add specific terms for this ticket (refund policy, age restrictions, etc.)</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
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
            </form>
          </Form>
        </div>
      </div>
    </TooltipProvider>
  );
}


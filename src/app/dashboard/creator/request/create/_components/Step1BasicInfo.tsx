"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/shared/FileUpload";
import { SocialLinksInput } from "./SocialLinksInput";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Info, 
  Calendar, 
  Users, 
  FileText, 
  AlertCircle, 
  Ticket, 
  Globe,
  Upload
} from "lucide-react";
import { CreateEventRequestForm } from "../page";

interface Step1BasicInfoProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step1BasicInfo({ form }: Step1BasicInfoProps) {

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 pb-2 border-b border-primary/10">
        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">Basic Event Information</h2>
          <p className="text-muted-foreground text-sm">
            Provide the essential details about your event
          </p>
        </div>
      </div>

      {/* Event Name and Expected Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Event Name *
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose a clear, descriptive name for your event</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input 
                  placeholder="Enter event name" 
                  {...field}
                  className="h-11 border-primary/20 focus:border-primary/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedNumberOfParticipants"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-2">
                <FormLabel className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  Expected Participants *
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Estimate the number of attendees for planning purposes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number.parseInt(e.target.value) : undefined
                    )
                  }
                  className="h-11 border-primary/20 focus:border-primary/50"
                  min={1}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Event Description */}
      <FormField
        control={form.control}
        name="eventDescription"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                Description *
              </FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Provide a detailed description to help attendees understand your event</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <FormControl>
              <Textarea
                placeholder="Describe your event, including what attendees can expect, key highlights, and any important information..."
                rows={5}
                {...field}
                className="resize-none border-primary/20 focus:border-primary/50"
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

      {/* Special Requirements */}
      <FormField
        control={form.control}
        name="specialRequirements"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-primary" />
                Special Requirements *
              </FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Specify any special needs or accommodations for your event</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              List any special requirements, accommodations, or considerations needed for your event
            </p>
            <FormControl>
              <Textarea
                placeholder="e.g., Accessibility requirements, equipment needs, dietary restrictions, security needs..."
                rows={4}
                maxLength={624}
                {...field}
                className="resize-none border-primary/20 focus:border-primary/50"
              />
            </FormControl>
            <div className="flex justify-between">
              <FormMessage />
              <span className="text-xs text-muted-foreground">
                {field.value?.length || 0}/624 characters
              </span>
            </div>
          </FormItem>
        )}
      />

      {/* Allow Tickets */}
      <FormField
        control={form.control}
        name="allowTickets"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-primary/10 bg-primary/5 p-4 shadow-sm">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <FormLabel className="text-base flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-primary" />
                  Allow Ticketing
                </FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enable ticket sales and registration for your event</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable ticket sales for this event
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

      <Separator />

      {/* Social Links */}
      <Controller
        control={form.control}
        name="social"
        render={() => <SocialLinksInput form={form} />}
      />

      <Separator />

      {/* Event Permit Documents */}
      <Controller
        control={form.control}
        name="eventValidationDocuments"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="flex items-center gap-1.5">
                <Upload className="h-4 w-4 text-primary" />
                Event Permit Documents *
              </FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload official permits or authorization documents for your event</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Upload official permits or documents required for your event
            </p>
            <FormControl>
              <div className="border-2 border-primary/10 rounded-lg p-4 bg-primary/5">
                <FileUpload
                  value={field.value?.[0]?.documentImageUrls || []}
                  onChange={(urls) =>
                    field.onChange([
                      {
                        documentType: "EVENT_PERMIT",
                        documentImageUrls: urls,
                      },
                    ])
                  }
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}


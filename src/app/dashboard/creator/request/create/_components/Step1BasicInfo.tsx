"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SocialLinksInput } from "./SocialLinksInput";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Info, 
  Calendar, 
  Users, 
  FileText, 
  Globe
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
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4">
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
                  className="h-11 border-primary/20 focus:border-primary/50 w-full"
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

      <Separator />

      {/* Social Links */}
      <Controller
        control={form.control}
        name="social"
        render={() => <SocialLinksInput form={form} />}
      />

    </div>
  );
}


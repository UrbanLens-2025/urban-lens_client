"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/shared/FileUpload";
import { CreateEventRequestForm } from "../page";

interface Step1BasicInfoProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step1BasicInfo({ form }: Step1BasicInfoProps) {

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Basic Event Information</h2>
        <p className="text-muted-foreground">
          Provide the essential details about your event
        </p>
      </div>

      {/* Event Name and Expected Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="eventName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
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
              <FormLabel>Expected Participants *</FormLabel>
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
            <FormLabel>Description *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your event..."
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Special Requirements */}
      <FormField
        control={form.control}
        name="specialRequirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Requirements *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special requirements for your event..."
                rows={3}
                maxLength={624}
                {...field}
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
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Allow Ticketing</FormLabel>
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


      {/* Event Permit Documents */}
      <Controller
        control={form.control}
        name="eventValidationDocuments"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Permit Documents *</FormLabel>
            <FormControl>
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
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}


"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Step3CustomVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3CustomVenue({ form }: Step3CustomVenueProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Custom Venue Details</h3>
        <p className="text-sm text-muted-foreground">
          Provide information about the venue you'd like to use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="customVenueDetails.venueName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter venue name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customVenueDetails.addressLine"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customVenueDetails.addressLevel1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City/Province</FormLabel>
              <FormControl>
                <Input placeholder="City or Province" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customVenueDetails.addressLevel2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District/Ward</FormLabel>
              <FormControl>
                <Input placeholder="District or Ward" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customVenueDetails.latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="10.12345"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customVenueDetails.longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  placeholder="106.12345"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customVenueDetails.additionalNotes"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information about the venue..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

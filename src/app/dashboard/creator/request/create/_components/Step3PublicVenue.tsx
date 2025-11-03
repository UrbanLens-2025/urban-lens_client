"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

interface Step3PublicVenueProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3PublicVenue({ form }: Step3PublicVenueProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Public Venue Selection</h3>
        <p className="text-sm text-muted-foreground">
          Select a public location and agree to the terms of usage.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="publicVenueTermsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the terms and conditions
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you agree to follow all public venue guidelines,
                      including cleanup responsibilities, noise restrictions, and permitted hours.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

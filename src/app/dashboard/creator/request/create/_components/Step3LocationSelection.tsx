"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateEventRequestForm } from "../page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Step3BusinessVenue } from "./Step3BusinessVenue";
import { Step3PublicVenue } from "./Step3PublicVenue";
import { Step3CustomVenue } from "./Step3CustomVenue";
import { Building2, MapPin, PenTool } from "lucide-react";

interface Step3LocationSelectionProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

export function Step3LocationSelection({ form }: Step3LocationSelectionProps) {
  const venueType = form.watch("venueType");

  const handleTabChange = (value: string) => {
    form.setValue("venueType", value as "business" | "public" | "custom", {
      shouldValidate: true,
    });
    // Reset location-specific fields when switching tabs
    form.setValue("locationId", undefined);
    form.setValue("customVenueDetails", undefined);
    form.setValue("publicVenueTermsAccepted", false);
    form.setValue("dateRanges", []);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Select Event Venue</h2>
        <p className="text-muted-foreground">
          Choose how you'd like to set up your event location.
        </p>
      </div>

      <Tabs value={venueType} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Venue
          </TabsTrigger>
          <TabsTrigger value="public" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Public Location
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Custom Location
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6">
          <Step3BusinessVenue form={form} />
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          <Step3PublicVenue form={form} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <Step3CustomVenue form={form} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateEventRequest } from "@/hooks/events/useCreateEventRequest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileUpload } from "@/components/shared/FileUpload";
import { TagMultiSelect } from "@/components/shared/TagMultiSelect";
import { useResolvedTags } from "@/hooks/tags/useResolvedTags";
import { DisplayTags } from "@/components/shared/DisplayTags";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useBookableLocations } from "@/hooks/events/useBookableLocations";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CreateEventRequestPayload } from "@/types";

const formSchema = z.object({
  eventName: z.string().min(3, "Tên sự kiện bắt buộc"),
  eventDescription: z.string().min(5, "Mô tả bắt buộc"),
  expectedNumberOfParticipants: z.number().min(1, "Phải lớn hơn 0"),
  allowTickets: z.boolean(),
  specialRequirements: z.string().optional(),
  tagIds: z.array(z.number()).nonempty("Chọn ít nhất 1 tag"),
  social: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string().url("URL không hợp lệ"),
        isMain: z.boolean(),
      })
    )
    .optional(),
  locationId: z.string().uuid("Phải chọn location"),
  startDateTime: z.date({ error: "Start date is required." }),
  endDateTime: z.date({ error: "End date is required." }),
  eventValidationDocuments: z.array(
    z.object({
      documentType: z.literal("EVENT_PERMIT"),
      documentImageUrls: z.array(z.string().url()).nonempty(),
    })
  ),
});

export type CreateEventRequestForm = z.infer<typeof formSchema>;

interface LocationComboBoxProps {
  value: string | undefined; // The selected locationId
  onChange: (value: string) => void; // Function to update the form
}

export function LocationComboBox({ value, onChange }: LocationComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300); // Fetch locations dựa trên từ khóa search

  const { data: response, isLoading } = useBookableLocations({
    search: debouncedSearch,
    limit: 10, // Tải 20 kết quả
  });
  const locations = response?.data || []; // Tìm object location đang được chọn để hiển thị tên

  const selectedLocation = locations.find((loc) => loc.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && selectedLocation
            ? selectedLocation.name
            : "Select a location..."}

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search location by name..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex justify-center items-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                "No location found."
              )}
            </CommandEmpty>

            <CommandGroup>
              {locations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === location.id ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <div>
                    <p>{location.name}</p>{" "}
                    <p className="text-xs text-muted-foreground">
                      {location.addressLine}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>{" "}
    </Popover>
  );
}

export default function CreateEventRequestPage() {
  const form = useForm<CreateEventRequestForm>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      eventName: "",
      eventDescription: "",
      allowTickets: true,
      tagIds: [],
      eventValidationDocuments: [],
      social: [],
    },
  });

  console.log(form.formState.errors);

  const createEvent = useCreateEventRequest();

  const onSubmit = (values: CreateEventRequestForm) => {
    const { startDateTime, endDateTime, ...rest } = values;
    const payload: CreateEventRequestPayload = {
      ...rest,
      social: values.social || [], // Đảm bảo mảng social tồn tại

      // 3. Tạo mảng `dates` mà API yêu cầu
      dates: [
        {
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
        },
      ],
    };
    console.log(payload);
    createEvent.mutate(payload);
  };

  const watchedValues = form.watch();
  const { resolvedTags: tags } = useResolvedTags(watchedValues.tagIds);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Event Request</CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* --- Basic Info --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="eventName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
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
                      <FormLabel>Expected Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 50"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="eventDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special requirements..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Allow Tickets --- */}
              <FormField
                control={form.control}
                name="allowTickets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FormLabel>Allow Ticketing</FormLabel>
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
                name="locationId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Location *</FormLabel>
                    <LocationComboBox
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- 3. (Gợi ý) Chỉ hiển thị Lịch KHI đã chọn Location --- */}
              {watchedValues.locationId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="startDateTime"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="endDateTime"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- Tags --- */}
              <Controller
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagMultiSelect
                        selectedTagIds={field.value}
                        onSelectionChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DisplayTags tags={tags} maxCount={4} />

              {/* --- Event Documents --- */}
              <Controller
                control={form.control}
                name="eventValidationDocuments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Permit Documents</FormLabel>
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

              {/* --- Submit --- */}
              <Button
                type="submit"
                className="w-full"
                disabled={createEvent.isPending}
              >
                {createEvent.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

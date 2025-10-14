"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitCreatorOnboarding } from "@/hooks/useSubmitCreatorOnboarding";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { FileUpload } from "../shared/FileUpload";
import { Textarea } from "../ui/textarea";

const socialLinkSchema = z.object({
  platform: z.string().min(1, "Required"),
  url: z.string().url("Must be a valid URL."),
  isMain: z.boolean(),
});

const creatorSchema = z.object({
  displayName: z.string().min(2, "Display name is required."),
  description: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().min(10, "Phone number is required."),
  avatarUrl: z.string(),
  coverUrl: z.string(),
  type: z.enum(["INDIVIDUAL", "ORGANIZATION"]),
  social: z.array(socialLinkSchema),
});

const types = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "ORGANIZATION", label: "Organization" },
];

type FormValues = z.infer<typeof creatorSchema>;

export function CreatorOnboardingForm() {
  const { mutate: submit, isPending } = useSubmitCreatorOnboarding();

  const form = useForm<FormValues>({
    resolver: zodResolver(creatorSchema),
    defaultValues: {
      displayName: "",
      description: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
      coverUrl: "",
      type: "INDIVIDUAL",
      social: [{ platform: "", url: "", isMain: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  function onSubmit(values: FormValues) {
    submit(values);
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Your Creator Profile</CardTitle>
        <CardDescription>
          Tell us more about you or your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your cool creator name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your event..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phoneNumber"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Social Links</FormLabel>
              <div className="space-y-3 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      name={`social.${index}.platform`}
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Platform (e.g., Instagram)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`social.${index}.url`}
                      control={form.control}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-2 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    append({ platform: "", url: "", isMain: false })
                  }
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Link
                </Button>
              </div>
            </div>

            <Separator />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FileUpload
                    onUploadComplete={(url) =>
                      form.setValue("avatarUrl", url, { shouldValidate: true })
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Cover</FormLabel>
                  <FileUpload
                    onUploadComplete={(url) =>
                      form.setValue("coverUrl", url, { shouldValidate: true })
                    }
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

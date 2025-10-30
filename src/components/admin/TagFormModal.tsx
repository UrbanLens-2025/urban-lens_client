"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreateTagPayload } from "@/types";
import { useCreateTag } from "@/hooks/admin/useCreateTag";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const tagSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  icon: z.string().min(1, "Icon (emoji) is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g., #FF5733)"),
  groupName: z.string().optional(),
});

type FormValues = z.infer<typeof tagSchema>;

interface TagFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagFormModal({ open, onOpenChange }: TagFormModalProps) {
  const { mutate: createTag, isPending } = useCreateTag();

  const form = useForm<FormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      displayName: "",
      icon: "",
      color: "#",
      groupName: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (values: FormValues) => {
    const payload: CreateTagPayload = {
      list: [
        {
          displayName: values.displayName,
          color: values.color,
          icon: values.icon,
          groupName: values.groupName || null,
        }
      ]
    };
    createTag(payload, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
          <DialogDescription>Add a new tag to the system.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="groupName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., Category" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Family Friendly" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="icon"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Emoji)</FormLabel>
                    <FormControl><Input placeholder="e.g., 👨‍👩‍👧‍👦" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="color"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Hex)</FormLabel>
                    <FormControl><Input placeholder="#FF5733" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tag
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
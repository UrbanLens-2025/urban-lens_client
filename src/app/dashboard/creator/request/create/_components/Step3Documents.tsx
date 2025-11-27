"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/FileUpload";
import { FileCheck, Plus, Trash2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { CreateEventRequestForm } from "../page";

interface Step3DocumentsProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

const DOCUMENT_TYPES = [
  { value: "EVENT_PERMIT", label: "Event Permit" },
  { value: "TAX_REGISTRATION", label: "Tax Registration" },
  { value: "HEALTH_PERMIT", label: "Health Permit" },
  { value: "LIABILITY_INSURANCE", label: "Liability Insurance" },
  { value: "ORGANIZER_ID", label: "Organizer ID" },
  { value: "BUSINESS_LICENSE", label: "Business License" },
  { value: "OTHER", label: "Other" },
] as const;

export function Step3Documents({ form }: Step3DocumentsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "eventValidationDocuments",
  });

  const addDocument = () => {
    append({
      documentType: "EVENT_PERMIT",
      documentImageUrls: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 pb-2 border-b border-primary/10">
        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
          <FileCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">Documents</h2>
          <p className="text-muted-foreground text-sm">
            Upload any required documents for your event request.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border-2 border-primary/10 rounded-lg p-4 space-y-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                Document {index + 1}
              </h3>
              {fields.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <FormField
              control={form.control}
              name={`eventValidationDocuments.${index}.documentType`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Document Type</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the type of document you are uploading</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="border-primary/20 focus:border-primary/50">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
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

            <FormField
              control={form.control}
              name={`eventValidationDocuments.${index}.documentImageUrls`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Images</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || []}
                      onChange={(urls) => field.onChange(urls)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {index < fields.length - 1 && <Separator />}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addDocument}
          className="w-full border-primary/20 hover:border-primary/50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>
    </div>
  );
}


"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Globe, Star, Info } from "lucide-react";
import { CreateEventRequestForm } from "../page";

interface SocialLinksInputProps {
  form: UseFormReturn<CreateEventRequestForm>;
}

const popularPlatforms = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Website",
  "Other",
];

export function SocialLinksInput({ form }: SocialLinksInputProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social",
  });

  const socialLinks = form.watch("social") || [];

  const handleAddLink = () => {
    append({
      platform: "",
      url: "",
      isMain: socialLinks.length === 0, // First link is main by default
    });
  };

  const handleToggleMain = (index: number) => {
    const currentLinks = form.getValues("social") || [];
    const newLinks = currentLinks.map((link, i) => ({
      ...link,
      isMain: i === index,
    }));
    form.setValue("social", newLinks);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FormLabel className="text-base flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              Social Media Links
            </FormLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Add social media links to help promote your event</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Add links to promote your event (optional)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLink}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center bg-primary/5">
          <Globe className="h-8 w-8 mx-auto text-primary/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No social links added yet. Click "Add Link" to add your first link.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border-2 border-primary/10 rounded-lg p-4 space-y-3 bg-primary/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm font-medium">
                    Link {index + 1}
                  </FormLabel>
                  {socialLinks[index]?.isMain && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Main
                    </Badge>
                  )}
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name={`social.${index}.platform`}
                  render={({ field: platformField }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Facebook, Instagram"
                          list={`platforms-${index}`}
                          {...platformField}
                        />
                      </FormControl>
                      <datalist id={`platforms-${index}`}>
                        {popularPlatforms.map((platform) => (
                          <option key={platform} value={platform} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`social.${index}.url`}
                  render={({ field: urlField }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://..."
                          {...urlField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name={`social.${index}.isMain`}
                render={({ field: mainField }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Set as Main Link</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Mark this as your primary social media link
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={mainField.value || false}
                        onCheckedChange={(checked) => {
                          mainField.onChange(checked);
                          if (checked) {
                            handleToggleMain(index);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


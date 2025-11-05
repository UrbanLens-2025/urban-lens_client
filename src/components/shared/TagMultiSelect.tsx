"use client";
import { useAllTags } from "@/hooks/tags/useAllTags";
import { Tag } from "@/types";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface TagMultiSelectProps {
  selectedTagIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

export function TagMultiSelect({ selectedTagIds, onSelectionChange }: TagMultiSelectProps) {
  const { data: allTags } = useAllTags();
  const tags = allTags || [];

  const handleSelect = (tagId: number) => {
    const newSelection = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    onSelectionChange(newSelection);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {selectedTagIds.length > 0 ? `${selectedTagIds.length} tags selected` : "Select tags..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags.map((tag: Tag) => (
                <CommandItem key={tag.id} onSelect={() => handleSelect(tag.id)}>
                   <Check className={cn("mr-2 h-4 w-4", selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0")} />
                   {tag.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
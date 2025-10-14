"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProvinces } from "@/api/address";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Province } from "@/types";

interface ProvinceComboBoxProps {
  value?: string;
  onSelect: (province: Province | null) => void;
}

export function ProvinceComboBox({ value, onSelect }: ProvinceComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: provinces = [], isLoading } = useQuery({
    queryKey: ['provinces', debouncedSearch],
    queryFn: () => getProvinces(debouncedSearch),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value 
            ? provinces.find((p) => p.name.toLowerCase() === value.toLowerCase())?.name 
            : "Select province..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Search province..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading && <div className="p-4 text-center text-sm">Loading provinces...</div>}
            <CommandEmpty>No province found.</CommandEmpty>
            <CommandGroup>
              {provinces.map((province) => (
                <CommandItem
                  key={province.code}
                  value={province.name}
                  onSelect={() => {
                    const isSame = value?.toLowerCase() === province.name.toLowerCase();
                    onSelect(isSame ? null : province);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value?.toLowerCase() === province.name.toLowerCase() ? "opacity-100" : "opacity-0")} />
                  {province.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
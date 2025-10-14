"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWardsByProvinceCode } from "@/api/address";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Ward } from "@/types";

interface WardComboBoxProps {
  provinceCode?: string;
  value?: string;
  onSelect: (ward: Ward | null) => void;
  disabled?: boolean;
}

export function WardComboBox({ provinceCode, value, onSelect, disabled }: WardComboBoxProps) {
  const [open, setOpen] = useState(false);
  
  const { data: wards = [], isLoading } = useQuery({
    queryKey: ['wards', provinceCode],
    queryFn: () => getWardsByProvinceCode(provinceCode!),
    enabled: !!provinceCode,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
          disabled={disabled || !provinceCode}
        >
          {/* Tìm ward theo `code` để hiển thị `name` */}
          {value ? wards.find((w) => w.code === value)?.name : "Select ward..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search ward..." />
          <CommandList>
            {isLoading && <div className="p-4 text-center text-sm">Loading...</div>}
            <CommandEmpty>No ward found for this province.</CommandEmpty>
            <CommandGroup>
              {wards.map((ward) => (
                <CommandItem
                  key={ward.code}
                  value={ward.name}
                  onSelect={() => {
                    const isSame = value === ward.code;
                    onSelect(isSame ? null : ward);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === ward.code ? "opacity-100" : "opacity-0")} />
                  {ward.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
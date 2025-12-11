"use client";

import { cn } from "@/lib/utils";
import { DollarSign, Info } from "lucide-react";
import { Badge } from "./badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface CurrencyDisplayProps {
  amount: string | number;
  currency?: string;
  className?: string;
  showCurrency?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "success" | "muted";
}

/**
 * Formats currency amount with proper locale formatting
 */
export function formatCurrency(
  amount: string | number,
  currency: string = "VND"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Professional currency display component
 */
export function CurrencyDisplay({
  amount,
  currency = "VND",
  className,
  showCurrency = false,
  size = "md",
  variant = "default",
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(amount, currency);
  const currencyCode = currency.toUpperCase();

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  const variantClasses = {
    default: "text-foreground",
    primary: "text-primary font-semibold",
    success: "text-green-600 dark:text-green-400 font-semibold",
    muted: "text-muted-foreground",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn(sizeClasses[size], variantClasses[variant])}>
        {formatted}
      </span>
      {showCurrency && (
        <Badge variant="outline" className="text-xs font-medium">
          {currencyCode}
        </Badge>
      )}
    </div>
  );
}

/**
 * Currency info component for form fields - shows currency is fixed
 */
interface CurrencyInfoProps {
  currency?: string;
  className?: string;
  variant?: "default" | "compact";
}

export function CurrencyInfo({
  currency = "VND",
  className,
  variant = "default",
}: CurrencyInfoProps) {
  const currencyCode = currency.toUpperCase();
  const currencyName = currencyCode === "VND" ? "Vietnamese Đồng" : currencyCode;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
          <DollarSign className="h-3 w-3 text-primary" />
          <span className="text-xs font-semibold text-primary">{currencyCode}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Currency is fixed to {currencyCode}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
        className
      )}
    >
      <div className="p-2 rounded-lg bg-primary/20">
        <DollarSign className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {currencyCode}
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            Fixed
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {currencyName} • Currency is fixed and cannot be changed
        </p>
      </div>
    </div>
  );
}


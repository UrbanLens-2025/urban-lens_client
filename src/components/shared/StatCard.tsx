"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  iconBg?: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  // Color variant presets for consistency
  color?: 'default' | 'primary' | 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'emerald' | 'amber';
}

const colorPresets = {
  default: {
    icon: "text-primary",
    bg: "bg-primary/10",
  },
  primary: {
    icon: "text-primary",
    bg: "bg-primary/10",
  },
  blue: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  orange: {
    icon: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  red: {
    icon: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  purple: {
    icon: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  description,
  trend,
  footer,
  className,
  onClick,
  isLoading = false,
  color,
}: StatCardProps) {
  // Use color preset if provided, otherwise use custom colors
  const colors = color && colorPresets[color]
    ? colorPresets[color]
    : {
        icon: iconColor || "text-primary",
        bg: iconBg || "bg-primary/10",
      };

  return (
    <Card
      className={cn(
        "border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-card/80 backdrop-blur-sm overflow-hidden",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-md", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold mb-2">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mb-2">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
              </div>
            )}
            {footer && <div className="mt-3">{footer}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
}


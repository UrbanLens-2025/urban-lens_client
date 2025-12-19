"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string | ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start gap-4 pb-6 border-b-2 border-primary/20", className)}>
      {Icon && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md shrink-0">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}


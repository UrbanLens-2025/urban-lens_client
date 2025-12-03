import * as React from "react";

import { cn } from "@/lib/utils";

// Chart configuration type used to drive colors and labels via CSS variables
export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

export type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
};

/**
 * ChartContainer
 *
 * Wrap your Recharts chart in this component to get CSS variables
 * for each series color and an optional legend/tooltip integration.
 *
 * Example:
 * <ChartContainer config={{ users: { label: "Users", color: "hsl(var(--primary))" } }}>
 *   <LineChart data={data}>...</LineChart>
 * </ChartContainer>
 */
export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const cssVars: React.CSSProperties = {};

  Object.entries(config).forEach(([key, value]) => {
    if (!value?.color) return;
    // @ts-expect-error CSS variable name
    cssVars[`--color-${key}`] = value.color;
  });

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center text-xs",
          className
        )}
        style={cssVars}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export type ChartTooltipContentProps = {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  hideLabel?: boolean;
  className?: string;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel,
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const current = payload[0];
  const colorKey = current.dataKey as string;
  const itemConfig = config[colorKey] ?? {};

  return (
    <div
      className={cn(
        "rounded-lg border bg-background px-3 py-2 shadow-sm",
        className
      )}
    >
      {!hideLabel && (
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor:
              itemConfig.color ?? "hsl(var(--primary-foreground))",
          }}
        />
        <span className="text-[11px] font-medium">
          {itemConfig.label ?? colorKey}
        </span>
        <span className="ml-auto text-[11px] font-semibold">
          {current.value?.toLocaleString?.() ?? current.value}
        </span>
      </div>
    </div>
  );
}



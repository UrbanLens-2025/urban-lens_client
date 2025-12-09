"use client";

import { Check, FileText, FileCheck, CheckCircle2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Location", icon: Building2, description: "Choose venue" },
  { number: 2, label: "Basic Info", icon: FileText, description: "Event details" },
  { number: 3, label: "Documents", icon: FileCheck, description: "Upload files" },
  { number: 4, label: "Review", icon: CheckCircle2, description: "Submit" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="relative w-full">
        {/* Connector Line Background */}
        <div className="absolute top-7 left-0 right-0 h-1.5 bg-muted/30 rounded-full" />
        
        {/* Steps Container */}
        <div className="relative flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const completedUpTo = currentStep - 1;

            return (
              <div key={step.number} className="flex flex-col items-center flex-1 relative z-10 group">
                {/* Connector Line Segment */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-7 left-1/2 w-full h-1.5 rounded-full transition-all duration-700 ease-out",
                      index < completedUpTo 
                        ? "bg-gradient-to-r from-primary via-primary/80 to-primary shadow-lg" 
                        : "bg-muted/30"
                    )}
                    style={{ width: 'calc(100% - 3.5rem)' }}
                  />
                )}
                
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-500 relative z-10 bg-background shadow-lg",
                    isCompleted
                      ? "bg-gradient-to-br from-primary to-primary/90 border-primary text-primary-foreground shadow-xl scale-105"
                      : isCurrent
                        ? "bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-foreground shadow-2xl ring-4 ring-primary/30 scale-110 animate-pulse"
                        : "bg-background border-muted-foreground/30 text-muted-foreground group-hover:border-primary/50 group-hover:scale-105 transition-all"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-7 w-7" />
                  ) : isCurrent ? (
                    <step.icon className="h-7 w-7" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-4 text-center px-1 max-w-[120px]">
                  <span
                    className={cn(
                      "block text-sm font-bold transition-colors",
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                          ? "text-primary"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className={cn(
                    "text-xs mt-1 block transition-colors",
                    isCurrent ? "text-foreground/70" : "text-muted-foreground"
                  )}>
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


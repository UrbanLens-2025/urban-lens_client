"use client";

import { Check, FileText, Tags, FileCheck, CheckCircle2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Basic Info", icon: FileText, description: "Event details" },
  { number: 2, label: "Tags", icon: Tags, description: "Categorize" },
  { number: 3, label: "Location", icon: Building2, description: "Choose venue" },
  { number: 4, label: "Documents", icon: FileCheck, description: "Upload files" },
  { number: 5, label: "Review", icon: CheckCircle2, description: "Submit" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
        <div className="relative w-full max-w-4xl">
        {/* Connector Line Background */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted/50 rounded-full -z-0" />
        
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
                      "absolute top-6 left-1/2 w-full h-1 rounded-full transition-all duration-500",
                      index < completedUpTo 
                        ? "bg-primary shadow-sm" 
                        : "bg-muted/50"
                    )}
                    style={{ width: 'calc(100% - 3rem)' }}
                  />
                )}
                
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 relative z-10 bg-background shadow-sm",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground shadow-md scale-105"
                      : isCurrent
                        ? "bg-primary border-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 scale-110"
                        : "bg-background border-muted-foreground/50 text-muted-foreground group-hover:border-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : isCurrent ? (
                    <step.icon className="h-6 w-6 animate-pulse" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                
                {/* Step Label */}
                <div className="mt-3 text-center px-1">
                  <span
                    className={cn(
                      "block text-xs sm:text-sm font-semibold",
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                          ? "text-primary"
                          : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
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


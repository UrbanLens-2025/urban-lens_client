"use client";

import { Check, FileText, Tags, FileCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Basic Info", icon: FileText },
  { number: 2, label: "Select Tags", icon: Tags },
  { number: 3, label: "Documents", icon: FileCheck },
  { number: 4, label: "Review", icon: CheckCircle2 },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full mb-8">
      <div className="relative w-full max-w-3xl">
        {/* Connector Line Background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0" />
        
        {/* Steps Container */}
        <div className="relative flex items-start justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const completedUpTo = currentStep - 1;

            return (
              <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
                {/* Connector Line Segment */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-5 left-1/2 w-full h-0.5 transition-colors",
                      index < completedUpTo ? "bg-primary" : "bg-muted"
                    )}
                    style={{ width: 'calc(100% - 2.5rem)' }}
                  />
                )}
                
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all relative z-10 bg-background",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground shadow-md"
                      : isCurrent
                        ? "bg-primary border-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                        : "bg-background border-muted-foreground text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : isCurrent ? (
                    <step.icon className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={cn(
                    "mt-2 text-xs sm:text-sm font-medium text-center px-1",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  number: number;
}

const STEPS: Step[] = [
  { number: 1, label: 'Select Branch' },
  { number: 2, label: 'Edit Items' },
];

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isFuture = currentStep < step.number;

        return (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-2">
              {/* Circle */}
              <div
                className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-rubik font-semibold transition-colors shrink-0 ${
                  isCompleted
                    ? 'bg-farmaze-green text-white'
                    : isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  step.number
                )}
              </div>
              {/* Label */}
              <span
                className={`text-sm font-rubik whitespace-nowrap ${
                  isActive
                    ? 'text-foreground font-medium'
                    : isCompleted
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`h-[2px] w-12 mx-2 rounded-full ${
                  currentStep > step.number
                    ? 'bg-farmaze-green'
                    : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;

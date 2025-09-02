import { cn } from "@/lib/utils";

interface ProgressStepsProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Pre-Check" },
  { number: 2, label: "Auto-Package" },
  { number: 3, label: "Submit/Track" },
  { number: 4, label: "Inspections" },
];

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  currentStep >= step.number
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                )}
                data-testid={`step-${step.number}`}
              >
                {step.number}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium",
                  currentStep >= step.number
                    ? "text-blue-600"
                    : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

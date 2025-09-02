import { cn } from "@/lib/utils";
import { FileCheck, Package, Send, ClipboardCheck } from "lucide-react";

interface MobileNavigationProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Pre-Check", icon: FileCheck },
  { number: 2, label: "Package", icon: Package },
  { number: 3, label: "Submit", icon: Send },
  { number: 4, label: "Inspect", icon: ClipboardCheck },
];

export default function MobileNavigation({ currentStep }: MobileNavigationProps) {
  const handleStepClick = (stepNumber: number) => {
    // TODO: Implement step navigation
    console.log(`Navigate to step ${stepNumber}`);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          
          return (
            <button
              key={step.number}
              onClick={() => handleStepClick(step.number)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
              data-testid={`mobile-nav-step-${step.number}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{step.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

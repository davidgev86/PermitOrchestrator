import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";

interface PreCheckChecklistProps {
  permitCase?: any;
}

export default function PreCheckChecklist({ permitCase }: PreCheckChecklistProps) {
  // Mock checklist items - in real implementation, this would come from API
  const checklistItems = [
    {
      item: "Valuation meets minimum requirements",
      status: "passed",
      details: "($15,000)"
    },
    {
      item: "Contractor license is active",
      status: "passed",
      details: "(LICD12345-XYZ)"
    },
    {
      item: "Trade plans are attached and in PDF format",
      status: "passed",
      details: ""
    },
    {
      item: "Energy code compliance documentation",
      status: "warning",
      details: "Required for projects over $10,000"
    }
  ];

  const feeEstimate = 347.50;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Check Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Inspection checklist image */}
        <div className="mb-4">
          <img 
            src="https://images.unsplash.com/photo-1586182987320-4f376d39d787?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
            alt="Professional inspection checklist on clipboard" 
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
        
        <div className="space-y-3 mb-6">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-start" data-testid={`checklist-item-${index}`}>
              <div className="flex-shrink-0 mt-1">
                {item.status === "passed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{item.item}</p>
                {item.details && (
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Fee Estimate</p>
              <p className="text-lg font-bold text-blue-900" data-testid="text-fee-estimate">
                ${feeEstimate.toFixed(2)}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-blue-600 hover:text-blue-700"
              data-testid="button-view-fee-breakdown"
            >
              View breakdown
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

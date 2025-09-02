import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ProjectFormProps {
  form: UseFormReturn<any>;
}

const TRADE_OPTIONS = [
  "electrical",
  "plumbing", 
  "structural",
  "mechanical",
  "roofing",
  "flooring",
  "painting",
  "landscaping"
];

export default function ProjectForm({ form }: ProjectFormProps) {
  const selectedTrades = form.watch("tradeTags") || [];

  const toggleTrade = (trade: string) => {
    const current = selectedTrades;
    const updated = current.includes(trade)
      ? current.filter((t: string) => t !== trade)
      : [...current, trade];
    form.setValue("tradeTags", updated);
  };

  const removeTrade = (trade: string) => {
    const updated = selectedTrades.filter((t: string) => t !== trade);
    form.setValue("tradeTags", updated);
  };

  return (
    <div className="space-y-6">
      {/* Construction permits image */}
      <div className="mb-6">
        <img 
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
          alt="Construction permits and documentation on desk"
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Kitchen Remodel - Main Street"
                data-testid="input-project-name"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="valuationUSD"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Valuation (USD)</FormLabel>
            <FormControl>
              <Input 
                type="number"
                placeholder="15000"
                data-testid="input-project-valuation"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel>Trade Categories</FormLabel>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {TRADE_OPTIONS.map((trade) => (
            <div key={trade} className="flex items-center space-x-2">
              <Checkbox
                id={trade}
                checked={selectedTrades.includes(trade)}
                onCheckedChange={() => toggleTrade(trade)}
                data-testid={`checkbox-trade-${trade}`}
              />
              <label 
                htmlFor={trade} 
                className="text-sm font-medium capitalize cursor-pointer"
              >
                {trade}
              </label>
            </div>
          ))}
        </div>
        
        {selectedTrades.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTrades.map((trade: string) => (
              <Badge 
                key={trade} 
                variant="secondary"
                className="flex items-center gap-1"
                data-testid={`badge-selected-trade-${trade}`}
              >
                {trade}
                <button
                  type="button"
                  onClick={() => removeTrade(trade)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

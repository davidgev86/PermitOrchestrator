import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Info } from "lucide-react";
import { resolveAHJ, getJurisdictionName } from "@/lib/jp-resolver";

interface LocationFormProps {
  form: UseFormReturn<any>;
}

export default function LocationForm({ form }: LocationFormProps) {
  const watchedCity = form.watch("location.city");
  const watchedState = form.watch("location.state");
  
  let ahjKey = "";
  let jurisdictionName = "";
  
  try {
    if (watchedCity && watchedState) {
      ahjKey = resolveAHJ({ city: watchedCity, state: watchedState });
      jurisdictionName = getJurisdictionName(ahjKey);
    }
  } catch (error) {
    // Invalid jurisdiction
  }

  return (
    <div className="space-y-6">
      {/* Government Building Image */}
      <div className="mb-6">
        <img 
          src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
          alt="Government building facade with columns"
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>

      <FormField
        control={form.control}
        name="location.address1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address</FormLabel>
            <FormControl>
              <Input 
                placeholder="123 Main Street"
                data-testid="input-address1"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location.address2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apartment/Unit (Optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="Apt 2B"
                data-testid="input-address2"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="location.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Gaithersburg"
                  data-testid="input-city"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location.state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MD">Maryland</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location.postal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code</FormLabel>
              <FormControl>
                <Input 
                  placeholder="20878"
                  data-testid="input-postal"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {ahjKey && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                <strong>Jurisdiction:</strong> {jurisdictionName}
              </span>
            </div>
            <div className="mt-1 text-sm">
              This location will be handled by {jurisdictionName} for permit processing.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

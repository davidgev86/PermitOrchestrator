import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface JurisdictionRulesProps {
  ahjKey?: string;
}

export default function JurisdictionRules({ ahjKey }: JurisdictionRulesProps) {
  const getJurisdictionName = (key?: string) => {
    switch (key) {
      case 'us/md/gaithersburg':
        return 'City of Gaithersburg';
      case 'us/md/rockville':
        return 'City of Rockville';
      case 'us/md/montgomery_county':
        return 'Montgomery County DPS';
      default:
        return 'Unknown Jurisdiction';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jurisdiction Rules</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Government building image */}
        <div className="mb-4">
          <img 
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200" 
            alt="Government building facade with columns" 
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
        
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <strong>Important Notice:</strong> These are preliminary checks for the {getJurisdictionName(ahjKey)}, 
            Montgomery County, MD. May not reflect all requirements.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <InfoIcon className="h-4 w-4 text-blue-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm">
                Submission requires {getJurisdictionName(ahjKey)} log-in to run and submit 
                through portal criteria.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-4 w-4 text-gray-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm">
                Typical processing time: {ahjKey === 'us/md/rockville' ? '10-12' : '15-20'} business days
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <DollarSign className="h-4 w-4 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm">
                Base permit fee: ${ahjKey === 'us/md/montgomery_county' ? '200' : '125'} + valuation-based fees
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

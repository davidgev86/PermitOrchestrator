import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface ProjectOverviewProps {
  project: any;
}

export default function ProjectOverview({ project }: ProjectOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Construction site image */}
        <div className="mb-6">
          <img 
            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
            alt="Construction site with permit documentation" 
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Jurisdiction
            </label>
            <p className="text-sm font-medium" data-testid="text-jurisdiction">
              {project.location?.ahjKey === 'us/md/gaithersburg' && 'City of Gaithersburg, MD'}
              {project.location?.ahjKey === 'us/md/rockville' && 'City of Rockville, MD'}
              {project.location?.ahjKey === 'us/md/montgomery_county' && 'Montgomery County DPS, MD'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Permit Type
            </label>
            <p className="text-sm font-medium" data-testid="text-permit-type">
              Residential Kitchen Remodel
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Project Value
            </label>
            <p className="text-sm font-medium" data-testid="text-project-value">
              ${project.valuationUSD?.toLocaleString() || 'TBD'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Trade Tags
            </label>
            <div className="flex flex-wrap gap-1">
              {project.tradeTags?.map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs"
                  data-testid={`badge-trade-${tag}`}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-run-precheck"
        >
          <Play className="h-4 w-4 mr-2" />
          Run Pre-Check
        </Button>
      </CardContent>
    </Card>
  );
}

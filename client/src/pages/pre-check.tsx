import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

export default function PreCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getCurrentUser,
  });

  const { data: orgs } = useQuery({
    queryKey: ["/api/orgs"],
    enabled: !!user,
  });

  const orgId = orgs?.[0]?.id;

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/orgs", orgId, "projects"],
    enabled: !!orgId,
  });

  // Mutation to create a permit case if one doesn't exist
  const createCaseMutation = useMutation({
    mutationFn: async (project: any) => {
      const caseData = {
        projectId: project.id,
        permitType: "residential_kitchen_remodel",
        ahjKey: project.location?.ahjKey || "us/md/gaithersburg",
        status: "draft"
      };
      
      return apiRequest(`/api/orgs/${orgId}/cases`, {
        method: "POST",
        body: JSON.stringify(caseData)
      });
    }
  });

  // Mutation to run pre-check
  const precheckMutation = useMutation({
    mutationFn: async (caseId: string) => {
      return apiRequest(`/api/cases/${caseId}/precheck`, {
        method: "POST",
        body: JSON.stringify({})
      });
    },
    onSuccess: () => {
      toast({
        title: "Pre-check completed",
        description: "All validation checks have been run successfully",
      });
      // Refresh projects data to get updated case status
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", orgId, "projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Pre-check failed",
        description: error.message || "Failed to run pre-check validation",
        variant: "destructive",
      });
    }
  });

  const handleRunPrecheck = async (project: any) => {
    try {
      let caseId = project.cases?.[0]?.id;
      
      // If no case exists, create one first
      if (!caseId) {
        const newCase = await createCaseMutation.mutateAsync(project);
        caseId = newCase.id;
      }
      
      // Run pre-check on the case
      await precheckMutation.mutateAsync(caseId);
    } catch (error) {
      console.error("Pre-check error:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "precheck_ready":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "draft":
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "precheck_ready":
        return "Ready";
      case "draft":
        return "Draft";
      default:
        return "Pending";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Pre-Check Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Run pre-check validation on your projects to ensure they meet all requirements
          </p>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Found</h3>
              <p className="text-muted-foreground text-center">
                You don't have any projects yet. Create a project first to run pre-checks.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => {
              const currentCase = project.cases?.[0];
              const isRunning = createCaseMutation.isPending || precheckMutation.isPending;
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2" data-testid={`project-title-${project.id}`}>
                          {project.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {project.location?.address1}, {project.location?.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(currentCase?.status || "draft")}
                        <Badge 
                          variant={currentCase?.status === "precheck_ready" ? "default" : "secondary"}
                          data-testid={`status-${project.id}`}
                        >
                          {getStatusLabel(currentCase?.status || "draft")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Jurisdiction:</span>
                          <p className="font-medium" data-testid={`jurisdiction-${project.id}`}>
                            {project.location?.ahjKey === 'us/md/gaithersburg' && 'Gaithersburg'}
                            {project.location?.ahjKey === 'us/md/rockville' && 'Rockville'}
                            {project.location?.ahjKey === 'us/md/montgomery_county' && 'Montgomery County'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Value:</span>
                          <p className="font-medium" data-testid={`value-${project.id}`}>
                            ${project.valuationUSD?.toLocaleString() || 'TBD'}
                          </p>
                        </div>
                      </div>

                      {project.tradeTags && project.tradeTags.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Trade Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.tradeTags.map((tag: string) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs"
                                data-testid={`trade-tag-${project.id}-${tag}`}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentCase?.feeEstimateUSD && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">Fee Estimate</span>
                            <span className="text-lg font-bold text-blue-900" data-testid={`fee-${project.id}`}>
                              ${currentCase.feeEstimateUSD.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleRunPrecheck(project)}
                        disabled={isRunning}
                        data-testid={`button-precheck-${project.id}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isRunning ? "Running Pre-Check..." : "Run Pre-Check"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
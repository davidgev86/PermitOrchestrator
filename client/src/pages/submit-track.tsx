import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Activity, CheckCircle, Clock, AlertTriangle, Eye } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

export default function SubmitTrack() {
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

  const orgId = orgs && orgs.length > 0 ? orgs[0]?.id : undefined;

  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/orgs", orgId, "projects"],
    enabled: !!orgId,
  });

  // Mutation to submit a permit case
  const submitMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/submit`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Permit submitted",
        description: "Permit submission has been queued for processing",
      });
      // Refresh projects data to get updated case status
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", orgId, "projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit permit",
        variant: "destructive",
      });
    }
  });

  const handleSubmitCase = async (project: any) => {
    try {
      const caseId = project.cases?.[0]?.id;
      if (!caseId) {
        toast({
          title: "No permit case found",
          description: "Create a package first before submitting",
          variant: "destructive",
        });
        return;
      }
      
      await submitMutation.mutateAsync(caseId);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const getStatusIcon = (project: any) => {
    const status = project.cases?.[0]?.status;
    switch (status) {
      case "submitted":
      case "under_review":
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "packaged":
        return <Send className="h-5 w-5 text-blue-500" />;
      case "rejected":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (project: any) => {
    const status = project.cases?.[0]?.status;
    switch (status) {
      case "submitted":
        return "Submitted";
      case "under_review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "packaged":
        return "Ready to Submit";
      default:
        return "Not Ready";
    }
  };

  const getStatusColor = (project: any) => {
    const status = project.cases?.[0]?.status;
    switch (status) {
      case "submitted":
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "packaged":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const canSubmit = (project: any) => {
    const status = project.cases?.[0]?.status;
    return status === "packaged";
  };

  const isSubmitted = (project: any) => {
    const status = project.cases?.[0]?.status;
    return ["submitted", "under_review", "approved", "rejected"].includes(status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-submit-track">Submit & Track</h1>
          <p className="mt-2 text-lg text-gray-600">
            Submit packaged permits and track their status through the approval process
          </p>
        </div>

        {!projects || !Array.isArray(projects) || projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <Send className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create and package a project first.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(projects) && projects.map((project: any) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold" data-testid={`project-title-${project.id}`}>
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(project)}
                    </div>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <Badge className={getStatusColor(project)} data-testid={`status-${project.id}`}>
                        {getStatusText(project)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Location:</span>
                      <span className="text-sm text-gray-600">
                        {project.location?.address || "No address"}
                      </span>
                    </div>

                    {project.cases?.[0]?.permitNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Permit #:</span>
                        <span className="text-sm font-mono text-gray-600">
                          {project.cases[0].permitNumber}
                        </span>
                      </div>
                    )}

                    {isSubmitted(project) && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-blue-700">
                            Tracking status with jurisdiction
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button
                          onClick={() => handleSubmitCase(project)}
                          disabled={!canSubmit(project) || submitMutation.isPending}
                          size="sm"
                          className="flex items-center justify-center space-x-1 text-xs px-3 py-2 flex-1 sm:flex-none"
                          data-testid={`button-submit-${project.id}`}
                        >
                          <Send className="h-3 w-3" />
                          <span>
                            {submitMutation.isPending ? "Submitting..." : "Submit"}
                          </span>
                        </Button>
                        
                        {isSubmitted(project) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center justify-center space-x-1 text-xs px-3 py-2 flex-1 sm:flex-none"
                            data-testid={`button-track-${project.id}`}
                            disabled
                          >
                            <Eye className="h-3 w-3" />
                            <span>Track</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
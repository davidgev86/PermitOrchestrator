import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";

export default function AutoPackage() {
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

  // Mutation to package a permit case
  const packageMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/package`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package completed",
        description: "Permit package has been created successfully",
      });
      // Refresh projects data to get updated case status
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", orgId, "projects"] });
    },
    onError: (error: any) => {
      toast({
        title: "Package failed",
        description: error.message || "Failed to create permit package",
        variant: "destructive",
      });
    }
  });

  const handlePackageCase = async (project: any) => {
    try {
      const caseId = project.cases?.[0]?.id;
      if (!caseId) {
        toast({
          title: "No permit case found",
          description: "Run pre-check first to create a permit case",
          variant: "destructive",
        });
        return;
      }
      
      await packageMutation.mutateAsync(caseId);
    } catch (error) {
      console.error("Package error:", error);
    }
  };

  const getStatusIcon = (project: any) => {
    const status = project.cases?.[0]?.status;
    switch (status) {
      case "packaged":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "precheck_ready":
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (project: any) => {
    const status = project.cases?.[0]?.status;
    switch (status) {
      case "packaged":
        return "Packaged";
      case "precheck_ready":
        return "Ready to Package";
      default:
        return "Not Ready";
    }
  };

  const getStatusColor = (project: any) => {
    const status = project.cases?.[0]?.status;
    switch (status) {
      case "packaged":
        return "bg-green-100 text-green-800";
      case "precheck_ready":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const canPackage = (project: any) => {
    const status = project.cases?.[0]?.status;
    return status === "precheck_ready";
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
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-auto-package">Auto-Package</h1>
          <p className="mt-2 text-lg text-gray-600">
            Automatically package permits that have passed pre-check validation
          </p>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create a project and run pre-check first.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
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

                    {project.cases?.[0]?.status === "packaged" && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-green-700">
                            Package ready for submission
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4">
                      <Button
                        onClick={() => handlePackageCase(project)}
                        disabled={!canPackage(project) || packageMutation.isPending}
                        size="sm"
                        className="flex items-center space-x-2"
                        data-testid={`button-package-${project.id}`}
                      >
                        <Package className="h-4 w-4" />
                        <span>
                          {packageMutation.isPending ? "Packaging..." : "Create Package"}
                        </span>
                      </Button>
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
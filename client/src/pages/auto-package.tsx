import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, CheckCircle, AlertTriangle, Clock, Eye, FileText, Paperclip } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { useState } from "react";

export default function AutoPackage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

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

  const isPackaged = (project: any) => {
    const status = project.cases?.[0]?.status;
    return status === "packaged";
  };

  // Query to fetch package details
  const { data: packageDetails, refetch: refetchPackage } = useQuery({
    queryKey: ["/api/cases", selectedPackage?.cases?.[0]?.id, "package"],
    enabled: !!selectedPackage?.cases?.[0]?.id && isPackageModalOpen,
  });

  const handleViewPackage = (project: any) => {
    setSelectedPackage(project);
    setIsPackageModalOpen(true);
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
                      <div className="flex space-x-2">
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
                        
                        {isPackaged(project) && (
                          <Button
                            onClick={() => handleViewPackage(project)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2"
                            data-testid={`button-view-package-${project.id}`}
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Package</span>
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

        {/* Package Details Modal */}
        <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Package Details</span>
              </DialogTitle>
              <DialogDescription>
                Package contents for {selectedPackage?.name}
              </DialogDescription>
            </DialogHeader>
            
            {packageDetails?.packageManifest && (
              <div className="space-y-6">
                {/* Package Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Jurisdiction</h4>
                    <p className="text-sm">{packageDetails.packageManifest.jurisdiction}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Permit Type</h4>
                    <p className="text-sm">{packageDetails.packageManifest.permitType}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Packaged At</h4>
                    <p className="text-sm">
                      {new Date(packageDetails.packageManifest.packagedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700">Case ID</h4>
                    <p className="text-sm font-mono">{packageDetails.packageManifest.caseId}</p>
                  </div>
                </div>

                {/* Required Forms */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Required Forms</span>
                  </h4>
                  <div className="space-y-2">
                    {packageDetails.packageManifest.forms?.map((form: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-sm">{form.title}</p>
                          <p className="text-xs text-gray-600">{form.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {form.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No forms specified</p>
                    )}
                  </div>
                </div>

                {/* Required Attachments */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <Paperclip className="h-4 w-4" />
                    <span>Required Attachments</span>
                  </h4>
                  <div className="space-y-2">
                    {packageDetails.packageManifest.attachments?.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-sm">{attachment.title}</p>
                          <p className="text-xs text-gray-600">{attachment.description}</p>
                          {attachment.fileTypes && (
                            <p className="text-xs text-gray-500 mt-1">
                              Accepted: {attachment.fileTypes.join(", ")}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {attachment.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No attachments specified</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!packageDetails && (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Loading package details...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
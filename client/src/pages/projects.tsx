import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, DollarSign, Building2, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getCurrentUser,
  });

  const { data: orgs } = useQuery({
    queryKey: ["/api/orgs"],
    enabled: !!user,
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/orgs", orgs?.[0]?.id, "projects"],
    enabled: !!orgs?.[0]?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", orgs?.[0]?.id, "projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been permanently removed",
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the project",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (project: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (project: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setLocation(`/projects/${project.id}/edit`);
  };

  if (!user) {
    setLocation("/auth");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-muted rounded-lg"></div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-2">
              Manage your permit applications and track progress
            </p>
          </div>
          <Button 
            onClick={() => setLocation("/projects/new")}
            data-testid="button-new-project"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects Image */}
        <div className="mb-8">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=300" 
            alt="Modern office building construction project"
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        {projects && projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start managing permits
              </p>
              <Button onClick={() => setLocation("/projects/new")}>
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map(project => (
              <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/projects/${project.id}`)}
                data-testid={`card-project-${project.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="truncate">{project.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {project.cases?.length || 0} cases
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-project-menu-${project.id}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => handleEditClick(project, e)}
                            data-testid={`button-edit-${project.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDeleteClick(project, e)}
                            className="text-destructive"
                            data-testid={`button-delete-${project.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{project.location?.address1}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>${project.valuationUSD?.toLocaleString() || 'TBD'}</span>
                    </div>
                    {project.tradeTags && project.tradeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {project.tradeTags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              All associated permit cases and data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(projectToDelete?.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

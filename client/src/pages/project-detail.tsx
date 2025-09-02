import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Navigation from "@/components/layout/navigation";
import ProjectOverview from "@/components/project/project-overview";
import ProgressSteps from "@/components/project/progress-steps";
import PreCheckChecklist from "@/components/project/pre-check-checklist";
import JurisdictionRules from "@/components/project/jurisdiction-rules";
import RequiredDocuments from "@/components/project/required-documents";
import RecentActivity from "@/components/project/recent-activity";
import QuickActions from "@/components/project/quick-actions";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export default function ProjectDetail() {
  const [match, params] = useRoute("/projects/:id");
  const projectId = params?.id;

  const { data: project = {}, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-96 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground">Project Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const currentCase = project.cases?.[0]; // For demo, use first case

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-3xl font-bold text-foreground mt-2">
            {project.location?.address1}, {project.location?.city}, {project.location?.state}
          </h1>
        </div>

        {/* Progress Steps */}
        <ProgressSteps currentStep={1} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <ProjectOverview project={project} />
            <JurisdictionRules ahjKey={project.location?.ahjKey} />
            <RequiredDocuments permitCase={currentCase} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <PreCheckChecklist permitCase={currentCase} />
            <RecentActivity projectId={project.id} />
            <QuickActions project={project} />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              <span>Status: </span>
              <span className="font-medium text-blue-600">
                {currentCase?.status || 'Draft'}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>Last updated: </span>
              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" data-testid="button-save-draft">
              Save as Draft
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-proceed-package"
            >
              Proceed to Auto-Package
            </Button>
          </div>
        </div>
      </div>

      <MobileNavigation currentStep={1} />
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import Navigation from "@/components/layout/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import ProjectForm from "@/components/forms/project-form";
import LocationForm from "@/components/forms/location-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getCurrentUser } from "@/lib/auth";
import { getAuthHeader } from "@/lib/auth";
import { ArrowLeft, ArrowRight } from "lucide-react";

const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  valuationUSD: z.number().min(0, "Valuation must be positive"),
  tradeTags: z.array(z.string()).default([]),
  location: z.object({
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postal: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code"),
  }),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

export default function ProjectNew() {
  const [step, setStep] = useState<"project" | "location" | "review">("project");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getCurrentUser,
  });

  const { data: orgs } = useQuery({
    queryKey: ["/api/orgs"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch("/api/orgs", {
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error('Failed to fetch organizations');
      return res.json();
    },
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      valuationUSD: 0,
      tradeTags: [],
      location: {
        address1: "",
        address2: "",
        city: "",
        state: "MD",
        postal: "",
      },
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (!orgs?.[0]?.id) {
        throw new Error("No organization found");
      }
      
      const res = await fetch(`/api/orgs/${orgs[0].id}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create project');
      }
      
      return res.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
      toast({
        title: "Project created successfully",
        description: "Your project has been created and is ready for permit applications.",
      });
      setLocation(`/projects/${project.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const nextStep = () => {
    if (step === "project") {
      form.trigger(["name", "valuationUSD", "tradeTags"]).then((isValid) => {
        if (isValid) setStep("location");
      });
    } else if (step === "location") {
      form.trigger(["location"]).then((isValid) => {
        if (isValid) setStep("review");
      });
    }
  };

  const prevStep = () => {
    if (step === "location") setStep("project");
    if (step === "review") setStep("location");
  };

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/projects")}
            data-testid="button-back-to-projects"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new construction project for permit management
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "project" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === "project" ? "text-blue-600" : "text-gray-500"
              }`}>
                Project Details
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "location" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === "location" ? "text-blue-600" : "text-gray-500"
              }`}>
                Location
              </span>
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === "review" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step === "review" ? "text-blue-600" : "text-gray-500"
              }`}>
                Review
              </span>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {step === "project" && "Project Information"}
              {step === "location" && "Project Location"}
              {step === "review" && "Review & Create"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === "project" && <ProjectForm form={form} />}
                {step === "location" && <LocationForm form={form} />}
                {step === "review" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Review Project Details</h3>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div><strong>Name:</strong> {form.watch("name")}</div>
                      <div><strong>Valuation:</strong> ${form.watch("valuationUSD")?.toLocaleString()}</div>
                      <div><strong>Address:</strong> {form.watch("location.address1")}, {form.watch("location.city")}, {form.watch("location.state")} {form.watch("location.postal")}</div>
                      <div><strong>Trades:</strong> {form.watch("tradeTags")?.join(", ") || "None"}</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  {step !== "project" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prevStep}
                      data-testid="button-previous-step"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  
                  {step !== "review" ? (
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="ml-auto bg-blue-600 hover:bg-blue-700"
                      data-testid="button-next-step"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={createProjectMutation.isPending}
                      className="ml-auto bg-blue-600 hover:bg-blue-700"
                      data-testid="button-create-project"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

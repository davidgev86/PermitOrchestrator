import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share, Download, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  project: any;
}

export default function QuickActions({ project }: QuickActionsProps) {
  const { toast } = useToast();

  const handleGenerateShareLink = () => {
    // In real implementation, this would generate a shareable token
    const shareUrl = `${window.location.origin}/share/${project.id}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Share link copied",
      description: "Link copied to clipboard for homeowner/inspector access",
    });
  };

  const handleExportProject = () => {
    toast({
      title: "Export started",
      description: "Your project PDF will be ready shortly",
    });
  };

  const handleContactSupport = () => {
    toast({
      title: "Support contacted",
      description: "We'll get back to you within 24 hours",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-left p-3 h-auto hover:bg-accent transition-colors"
            onClick={handleGenerateShareLink}
            data-testid="button-generate-share-link"
          >
            <Share className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Generate Share Link</p>
              <p className="text-xs text-muted-foreground">For homeowner/inspector access</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start text-left p-3 h-auto hover:bg-accent transition-colors"
            onClick={handleExportProject}
            data-testid="button-export-project"
          >
            <Download className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Export Project</p>
              <p className="text-xs text-muted-foreground">Download PDF summary</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start text-left p-3 h-auto hover:bg-accent transition-colors"
            onClick={handleContactSupport}
            data-testid="button-contact-support"
          >
            <Headphones className="h-4 w-4 text-purple-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Contact Support</p>
              <p className="text-xs text-muted-foreground">Get help with your permit</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

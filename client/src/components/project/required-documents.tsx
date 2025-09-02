import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle } from "lucide-react";

interface RequiredDocumentsProps {
  permitCase?: any;
}

export default function RequiredDocuments({ permitCase }: RequiredDocumentsProps) {
  const documents = [
    {
      name: "Construction Plans",
      required: true,
      format: "PDF format",
      uploaded: false
    },
    {
      name: "Site Plan",
      required: true,
      format: "PDF format",
      uploaded: true
    },
    {
      name: "Contractor License",
      required: true,
      format: "PDF format",
      uploaded: true
    },
    {
      name: "Insurance (ACORD 25)",
      required: true,
      format: "PDF format",
      uploaded: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Construction tools image */}
        <div className="mb-4">
          <img 
            src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=200" 
            alt="Professional construction tools and blueprints on desk" 
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
        
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 border border-border rounded-lg"
              data-testid={`document-${index}`}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.required ? 'Required' : 'Optional'} - {doc.format}
                  </p>
                </div>
              </div>
              {doc.uploaded ? (
                <span className="text-green-600 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Uploaded
                </span>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  data-testid={`button-upload-${index}`}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AuthVerify() {
  const [match, params] = useRoute("/auth/verify");
  const [, setLocation] = useLocation();
  const [verificationResult, setVerificationResult] = useState<"pending" | "success" | "error">("pending");
  const { toast } = useToast();

  const verifyTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/auth/verify", { token });
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("sessionToken", data.sessionToken);
      localStorage.setItem("userEmail", data.userEmail);
      setVerificationResult("success");
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully",
      });
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error) => {
      setVerificationResult("error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid or expired magic link",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Get token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      verifyTokenMutation.mutate(token);
    } else {
      setVerificationResult("error");
    }
  }, []);

  const handleTryAgain = () => {
    setLocation("/auth");
  };

  const handleContinue = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Verifying Your Access</h1>
          <p className="text-muted-foreground mt-2">
            Please wait while we confirm your identity
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              {verificationResult === "pending" && (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verifying...
                </>
              )}
              {verificationResult === "success" && (
                <>
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Success!
                </>
              )}
              {verificationResult === "error" && (
                <>
                  <XCircle className="h-5 w-5 mr-2 text-red-600" />
                  Verification Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationResult === "pending" && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Confirming your magic link token...
                </p>
              </div>
            )}

            {verificationResult === "success" && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Your identity has been confirmed. You'll be redirected to the dashboard in a moment.
                </p>
                <Button 
                  onClick={handleContinue}
                  className="w-full"
                  data-testid="button-continue"
                >
                  Continue to Dashboard
                </Button>
              </div>
            )}

            {verificationResult === "error" && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  The magic link is invalid or has expired. Please request a new one.
                </p>
                <Button 
                  onClick={handleTryAgain}
                  className="w-full"
                  data-testid="button-try-again"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
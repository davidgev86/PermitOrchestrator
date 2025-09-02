import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowRight } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const tokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type TokenFormData = z.infer<typeof tokenSchema>;

export default function Auth() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const tokenForm = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { token: "" },
  });

  const sendMagicLinkMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const res = await apiRequest("POST", "/api/auth/magiclink", data);
      return res.json();
    },
    onSuccess: () => {
      setEmail(emailForm.getValues().email);
      setStep("verify");
      toast({
        title: "Magic link sent",
        description: "Check your email for the login link",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send magic link",
        variant: "destructive",
      });
    },
  });

  const verifyTokenMutation = useMutation({
    mutationFn: async (data: TokenFormData) => {
      const res = await apiRequest("POST", "/api/auth/consume", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("sessionToken", data.sessionToken);
      localStorage.setItem("userEmail", data.userEmail);
      toast({
        title: "Welcome back!",
        description: "You've been logged in successfully",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid verification token",
        variant: "destructive",
      });
    },
  });

  const onEmailSubmit = (data: EmailFormData) => {
    sendMagicLinkMutation.mutate(data);
  };

  const onTokenSubmit = (data: TokenFormData) => {
    verifyTokenMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Sign In</h1>
          <p className="text-muted-foreground mt-2">
            Access your permit management dashboard
          </p>
        </div>

        {step === "email" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Email Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="contractor@example.com" 
                            data-testid="input-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={sendMagicLinkMutation.isPending}
                    data-testid="button-send-magic-link"
                  >
                    {sendMagicLinkMutation.isPending ? "Sending..." : "Send Magic Link"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>. 
                Click the link in your email or enter the token below.
              </p>
              
              <Form {...tokenForm}>
                <form onSubmit={tokenForm.handleSubmit(onTokenSubmit)} className="space-y-4">
                  <FormField
                    control={tokenForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Token</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter token from email" 
                            data-testid="input-token"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={verifyTokenMutation.isPending}
                    data-testid="button-verify-token"
                  >
                    {verifyTokenMutation.isPending ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                </form>
              </Form>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setStep("email")}
                data-testid="button-back-to-email"
              >
                Back to Email
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

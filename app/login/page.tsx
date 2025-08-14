"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get redirect URL from query params (from email links)
  const redirectTo = searchParams?.get('redirect') || '/admin';
  const fromEmail = searchParams?.get('source') === 'email';

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          const data = await response.json();
          if (data.admin) {
            // User is already logged in, redirect to intended destination
            router.replace(redirectTo);
            return;
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    checkSession();
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
        if (res.ok) {
        // Set a flag to prevent multiple redirects
        sessionStorage.setItem('loginSuccess', 'true');
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.admin.username}!`,
        });
        
        // Short delay to ensure toast is shown, then redirect
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1000);
      } else {
        toast({
          title: "Login Failed", 
          description: data.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Tunda Sports Club
            </CardTitle>
            <CardDescription className="mt-2">
              Admin Login Portal
            </CardDescription>
          </div>
          
          {fromEmail && (
            <Alert className="text-left">
              <ArrowRight className="h-4 w-4" />
              <AlertDescription>
                You're being redirected from an email link. Please login to continue to the registrations page.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {redirectTo !== '/admin' && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-primary">
                <strong>Redirect Notice:</strong> After login, you'll be taken to:{" "}
                <span className="font-mono text-xs bg-primary/10 px-1 py-0.5 rounded">
                  {redirectTo}
                </span>
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Authorized personnel only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

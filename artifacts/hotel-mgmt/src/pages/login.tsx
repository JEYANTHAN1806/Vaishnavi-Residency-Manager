import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          localStorage.setItem("vr_user", JSON.stringify(data.user));
          toast.success("Login successful");
          setLocation("/dashboard");
        },
        onError: () => {
          toast.error("Invalid credentials");
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen bg-background w-full">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary text-primary-foreground p-12">
        <div>
          <div className="flex items-center gap-3 text-2xl font-bold mb-4">
            <Building2 className="w-8 h-8" />
            Vaishnavi Residency
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Premium Hotel Management System. Confident, precise, and
            information-rich.
          </p>
        </div>
        <div>
          <p className="text-primary-foreground/60 text-sm">
            &copy; {new Date().getFullYear()} Vaishnavi Residency. All rights reserved.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-border">
          <CardContent className="p-8">
            <div className="lg:hidden flex items-center justify-center gap-3 text-2xl font-bold mb-8 text-primary">
              <Building2 className="w-8 h-8" />
              Vaishnavi Residency
            </div>
            
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loginMutation.isPending}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                  className="h-12"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
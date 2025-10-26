import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back to Momento!" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: "Welcome to Momento!", description: "Your account has been created." });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-[var(--shadow-polaroid)] bg-card border-border">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold text-primary">
          {isLogin ? "Welcome Back" : "Join Momento"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {isLogin ? "Sign in to your memory scrapbook" : "Start preserving your memories"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-background border-border"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

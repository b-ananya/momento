import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Navigation = () => {
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  const links = [
    { to: "/", icon: Home, label: "Feed" },
    { to: "/upload", icon: Plus, label: "Upload" },
    { to: "/insights", icon: Sparkles, label: "AI Insights" },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-[var(--shadow-soft)] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            momento
          </Link>
          <div className="flex items-center gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

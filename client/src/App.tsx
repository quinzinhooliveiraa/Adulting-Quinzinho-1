import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import Onboarding from "@/components/Onboarding";

import Home from "@/pages/Home";
import Journal from "@/pages/Journal";
import Questions from "@/pages/Questions";
import Journey from "@/pages/Journey";
import JourneyDetail from "@/pages/JourneyDetail";
import Book from "@/pages/Book";
import Admin from "@/pages/Admin";
import Premium from "@/pages/Premium";
import Reports from "@/pages/Reports";

function AuthGate() {
  const { user, isLoading } = useAuth();
  const needsOnboarding = user && localStorage.getItem("casa-dos-20-needs-onboarding") === "true";
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-serif text-lg">Casa dos 20</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Auth
        onRegisterSuccess={() => {
          localStorage.setItem("casa-dos-20-needs-onboarding", "true");
        }}
      />
    );
  }

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          localStorage.removeItem("casa-dos-20-needs-onboarding");
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <MobileLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/journal" component={Journal} />
        <Route path="/questions" component={Questions} />
        <Route path="/journey" component={Journey} />
        <Route path="/journey/:id" component={JourneyDetail} />
        <Route path="/book" component={Book} />
        <Route path="/premium" component={Premium} />
        <Route path="/reports" component={Reports} />
        {user?.role === "admin" && <Route path="/admin" component={Admin} />}
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="casa-dos-20-theme" attribute="class">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AuthGate />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

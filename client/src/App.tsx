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
import { refreshPushSubscription } from "@/utils/pushNotifications";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

import Home from "@/pages/Home";
import Journal from "@/pages/Journal";
import Questions from "@/pages/Questions";
import Journey from "@/pages/Journey";
import JourneyDetail from "@/pages/JourneyDetail";
import Book from "@/pages/Book";
import Admin from "@/pages/Admin";
import Premium from "@/pages/Premium";
import Reports from "@/pages/Reports";
import SharedEntry from "@/pages/SharedEntry";

function AuthGate() {
  const { user, isLoading } = useAuth();
  const needsOnboarding = user && localStorage.getItem("casa-dos-20-needs-onboarding") === "true";
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [needsOnboarding]);

  useEffect(() => {
    if (user) {
      refreshPushSubscription();
    }
  }, [user]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "PLAY_SOUND" && event.data.sound) {
          const audio = new Audio(event.data.sound);
          audio.volume = 0.7;
          audio.play().catch(() => {});
        }
      };
      navigator.serviceWorker.addEventListener("message", handler);
      return () => navigator.serviceWorker.removeEventListener("message", handler);
    }
  }, []);

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
          localStorage.removeItem("casa-onboarding-step");
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
      <PwaInstallPrompt />
    </MobileLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="casa-dos-20-theme" attribute="class" enableSystem disableTransitionOnChange={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              <Route path="/shared/:slug" component={SharedEntry} />
              <Route>
                <AuthGate />
              </Route>
            </Switch>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

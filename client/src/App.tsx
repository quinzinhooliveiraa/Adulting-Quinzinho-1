import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import WelcomeTrialModal from "@/components/WelcomeTrialModal";

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
import ResetPassword from "@/pages/ResetPassword";
import OpenInBrowser from "@/pages/OpenInBrowser";

function AuthGate() {
  const { user, isLoading, refetch } = useAuth();
  const [, setLocation] = useLocation();
  const needsOnboarding = user && localStorage.getItem("casa-dos-20-needs-onboarding") === "true";
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [bonusBanner, setBonusBanner] = useState<"success" | "cancel" | "checkout-success" | null>(null);
  const [pwaReturnBanner, setPwaReturnBanner] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleNewUser = params.get("google_new_user");
    const googleLogin = params.get("google_login");
    const err = params.get("google_error");
    const bonus = params.get("bonus");
    const checkout = params.get("checkout");
    const fromPwa = params.get("pwa") === "1";

    if (googleNewUser || googleLogin || err !== null || bonus || checkout || fromPwa) {
      window.history.replaceState({}, "", window.location.pathname);
      if (googleNewUser) {
        localStorage.setItem("casa-dos-20-needs-onboarding", "true");
      }
      if (err) {
        const messages: Record<string, string> = {
          cancelled: "Login com Google cancelado.",
          invalid_state: "Erro de segurança. Tente novamente.",
          token_failed: "Erro ao autenticar com Google. Tente novamente.",
          server_error: "Erro interno. Tente novamente.",
          inactive: "Conta desativada.",
        };
        setGoogleError(messages[err] || "Erro ao fazer login com Google.");
      }
      if (bonus === "success") {
        setBonusBanner("success");
        fetch("/api/stripe/sync-subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }).finally(() => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          }, 500);
        });
        setTimeout(() => setBonusBanner(null), 8000);
      } else if (bonus === "cancel") {
        setBonusBanner("cancel");
        setTimeout(() => setBonusBanner(null), 5000);
      }
      if (checkout === "success") {
        setBonusBanner("checkout-success");
        fetch("/api/stripe/sync-subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }).finally(() => {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          }, 500);
        });
        setTimeout(() => setBonusBanner(null), 8000);
      }
      if (fromPwa && !googleNewUser) {
        setPwaReturnBanner(true);
        setTimeout(() => setPwaReturnBanner(false), 6000);
      }
      refetch();
    }
  }, [refetch]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refetch]);

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
    if (user && user.trialEndsAt && user.role !== "admin") {
      const seenKey = `casa-welcome-seen-${user.id}`;
      if (!localStorage.getItem(seenKey)) {
        const timer = setTimeout(() => setShowWelcomeModal(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id, user?.trialEndsAt]);

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
        initialError={googleError}
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
          setLocation("/");
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
      {bonusBanner && (
        <div className={`fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 shadow-xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
          bonusBanner === "success" || bonusBanner === "checkout-success"
            ? "bg-green-500/10 border-green-400/30"
            : "bg-muted border-border"
        }`} data-testid="bonus-result-banner">
          <span className="text-xl">{bonusBanner === "success" || bonusBanner === "checkout-success" ? "🎉" : "😕"}</span>
          <div>
            <p className={`text-sm font-semibold ${bonusBanner === "success" || bonusBanner === "checkout-success" ? "text-green-700 dark:text-green-400" : "text-foreground"}`}>
              {bonusBanner === "checkout-success"
                ? "Assinatura ativada com sucesso!"
                : bonusBanner === "success"
                  ? "+16 dias a ser ativados!"
                  : "Adição de cartão cancelada"}
            </p>
            <p className="text-xs text-muted-foreground">
              {bonusBanner === "checkout-success"
                ? "Bem-vindo ao Premium da Casa dos 20."
                : bonusBanner === "success"
                  ? "Seu trial de 30 dias será ativado em instantes."
                  : "Você pode tentar novamente quando quiser."}
            </p>
          </div>
        </div>
      )}
      {pwaReturnBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 shadow-xl border bg-green-500/10 border-green-400/30 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300" data-testid="pwa-return-banner">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Login com Google feito!</p>
            <p className="text-xs text-muted-foreground">Volte ao app na tela inicial do iPhone.</p>
          </div>
        </div>
      )}
      {showWelcomeModal && user && (
        <WelcomeTrialModal
          userId={user.id}
          trialEndsAt={user.trialEndsAt}
          trialBonusClaimed={user.trialBonusClaimed}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}
    </MobileLayout>
  );
}

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return (
    /FBAN|FBAV/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /musical_ly|Bytedance|TikTok/i.test(ua) ||
    /Twitter/i.test(ua) ||
    /Snapchat/i.test(ua) ||
    /LinkedIn/i.test(ua) ||
    /Pinterest/i.test(ua)
  );
}

function App() {
  const [inAppBrowser] = useState(isInAppBrowser);

  if (inAppBrowser) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="casa-dos-20-theme" attribute="class" enableSystem disableTransitionOnChange={false}>
        <OpenInBrowser />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="casa-dos-20-theme" attribute="class" enableSystem disableTransitionOnChange={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              <Route path="/shared/:slug" component={SharedEntry} />
              <Route path="/reset-password" component={ResetPassword} />
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

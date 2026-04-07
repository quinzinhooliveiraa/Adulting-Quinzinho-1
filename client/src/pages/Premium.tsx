import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft, Crown, Check, Sparkles, PenLine, Map,
  Ticket, ChevronDown, ChevronUp, Infinity, XCircle,
  Timer, Loader2, ShieldCheck
} from "lucide-react";
import { useLocation } from "wouter";
import SubscriptionCheckoutModal from "@/components/SubscriptionCheckoutModal";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { SubscriptionPlan } from "@shared/schema";

function useCountdown(validUntil: string | Date | null | undefined) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);

  useEffect(() => {
    if (!validUntil) return;
    const target = new Date(validUntil).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [validUntil]);

  return timeLeft;
}

function PlanCountdown({ validUntil }: { validUntil: string | Date | null | undefined }) {
  const t = useCountdown(validUntil);
  if (!t) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <Timer className="w-3 h-3 text-red-500 flex-shrink-0" />
      <span className="text-xs font-mono text-red-500 font-medium">
        {t.days > 0 ? `${t.days}d ` : ""}{String(t.hours).padStart(2,"0")}:{String(t.mins).padStart(2,"0")}:{String(t.secs).padStart(2,"0")}
      </span>
      <span className="text-xs text-muted-foreground">restantes</span>
    </div>
  );
}

function formatPrice(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  if (currency.toUpperCase() === "BRL") {
    return `R$${amount.toFixed(2).replace(".", ",")}`;
  }
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}

function getPlanStyle(plan: SubscriptionPlan) {
  if (plan.interval === "year") {
    return {
      border: "border-amber-500",
      bg: "bg-amber-500/5",
      priceColor: "text-amber-600 dark:text-amber-400",
    };
  }
  if (plan.interval === "lifetime") {
    return {
      border: "border-violet-500",
      bg: "bg-violet-500/5",
      priceColor: "text-violet-600 dark:text-violet-400",
    };
  }
  return {
    border: "border-primary",
    bg: "bg-primary/5",
    priceColor: "text-primary",
  };
}

function getPlanIntervalLabel(plan: SubscriptionPlan): string {
  if (plan.interval === "month") return plan.intervalCount > 1 ? `/${plan.intervalCount} meses` : "/mês";
  if (plan.interval === "year") return plan.intervalCount > 1 ? `/${plan.intervalCount} anos` : "/ano";
  if (plan.interval === "lifetime") return "pagamento único";
  return "";
}

function getPlanSubtitle(plan: SubscriptionPlan): string {
  if (plan.interval === "month") return "Cancele quando quiser";
  if (plan.interval === "year") return "Melhor custo-benefício";
  if (plan.interval === "lifetime") return "Acesso para sempre";
  return "";
}

const DEFAULT_FEATURES = [
  { icon: Sparkles, text: "Todas as cartas de reflexão desbloqueadas" },
  { icon: Map, text: "Jornadas de 30 dias completas" },
  { icon: PenLine, text: "Diário ilimitado com todas as funcionalidades" },
];

export default function Premium() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [trialActivating, setTrialActivating] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{
    priceId: string;
    label: string;
    priceFormatted: string;
    interval: "month" | "year" | "lifetime";
    badge?: string;
  } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  // Handle return from 3DS redirect for lifetime purchases
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const piId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    if (!piId || redirectStatus !== "succeeded") return;

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    fetch("/api/stripe/confirm-lifetime", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: piId }),
    })
      .then(async (res) => {
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          toast({ title: "Acesso vitalício activado!", description: "Bem-vindo(a) ao Premium para sempre." });
        } else {
          const data = await res.json().catch(() => ({}));
          toast({ title: "Erro ao activar", description: data.message || "Contacta o suporte.", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Erro de ligação", description: "Contacta o suporte se o problema persistir.", variant: "destructive" });
      });
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponMsg({ text: data.message, ok: true });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setCouponCode("");
      } else {
        setCouponMsg({ text: data.message, ok: false });
      }
    } catch {
      setCouponMsg({ text: "Erro ao aplicar o cupom. Tente novamente.", ok: false });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleActivateTrial = async () => {
    if (trialActivating) return;
    setTrialActivating(true);
    try {
      const res = await apiRequest("POST", "/api/trial/activate");
      const data = await res.json();
      if (res.ok) {
        queryClient.setQueryData(["/api/auth/me"], (old: any) => ({
          ...old,
          hasPremium: data.hasPremium,
          premiumReason: data.premiumReason,
          trialEndsAt: data.trialEndsAt,
        }));
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        toast({ title: "Trial ativado!", description: "Você tem 14 dias grátis de acesso completo." });
      } else {
        toast({ title: "Erro", description: data.message || "Não foi possível ativar o trial.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de ligação", description: "Tenta novamente.", variant: "destructive" });
    } finally {
      setTrialActivating(false);
    }
  };

  const handleCheckout = (plan: SubscriptionPlan) => {
    if (!plan.stripePriceId) return;
    if (plan.interval !== "month" && plan.interval !== "year" && plan.interval !== "lifetime") return;
    setCheckoutPlan({
      priceId: plan.stripePriceId,
      label: plan.name,
      priceFormatted: formatPrice(plan.amountCents, plan.currency),
      interval: plan.interval as "month" | "year" | "lifetime",
      badge: plan.badge ?? undefined,
    });
  };

  const handleCheckoutSuccess = () => {
    setCheckoutPlan(null);
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Assinatura cancelada", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else {
        toast({ title: "Erro", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível cancelar. Tente novamente.", variant: "destructive" });
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const trialMsLeft = user?.trialEndsAt
    ? Math.max(0, new Date(user.trialEndsAt).getTime() - Date.now())
    : 0;
  const trialDaysLeft = Math.ceil(trialMsLeft / (1000 * 60 * 60 * 24));
  const trialHoursLeft = Math.ceil(trialMsLeft / (1000 * 60 * 60));

  // User never activated a trial and has no premium
  const canActivateTrial = !user?.hasPremium && !user?.trialEndsAt && user?.role !== "admin";
  const isOnTrial = user?.premiumReason === "trial" && trialDaysLeft > 0;
  const trialExpired = !!user?.trialEndsAt && trialDaysLeft <= 0 && !user?.hasPremium;

  const activePlans = plans.filter(p => p.isActive && p.stripePriceId);
  const hasActiveSubscription = !!(user?.stripeSubscriptionId && user?.hasPremium && user?.premiumReason !== "trial" && user?.premiumReason !== "admin");

  return (
    <div className="min-h-screen pb-24 animate-in fade-in duration-500" data-testid="page-premium">
      {checkoutPlan && (
        <SubscriptionCheckoutModal
          plan={checkoutPlan}
          onSuccess={handleCheckoutSuccess}
          onClose={() => setCheckoutPlan(null)}
        />
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Vais continuar a ter acesso Premium até ao fim do período já pago. Após essa data, o acesso será removido automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="btn-confirm-cancel-subscription"
            >
              {cancelling ? "Cancelando..." : "Sim, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2" data-testid="text-premium-title">
            Casa dos 20 Premium
          </h1>
          <p className="text-muted-foreground text-sm">
            Desbloqueie todo o conteúdo e transforme sua jornada de autoconhecimento.
          </p>
        </div>

        {/* Trial never activated — main CTA */}
        {canActivateTrial && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6" data-testid="section-trial-activate">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">14 dias grátis</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Explore tudo sem cartão de crédito. Cancele quando quiser.
                </p>
              </div>
            </div>
            <div className="space-y-1.5 mb-4">
              {[
                "Todas as cartas de reflexão ilimitadas",
                "Jornadas de 30 dias completas",
                "Diário com fotos, desenhos e banners",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={handleActivateTrial}
              disabled={trialActivating}
              className="w-full h-12 rounded-xl text-sm font-semibold"
              data-testid="button-activate-trial"
            >
              {trialActivating
                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                : <Sparkles className="w-4 h-4 mr-2" />
              }
              Ativar 14 dias grátis
            </Button>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <ShieldCheck className="w-3 h-3 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">Sem cartão · Sem compromisso · Cancele a qualquer momento</p>
            </div>
          </div>
        )}

        {/* Trial active */}
        {isOnTrial && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-center" data-testid="trial-active-banner">
            <p className="text-amber-700 dark:text-amber-400 font-semibold text-base">
              {trialHoursLeft <= 24
                ? `${trialHoursLeft}h restantes de trial gratuito`
                : `${trialDaysLeft} ${trialDaysLeft === 1 ? "dia restante" : "dias restantes"} de trial gratuito`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Aproveita para explorar tudo, sem cartão, sem compromisso.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Depois do trial, escolhe um plano para continuar.
            </p>
          </div>
        )}

        {/* Trial expired */}
        {trialExpired && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 text-center" data-testid="trial-expired-banner">
            <p className="text-destructive font-semibold">Seu trial expirou</p>
            <p className="text-sm text-muted-foreground mt-1">
              Escolha um plano abaixo para continuar com acesso completo.
            </p>
          </div>
        )}

        {/* Already paid premium */}
        {user?.hasPremium && user?.premiumReason !== "trial" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 text-center" data-testid="premium-active-banner">
            <p className="text-green-600 dark:text-green-400 font-semibold">Você já tem o Premium ativo!</p>
            <p className="text-sm text-muted-foreground mt-1">Obrigado pelo apoio à Casa dos 20.</p>
            {user?.premiumUntil && (
              <p className="text-xs text-muted-foreground mt-1">
                Acesso até {new Date(user.premiumUntil).toLocaleDateString("pt-BR")}
              </p>
            )}
            {hasActiveSubscription && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-muted-foreground text-xs gap-1"
                onClick={() => setShowCancelDialog(true)}
                data-testid="btn-cancel-subscription"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancelar assinatura
              </Button>
            )}
          </div>
        )}

        {/* Feature highlights */}
        <div className="space-y-3 mb-8">
          {DEFAULT_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border" data-testid={`feature-${i}`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-sm">{f.text}</span>
              <Check className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Subscription plans */}
        <div className="space-y-4">
          {plansLoading && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="w-full h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {activePlans.map(plan => {
            const style = getPlanStyle(plan);
            const intervalLabel = getPlanIntervalLabel(plan);
            const subtitle = getPlanSubtitle(plan);
            const priceFormatted = formatPrice(plan.amountCents, plan.currency);
            const isLifetime = plan.interval === "lifetime";

            return (
              <button
                key={plan.id}
                onClick={() => handleCheckout(plan)}
                className={`w-full p-4 rounded-xl border-2 ${style.border} ${style.bg} hover:opacity-90 transition-opacity text-left relative overflow-hidden`}
                data-testid={`button-checkout-${plan.interval}-${plan.id}`}
              >
                {plan.badge && (
                  <div className={`absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-lg ${plan.interval === "year" ? "bg-amber-500" : plan.interval === "lifetime" ? "bg-violet-500" : "bg-primary"}`}>
                    {plan.badge.toUpperCase()}
                  </div>
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isLifetime && <Infinity className="w-4 h-4 text-violet-500 flex-shrink-0" />}
                      <p className="font-bold text-lg">{plan.name}</p>
                    </div>
                    <p className="text-muted-foreground text-sm">{subtitle}</p>
                    {plan.validUntil && <PlanCountdown validUntil={plan.validUntil} />}
                    {plan.features && plan.features.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {plan.features.map((feat, fi) => (
                          <li key={fi} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-bold ${style.priceColor}`}>{priceFormatted}</p>
                    <p className="text-xs text-muted-foreground">{intervalLabel}</p>
                    {plan.interval === "year" && (
                      <p className="text-xs text-muted-foreground">
                        (~{formatPrice(Math.round(plan.amountCents / 12), plan.currency)}/mês)
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {!plansLoading && activePlans.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              Nenhum plano disponível no momento.
            </p>
          )}
        </div>

        {/* Coupon */}
        <div className="mt-6 border border-border rounded-xl overflow-hidden" data-testid="section-coupon">
          <button
            onClick={() => { setCouponOpen(!couponOpen); setCouponMsg(null); }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-toggle-coupon"
          >
            <div className="flex items-center gap-2">
              <Ticket size={16} />
              Você tem um cupom de desconto?
            </div>
            {couponOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {couponOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && applyCoupon()}
                  placeholder="Código do cupom"
                  className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                  data-testid="input-coupon-code-user"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium disabled:opacity-50"
                  data-testid="btn-apply-coupon"
                >
                  {couponLoading ? "..." : "Aplicar"}
                </button>
              </div>
              {couponMsg && (
                <p className={`text-sm text-center font-medium ${couponMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-500"}`} data-testid="coupon-message">
                  {couponMsg.text}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4" data-testid="text-disclaimer">
          Pagamento seguro via Stripe. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}

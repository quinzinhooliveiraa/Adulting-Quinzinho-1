import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, Check, Sparkles, PenLine, Map } from "lucide-react";
import { useLocation } from "wouter";

export default function Premium() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/stripe/products"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/products");
      return res.json();
    },
  });

  const monthlyPrice = products.find((p: any) => p.recurring?.interval === "month");
  const yearlyPrice = products.find((p: any) => p.recurring?.interval === "year");

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
    } finally {
      setLoading(null);
    }
  };

  const features = [
    { icon: Sparkles, text: "Todas as cartas de reflexão desbloqueadas" },
    { icon: Map, text: "Jornadas de 30 dias completas" },
    { icon: PenLine, text: "Diário ilimitado com todas as funcionalidades" },
  ];

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen pb-24 animate-in fade-in duration-500" data-testid="page-premium">
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
          <p className="text-muted-foreground">
            Desbloqueie todo o conteúdo e transforme sua jornada de autoconhecimento.
          </p>
        </div>

        {user?.premiumReason === "trial" && trialDaysLeft > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-center" data-testid="trial-banner">
            <p className="text-amber-600 dark:text-amber-400 font-medium">
              Seu período de teste expira em {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Assine agora para não perder acesso
            </p>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border" data-testid={`feature-${i}`}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">{f.text}</span>
              <Check className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {monthlyPrice && (
            <button
              onClick={() => handleCheckout(monthlyPrice.price_id)}
              disabled={!!loading}
              className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              data-testid="button-checkout-monthly"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">Mensal</p>
                  <p className="text-muted-foreground text-sm">Cancele quando quiser</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">R$9,90</p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </div>
              {loading === monthlyPrice.price_id && (
                <p className="text-sm text-center mt-2 text-muted-foreground animate-pulse">Redirecionando...</p>
              )}
            </button>
          )}

          {yearlyPrice && (
            <button
              onClick={() => handleCheckout(yearlyPrice.price_id)}
              disabled={!!loading}
              className="w-full p-4 rounded-xl border-2 border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left relative overflow-hidden"
              data-testid="button-checkout-yearly"
            >
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                ECONOMIZE 33%
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">Anual</p>
                  <p className="text-muted-foreground text-sm">Melhor custo-benefício</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">R$79,90</p>
                  <p className="text-xs text-muted-foreground">/ano (~R$6,66/mês)</p>
                </div>
              </div>
              {loading === yearlyPrice.price_id && (
                <p className="text-sm text-center mt-2 text-muted-foreground animate-pulse">Redirecionando...</p>
              )}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6" data-testid="text-disclaimer">
          Pagamento seguro via Stripe. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}
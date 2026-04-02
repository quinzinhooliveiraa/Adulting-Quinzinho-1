import { useState, useEffect } from "react";
import { X, Crown, Lock, CheckCircle2, ShieldCheck, Infinity } from "lucide-react";
import { getStripePromise } from "@/lib/stripeLoader";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";

interface Plan {
  priceId: string;
  label: string;
  priceFormatted: string;
  interval: "month" | "year" | "lifetime";
  badge?: string;
}

interface Props {
  plan: Plan;
  onSuccess: () => void;
  onClose: () => void;
}

function PaymentForm({
  plan,
  subscriptionId,
  paymentIntentId,
  onSuccess,
  onClose,
}: Props & { subscriptionId: string; paymentIntentId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  const isLifetime = plan.interval === "lifetime";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      });

      if (stripeError) {
        setError(stripeError.message || "Erro no pagamento. Verifica os dados.");
        setLoading(false);
        return;
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
        const confirmEndpoint = isLifetime
          ? "/api/stripe/confirm-lifetime"
          : "/api/stripe/confirm-subscription";
        const confirmBody = isLifetime
          ? { paymentIntentId }
          : { subscriptionId };

        const confirmRes = await fetch(confirmEndpoint, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(confirmBody),
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) {
          setError(confirmData.message || "Erro ao activar o acesso. Contacta o suporte.");
          setLoading(false);
          return;
        }
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setTimeout(() => onSuccess(), 2000);
      } else {
        setError("Pagamento não confirmado. Tenta novamente.");
        setLoading(false);
      }
    } catch {
      setError("Erro de ligação. Tenta novamente.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="px-6 py-10 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-xl font-bold font-serif text-foreground">
          {isLifetime ? "Acesso Vitalício activado!" : "Premium activado!"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isLifetime
            ? "Tens agora acesso permanente a todo o conteúdo da Casa dos 20."
            : "Bem-vindo ao Casa dos 20 Premium. Todo o conteúdo está agora desbloqueado."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-6 pt-7 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            {isLifetime ? <Infinity size={20} className="text-violet-500" /> : <Crown size={20} className="text-amber-500" />}
          </div>
          <div>
            <h2 className="text-lg font-bold font-serif text-foreground leading-tight">
              Casa dos 20 Premium
            </h2>
            <p className="text-xs text-muted-foreground">
              {isLifetime ? `Plano ${plan.label} · pagamento único` : `Plano ${plan.label} · renovação automática`}
            </p>
          </div>
        </div>

        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 mb-5 flex items-center justify-between">
          <div>
            <span className="text-sm text-foreground font-medium block">{plan.label}</span>
            <span className="text-[11px] text-muted-foreground">
              {isLifetime
                ? "acesso permanente — paga uma vez, usa sempre"
                : plan.interval === "month"
                  ? "cobrado mensalmente"
                  : "cobrado anualmente"}
            </span>
          </div>
          <span className="text-base font-bold text-amber-600 dark:text-amber-400">
            {plan.priceFormatted}
            {!isLifetime && (
              <span className="text-xs font-normal text-muted-foreground">
                /{plan.interval === "month" ? "mês" : "ano"}
              </span>
            )}
          </span>
        </div>

        <div className="mb-4">
          <PaymentElement
            onReady={() => setReady(true)}
            options={{
              layout: "tabs",
              paymentMethodOrder: ["apple_pay", "google_pay", "card"],
              wallets: { applePay: "auto", googlePay: "auto" },
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 mb-4">
          <Lock size={11} className="text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Protegido pelo Stripe · os teus dados nunca passam pelos nossos servidores
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} className="text-green-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-green-700 dark:text-green-400 leading-relaxed">
              {isLifetime
                ? "Pagamento único · acesso vitalício · sem renovações · sem surpresas"
                : "Cancela quando quiseres · sem compromisso · conteúdo ilimitado durante a subscrição"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-2 space-y-2">
        {error && <p className="text-xs text-red-500 text-center py-1">{error}</p>}
        <button
          type="submit"
          disabled={loading || !stripe || !ready}
          data-testid="btn-confirm-subscription-purchase"
          className="w-full py-3.5 rounded-2xl bg-amber-500 text-white font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {loading
            ? "A processar..."
            : isLifetime
              ? `Pagar ${plan.priceFormatted} — acesso vitalício`
              : `Subscrever por ${plan.priceFormatted}/${plan.interval === "month" ? "mês" : "ano"}`}
        </button>
        <button
          type="button"
          onClick={onClose}
          data-testid="btn-cancel-subscription-purchase"
          className="w-full py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function SubscriptionCheckoutModal({ plan, onSuccess, onClose }: Props) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof getStripePromise> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loadError, setLoadError] = useState("");

  const isLifetime = plan.interval === "lifetime";

  useEffect(() => {
    const endpoint = isLifetime
      ? "/api/stripe/create-lifetime-intent"
      : "/api/stripe/create-subscription-intent";

    const intentFetch = fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: plan.priceId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.clientSecret) throw new Error(d.message || "Erro ao iniciar pagamento.");
        return d;
      });

    Promise.all([getStripePromise(), intentFetch])
      .then(([stripeInst, intentData]) => {
        setStripePromise(Promise.resolve(stripeInst));
        setClientSecret(intentData.clientSecret);
        if (intentData.subscriptionId) setSubscriptionId(intentData.subscriptionId);
        if (intentData.paymentIntentId) setPaymentIntentId(intentData.paymentIntentId);
      })
      .catch((err) => setLoadError(err.message || "Erro de ligação."));
  }, [plan.priceId, isLifetime]);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-card sm:rounded-3xl rounded-t-3xl border border-border w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/70 text-muted-foreground transition-colors z-10"
          data-testid="btn-close-subscription-modal"
        >
          <X size={18} />
        </button>

        {loadError ? (
          <div className="px-6 py-10 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-red-500 font-medium">{loadError}</p>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              Verifica a tua ligação à internet. Se usas um bloqueador de anúncios, tenta desactivá-lo para este site.
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => {
                  setLoadError("");
                  // Re-trigger the effect by remounting — force by clearing clientSecret
                  setClientSecret("");
                  setStripePromise(null);
                  const endpoint = isLifetime ? "/api/stripe/create-lifetime-intent" : "/api/stripe/create-subscription-intent";
                  Promise.all([getStripePromise(), fetch(endpoint, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId: plan.priceId }) }).then(r => r.json())])
                    .then(([stripeInst, d]) => {
                      if (!d.clientSecret) throw new Error(d.message || "Erro ao iniciar pagamento.");
                      setStripePromise(Promise.resolve(stripeInst));
                      setClientSecret(d.clientSecret);
                      if (d.subscriptionId) setSubscriptionId(d.subscriptionId);
                      if (d.paymentIntentId) setPaymentIntentId(d.paymentIntentId);
                    })
                    .catch(err => setLoadError(err.message || "Erro de ligação."));
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Tentar novamente
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-xl">
                Fechar
              </button>
            </div>
          </div>
        ) : !clientSecret || !stripePromise ? (
          <div className="px-6 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <Crown size={20} className="text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">A preparar pagamento seguro...</p>
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: isDark ? "night" : "stripe",
                variables: { borderRadius: "12px", fontSizeBase: "15px" },
              },
            }}
          >
            <PaymentForm
              plan={plan}
              subscriptionId={subscriptionId}
              paymentIntentId={paymentIntentId}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

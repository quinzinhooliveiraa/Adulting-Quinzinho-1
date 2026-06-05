import { useState, useEffect } from "react";
import { X, Crown, CheckCircle2, Infinity } from "lucide-react";
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
  onSuccess,
  onClose,
}: Props & { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
        const confirmRes = await fetch("/api/stripe/confirm-subscription", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) {
          setError(confirmData.message || "Erro ao ativar o acesso. Contacta o suporte.");
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
        <h2 className="text-xl font-bold font-serif text-foreground">Premium ativado!</h2>
        <p className="text-sm text-muted-foreground">
          Bem-vindo ao Casa dos 20 Premium. Todo o conteúdo está agora desbloqueado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col px-6 pt-5 pb-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
          <Crown size={20} className="text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{plan.label}</p>
          <p className="text-xs text-muted-foreground">{plan.priceFormatted}</p>
        </div>
      </div>

      <PaymentElement options={{ layout: "tabs" }} />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-2xl text-sm transition-colors"
      >
        {loading ? "A processar..." : "Confirmar pagamento"}
      </button>

      <button
        type="button"
        onClick={onClose}
        className="text-xs text-muted-foreground text-center"
      >
        Cancelar
      </button>
    </form>
  );
}

function redirectToCheckout(priceId: string) {
  fetch("/api/stripe/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  })
    .then((r) => r.json())
    .then((d) => { if (d.url) window.location.href = d.url; })
    .catch(() => {});
}

export default function SubscriptionCheckoutModal({ plan, onSuccess, onClose }: Props) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof getStripePromise> | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  useEffect(() => {
    const controller = new AbortController();

    // After 6s without the embedded form loading, fall back to redirect checkout
    const fallbackTimeout = setTimeout(() => {
      controller.abort();
      setRedirecting(true);
      redirectToCheckout(plan.priceId);
    }, 6000);

    const intentFetch = fetch("/api/stripe/create-subscription-intent", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: plan.priceId }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.clientSecret) throw new Error(d.message || "Erro ao iniciar pagamento.");
        return d;
      });

    Promise.all([getStripePromise(), intentFetch])
      .then(([stripeInst, intentData]) => {
        clearTimeout(fallbackTimeout);
        setStripePromise(Promise.resolve(stripeInst));
        setClientSecret(intentData.clientSecret);
        if (intentData.subscriptionId) setSubscriptionId(intentData.subscriptionId);
      })
      .catch((err: any) => {
        clearTimeout(fallbackTimeout);
        if (err?.name === "AbortError") return; // fallback already triggered
        // Any other error → also fall back to redirect
        setRedirecting(true);
        redirectToCheckout(plan.priceId);
      });

    return () => {
      clearTimeout(fallbackTimeout);
      controller.abort();
    };
  }, [plan.priceId]);

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

        {!clientSecret || !stripePromise ? (
          <div className="px-6 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              {plan.interval === "lifetime"
                ? <Infinity size={20} className="text-violet-500" />
                : <Crown size={20} className="text-amber-500" />}
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              {redirecting ? "A abrir página de pagamento..." : "A preparar pagamento seguro..."}
            </p>
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
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}

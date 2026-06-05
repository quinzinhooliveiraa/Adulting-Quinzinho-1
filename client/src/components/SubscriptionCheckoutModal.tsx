import { useState, useEffect } from "react";
import { X, Crown, Infinity } from "lucide-react";

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

export default function SubscriptionCheckoutModal({ plan, onClose }: Props) {
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    fetch("/api/stripe/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: plan.priceId }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        clearTimeout(timeout);
        if (d.url) {
          window.location.href = d.url;
        } else {
          setError(d.message || "Não foi possível iniciar o pagamento.");
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          setError("Tempo esgotado. Verifica a tua ligação e tenta novamente.");
        } else {
          setError(err.message || "Erro de ligação. Tenta novamente.");
        }
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [plan.priceId]);

  const isLifetime = plan.interval === "lifetime";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-card sm:rounded-3xl rounded-t-3xl border border-border w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/70 text-muted-foreground transition-colors z-10"
          data-testid="btn-close-subscription-modal"
        >
          <X size={18} />
        </button>

        <div className="px-6 py-10 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            {isLifetime
              ? <Infinity size={22} className="text-violet-500" />
              : <Crown size={22} className="text-amber-500" />}
          </div>

          {error ? (
            <>
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <p className="text-xs text-muted-foreground max-w-[260px]">
                Se usas um bloqueador de anúncios, tenta desativá-lo para este site e recarrega a página.
              </p>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => { setError(""); window.location.reload(); }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground animate-pulse">
                A preparar pagamento seguro...
              </p>
              <p className="text-xs text-muted-foreground/60">
                Serás redirecionado para a página de pagamento da Stripe.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

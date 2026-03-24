import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";

interface WelcomeTrialModalProps {
  userId: string;
  trialEndsAt: string | null;
  trialBonusClaimed: boolean;
  onClose: () => void;
}

export default function WelcomeTrialModal({ userId, trialBonusClaimed, onClose }: WelcomeTrialModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClaimWithCard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/setup-for-bonus", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || "Erro ao iniciar processo. Tenta novamente.");
        setLoading(false);
      }
    } catch {
      setError("Erro de ligação. Tenta novamente.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem(`casa-welcome-seen-${userId}`, "1");
    onClose();
  };

  if (trialBonusClaimed) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={handleClose}
    >
      <div
        className="relative bg-card rounded-t-3xl border border-border w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/70 text-muted-foreground transition-colors z-10"
          data-testid="btn-close-welcome-modal"
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-7 pb-2">
          <p className="text-3xl mb-3">🎁</p>
          <h2 className="text-xl font-bold font-serif text-foreground mb-1">
            Ganha mais 16 dias grátis
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ativa agora e fica com <strong className="text-foreground">30 dias grátis</strong> no total — sem pagar nada.
          </p>
        </div>

        <div className="px-6 pb-2 pt-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} className="text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Sem custos durante os 30 dias. Só pagas se quiseres continuar depois.</p>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            onClick={handleClaimWithCard}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-foreground text-background font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
            data-testid="btn-claim-bonus"
          >
            <span className="text-lg">🎁</span>
            {loading ? "A ativar..." : "Ganhar 30 dias grátis"}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-close-later"
          >
            Ficar só com os 14 dias
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { X, CreditCard, ShieldCheck } from "lucide-react";

interface WelcomeTrialModalProps {
  userId: string;
  trialEndsAt: string | null;
  trialBonusClaimed: boolean;
  onClose: () => void;
}

export default function WelcomeTrialModal({ userId, trialEndsAt, trialBonusClaimed, onClose }: WelcomeTrialModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-card rounded-3xl border border-border w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="px-6 pt-7 pb-2">
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground"
            data-testid="btn-close-welcome-modal"
          >
            <X size={18} />
          </button>

          <p className="text-3xl mb-3">🎁</p>
          <h2 className="text-xl font-bold font-serif text-foreground mb-1">
            Queres 30 dias grátis?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adiciona o teu cartão agora e ganha <strong className="text-foreground">+16 dias extras</strong> — sem qualquer custo durante o trial.
          </p>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldCheck size={14} className="text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">Só pagas quando o trial acabar, se quiseres continuar. Cancela a qualquer momento.</p>
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
            <CreditCard size={18} />
            {loading ? "A redirecionar..." : "Adicionar cartão e ganhar +16 dias"}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-close-later"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}

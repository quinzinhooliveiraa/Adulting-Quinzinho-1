import { useState } from "react";
import { Gift, X, CreditCard, Star, ShieldCheck } from "lucide-react";

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-card rounded-3xl border border-border w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gradient-to-br from-amber-400/20 to-primary/20 px-6 pt-8 pb-5 text-center">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground"
            data-testid="btn-close-welcome-modal"
          >
            <X size={18} />
          </button>

          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold font-serif text-foreground mb-1">
            Parabéns! 🎉
          </h2>
          <p className="text-muted-foreground text-sm">
            Recebeste <strong className="text-foreground">14 dias grátis</strong> de acesso à Casa dos 20.
          </p>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-3">
          {!trialBonusClaimed ? (
            <>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1 text-center">
                  🎁 Queres 30 dias grátis?
                </p>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Adiciona o teu cartão agora e ganha <strong className="text-foreground">+16 dias extras</strong>. Só pagas quando o trial acabar — se quiseres continuar.
                </p>
              </div>

              <div className="flex items-start gap-2 px-1">
                <ShieldCheck size={14} className="text-green-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Sem cobranças durante o trial. Cancela a qualquer momento.</p>
              </div>

              {error && (
                <p className="text-xs text-red-500 text-center px-2">{error}</p>
              )}

              <button
                onClick={handleClaimWithCard}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-base shadow-md active:scale-[0.98] transition-transform disabled:opacity-70 flex items-center justify-center gap-2"
                data-testid="btn-claim-bonus"
              >
                <CreditCard size={18} />
                {loading ? "A redirecionar..." : "Adicionar cartão e ganhar +16 dias"}
              </button>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="btn-close-later"
              >
                Só com os 14 dias, obrigado
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center py-2">
                <Star size={12} className="text-amber-500" />
                <span>30 dias de acesso completo ativos</span>
                <Star size={12} className="text-amber-500" />
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-2xl bg-foreground text-background font-semibold text-base"
                data-testid="btn-start-exploring"
              >
                Começar a explorar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

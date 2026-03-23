import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { Gift, X, Sparkles, Star } from "lucide-react";

interface WelcomeTrialModalProps {
  userId: string;
  trialEndsAt: string | null;
  trialBonusClaimed: boolean;
  onClose: () => void;
}

export default function WelcomeTrialModal({ userId, trialEndsAt, trialBonusClaimed, onClose }: WelcomeTrialModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch("/api/auth/claim-trial-bonus", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setClaimed(true);
        setClaimMsg(data.message);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else {
        setClaimMsg(data.message || "Erro ao resgatar bónus.");
      }
    } catch {
      setClaimMsg("Erro ao resgatar. Tenta novamente.");
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem(`casa-welcome-seen-${userId}`, "1");
    onClose();
  };

  const totalDays = claimed ? 30 : 14;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-card rounded-3xl border border-border w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gradient-to-br from-amber-400/20 to-primary/20 px-6 pt-8 pb-6 text-center">
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

          {claimed ? (
            <>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-2">
                🎉 Incrível!
              </h2>
              <p className="text-muted-foreground text-sm">
                Recebeste <strong className="text-foreground">30 dias gratuitos</strong> de acesso premium completo.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-2">
                Parabéns! 🎉
              </h2>
              <p className="text-muted-foreground text-sm">
                Recebeste <strong className="text-foreground">14 dias gratuitos</strong> de acesso à Casa dos 20.
              </p>
            </>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 space-y-3">
          {!trialBonusClaimed && !claimed ? (
            <>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles size={16} className="text-amber-500" />
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Oferta especial de boas-vindas</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clica abaixo para receberes mais <strong>+16 dias grátis</strong> — total de 30 dias sem cartão!
                </p>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-base shadow-md active:scale-[0.98] transition-transform disabled:opacity-70"
                data-testid="btn-claim-bonus"
              >
                {claiming ? "A ativar..." : "✨ Resgatar +16 dias grátis"}
              </button>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-2xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="btn-close-later"
              >
                Depois
              </button>
            </>
          ) : (
            <>
              {claimMsg && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 text-center">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">{claimMsg}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Star size={12} className="text-amber-500" />
                <span>Acesso completo por 30 dias — sem cartão</span>
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

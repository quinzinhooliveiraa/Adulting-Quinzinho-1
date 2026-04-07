import { Lock, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onActivate: () => void;
  onDismiss: () => void;
  isActivating: boolean;
  context?: "limit" | "depth";
  nextQuestion?: string;
  cardsAnswered?: number;
}

export default function TrialActivationModal({
  open,
  onActivate,
  onDismiss,
  isActivating,
  context = "depth",
  nextQuestion,
  cardsAnswered = 0,
}: Props) {
  if (!open) return null;

  const isLimit = context === "limit";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-background/85 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onDismiss}
        data-testid="modal-backdrop-trial"
      />

      <div className="relative w-full max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-400 overflow-hidden">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover-elevate"
          data-testid="button-dismiss-trial"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-8 pb-7 flex flex-col gap-5">

          {/* Emotional headline */}
          {isLimit ? (
            <div className="space-y-1.5 pr-6">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">
                você e suas perguntas
              </p>
              <h2 className="text-xl font-serif text-foreground leading-snug">
                você começou a tocar em coisas que normalmente evita
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                as próximas perguntas vão mais fundo nisso
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 pr-6">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">
                você está indo mais fundo
              </p>
              <h2 className="text-xl font-serif text-foreground leading-snug">
                continue se conhecendo de verdade
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                desbloqueie perguntas profundas, jornadas completas e reflexões ilimitadas
              </p>
            </div>
          )}

          {/* Next locked question teaser */}
          {isLimit && nextQuestion && (
            <div className="relative rounded-2xl border border-border overflow-hidden">
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  próxima pergunta
                </p>
              </div>
              <div className="px-4 pb-4 relative">
                <p className="text-sm font-serif text-foreground leading-relaxed blur-[3px] select-none pointer-events-none">
                  "{nextQuestion}"
                </p>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-card/60 backdrop-blur-[1px]">
                  <Lock size={14} className="text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    é aqui que as coisas ficam reais
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Psychological progression */}
          {isLimit && cardsAnswered > 0 && (
            <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                você respondeu {cardsAnswered} {cardsAnswered === 1 ? "pergunta" : "perguntas"}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                a maioria das pessoas para aqui. quem continua começa a ter clareza real.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <Button
              className="w-full text-base h-12"
              onClick={onActivate}
              disabled={isActivating}
              data-testid="button-activate-trial"
            >
              {isActivating
                ? <Loader2 className="h-5 w-5 animate-spin mr-2" />
                : <Sparkles className="h-5 w-5 mr-2" />
              }
              {isLimit
                ? "desbloqueia 14 dias grátis para continuar"
                : "ativar 14 dias grátis"}
            </Button>

            <button
              onClick={onDismiss}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              data-testid="button-skip-trial"
            >
              agora não
            </button>

            <p className="text-center text-[11px] text-muted-foreground opacity-60">
              sem cartão de crédito · cancele quando quiser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

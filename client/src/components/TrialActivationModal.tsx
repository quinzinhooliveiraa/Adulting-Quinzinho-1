import { Sparkles, X, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onActivate: () => void;
  onDismiss: () => void;
  isActivating: boolean;
  context?: "limit" | "depth"; // limit = hit free limit, depth = mid-session
}

export default function TrialActivationModal({ open, onActivate, onDismiss, isActivating, context = "depth" }: Props) {
  if (!open) return null;

  const isLimit = context === "limit";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onDismiss}
        data-testid="modal-backdrop-trial"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-400 overflow-hidden">

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover-elevate"
          data-testid="button-dismiss-trial"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-7 flex flex-col items-center text-center gap-4">

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-foreground leading-tight">
              {isLimit
                ? "Chegaste ao limite das cartas grátis"
                : "Estás a começar a aprofundar-te"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isLimit
                ? "Estas são apenas algumas das perguntas disponíveis. Desbloqueeia todas e vai mais fundo na tua jornada com 14 dias grátis."
                : "Para continuar a explorar perguntas mais profundas e evoluir na tua jornada, desbloqueia 14 dias grátis."}
            </p>
          </div>

          {/* Value bullets */}
          <div className="w-full rounded-xl bg-muted/50 px-4 py-3 space-y-2 text-left">
            {[
              "Todas as cartas e perguntas desbloqueadas",
              "Jornadas de crescimento completas",
              "Sem cartão de crédito necessário",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
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
            Ativar 14 dias grátis
          </Button>

          <button
            onClick={onDismiss}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            data-testid="button-skip-trial"
          >
            Agora não
          </button>

          <p className="text-[11px] text-muted-foreground opacity-60">
            Sem cartão de crédito · Cancela quando quiseres
          </p>
        </div>
      </div>
    </div>
  );
}

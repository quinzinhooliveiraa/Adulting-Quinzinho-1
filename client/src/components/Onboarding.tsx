import { useState, useEffect } from "react";
import {
  ArrowRight, Bell, Check,
  Map, BookOpen, PenLine, MessageCircle, Smile,
  BellRing, Crown, Loader2, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bookCover from "@/assets/images/book-cover-oficial.png";
import { subscribeToPush, isPushSupported } from "@/utils/pushNotifications";

type StepId = "welcome" | "checkin" | "journal" | "questions" | "journeys" | "book" | "notifications" | "premium";

const STEP_ORDER: StepId[] = ["welcome", "checkin", "journal", "questions", "journeys", "book", "notifications", "premium"];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [animDir, setAnimDir] = useState<"right" | "left">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const goTo = (newIndex: number) => {
    if (isAnimating || newIndex === stepIndex) return;
    setAnimDir(newIndex > stepIndex ? "right" : "left");
    setIsAnimating(true);
    setTimeout(() => {
      setStepIndex(newIndex);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  };

  const next = () => {
    if (stepIndex < STEP_ORDER.length - 1) {
      goTo(stepIndex + 1);
    }
  };

  const back = () => {
    if (stepIndex > 0) {
      goTo(stepIndex - 1);
    }
  };

  const currentStep = STEP_ORDER[stepIndex];

  const handleNotificationActivate = async () => {
    setNotifStatus("loading");
    try {
      const success = await subscribeToPush();
      setNotifStatus(success ? "granted" : "denied");
    } catch {
      setNotifStatus("denied");
    }
  };

  const animClass = isAnimating
    ? "opacity-0 scale-95"
    : "opacity-100 scale-100";

  return (
    <div className={`fixed inset-0 z-[100] bg-background flex flex-col overflow-y-auto transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-screen">
        <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ease-out ${animClass}`}>

          {currentStep === "welcome" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-40 h-56 rounded-r-xl rounded-l-sm shadow-2xl shadow-primary/20 overflow-hidden relative border-l-[6px] border-primary/30 transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
              </div>
              <div className="space-y-3 pt-4">
                <h1 className="text-3xl font-serif text-foreground leading-tight">
                  Bem-vindo à<br /><span className="text-primary">Casa dos 20</span>
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Um espaço de calma e autoconhecimento para quem está vivendo a transição dos 20 anos.
                </p>
                <p className="text-xs text-muted-foreground/70 italic px-4">
                  Baseado no livro de Quinzinho Oliveira
                </p>
              </div>
            </div>
          )}

          {currentStep === "checkin" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                  <Smile size={28} className="text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground">Como você está hoje?</p>
                <div className="flex justify-center gap-3">
                  {["😔", "😐", "🙂", "😊", "🤩"].map((emoji, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 ${i === 3 ? "bg-primary/10 scale-110 ring-2 ring-primary/30" : "bg-muted/50"}`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-amber-400 to-green-400 rounded-full" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-serif text-foreground">Check-in Diário</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Todo dia, registre como você está se sentindo. Com o tempo, você vai perceber padrões e se conhecer melhor.
                </p>
              </div>
            </div>
          )}

          {currentStep === "journal" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
                  <PenLine size={28} className="text-blue-500" />
                </div>
                <div className="text-left space-y-2">
                  <div className="h-2 bg-foreground/10 rounded-full w-4/5" />
                  <div className="h-2 bg-foreground/10 rounded-full w-full" />
                  <div className="h-2 bg-foreground/10 rounded-full w-3/5" />
                </div>
                <div className="flex gap-2 justify-center">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium">texto</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-500 font-medium">fotos</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">desenho</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-serif text-foreground">Diário Pessoal</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Escreva seus pensamentos livremente. Adicione fotos, desenhos e banners. Seu espaço privado de reflexão.
                </p>
              </div>
            </div>
          )}

          {currentStep === "questions" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] space-y-3">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-lg transform -rotate-2 transition-transform hover:rotate-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                    <MessageCircle size={20} className="text-purple-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground text-left">"O que você faria diferente se ninguém estivesse observando?"</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-md transform rotate-1 opacity-70 scale-95">
                  <p className="text-xs text-muted-foreground text-left">"Qual é o medo que mais te impede de agir?"</p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-serif text-foreground">Cartas de Reflexão</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Centenas de perguntas profundas para explorar sozinho ou em conversa com amigos. Deslize para descobrir novas cartas.
                </p>
              </div>
            </div>
          )}

          {currentStep === "journeys" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Map size={28} className="text-emerald-500" />
                </div>
                <div className="space-y-2">
                  {["Autoconhecimento", "Propósito", "Relações"].map((name, i) => (
                    <div
                      key={name}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${i === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {i === 0 ? <CheckCircle2 size={14} /> : `${i + 1}`}
                      </div>
                      <span className={`text-xs font-medium ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-serif text-foreground">Jornadas de 30 Dias</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Trilhe caminhos temáticos com exercícios diários. Cada dia é desbloqueado ao completar o anterior — um passo de cada vez.
                </p>
              </div>
            </div>
          )}

          {currentStep === "book" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                  <BookOpen size={28} className="text-amber-600" />
                </div>
                <div className="space-y-2">
                  {["A Solidão", "A Incerteza", "A Identidade"].map((ch, i) => (
                    <div key={ch} className="flex items-center gap-2 text-left">
                      <div className="w-1 h-6 rounded-full bg-primary/30" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{ch}</p>
                        <p className="text-[10px] text-muted-foreground">Capítulo {i + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-serif text-foreground">O Livro</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Leia trechos exclusivos de "A Casa dos 20" e aprofunde suas reflexões com os temas do livro.
                </p>
              </div>
            </div>
          )}

          {currentStep === "notifications" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] space-y-4">
                <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-700 ${
                  notifStatus === "granted" ? "bg-green-500/10" : notifStatus === "loading" ? "bg-blue-500/10 animate-pulse" : "bg-blue-500/10"
                }`}>
                  {notifStatus === "loading" ? (
                    <Loader2 size={36} className="text-blue-500 animate-spin" />
                  ) : notifStatus === "granted" ? (
                    <CheckCircle2 size={36} className="text-green-500" />
                  ) : (
                    <BellRing size={36} className="text-blue-500" />
                  )}
                </div>

                {notifStatus === "idle" && (
                  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Lembrete matinal</p>
                        <p className="text-[10px] text-muted-foreground">Check-in diário às 9h</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <PenLine size={16} className="text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Convite noturno</p>
                        <p className="text-[10px] text-muted-foreground">Reflexão no diário às 20h</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-serif text-foreground">
                  {notifStatus === "granted" ? "Notificações Ativadas!" : notifStatus === "denied" ? "Tudo bem!" : "Lembretes Diários"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  {notifStatus === "granted"
                    ? "Você receberá lembretes gentis para seus momentos de reflexão."
                    : notifStatus === "denied"
                    ? "Você pode ativar as notificações depois nas configurações do app."
                    : "Ative as notificações para receber convites diários à reflexão. Prometemos ser o momento mais calmo do seu dia."
                  }
                </p>
              </div>

              {notifStatus === "idle" && isPushSupported() && (
                <button
                  onClick={handleNotificationActivate}
                  className="w-full max-w-[280px] p-4 rounded-2xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  data-testid="button-activate-notifications"
                >
                  <Bell size={18} />
                  Ativar Notificações
                </button>
              )}

              {notifStatus === "loading" && (
                <div className="w-full max-w-[280px] p-4 rounded-2xl bg-blue-500/10 text-blue-500 font-medium text-sm flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Ativando...
                </div>
              )}
            </div>
          )}

          {currentStep === "premium" && (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown size={32} className="text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif text-foreground">Plano Premium</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Desbloqueie toda a experiência da Casa dos 20
                </p>
              </div>

              <div className="w-full max-w-[320px] space-y-3">
                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Gratuito (sempre)</p>
                  <div className="space-y-2">
                    {[
                      "Check-in diário de humor",
                      "5 cartas por tema de reflexão",
                      "Diário básico com texto",
                      "Trechos selecionados do livro"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-left">
                        <Check size={14} className="text-green-500 shrink-0" />
                        <span className="text-xs text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl border border-amber-500/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                      <Crown size={10} /> Premium
                    </p>
                    <p className="text-xs font-bold text-foreground">R$ 9,90<span className="text-muted-foreground font-normal">/mês</span></p>
                  </div>
                  <div className="space-y-2">
                    {[
                      "Tudo do plano gratuito",
                      "Todas as cartas de reflexão ilimitadas",
                      "Jornadas completas de 30 dias",
                      "Diário com fotos, desenhos e banners",
                      "Todos os capítulos do livro",
                      "Notificações personalizadas"
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-left">
                        <Check size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1 border-t border-amber-500/10">
                    <p className="text-[10px] text-amber-600/80 font-medium">14 dias grátis para experimentar</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-sm mt-8 space-y-4 px-2">
          <div className="flex justify-center gap-1.5">
            {STEP_ORDER.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-8 bg-primary" : i < stepIndex ? "w-2 bg-primary/40" : "w-2 bg-muted"}`}
                data-testid={`dot-step-${i}`}
              />
            ))}
          </div>

          {currentStep === "premium" ? (
            <div className="space-y-3">
              <Button
                onClick={onComplete}
                className="w-full h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                data-testid="button-onboarding-premium"
              >
                <Crown size={18} className="mr-2" />
                Começar Trial Grátis
              </Button>
              <button
                onClick={onComplete}
                className="w-full text-sm text-muted-foreground font-medium hover:text-foreground transition-colors py-2"
                data-testid="button-onboarding-skip-premium"
              >
                Continuar grátis por agora
              </button>
            </div>
          ) : (
            <Button
              onClick={next}
              className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-medium shadow-lg hover:shadow-xl active:scale-95 transition-all"
              data-testid="button-onboarding-next"
            >
              {currentStep === "notifications" && notifStatus === "idle" ? "Pular" : "Próximo"}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          )}

          {stepIndex > 0 && currentStep !== "premium" && (
            <button
              onClick={back}
              className="w-full text-xs text-muted-foreground font-medium hover:text-foreground transition-colors py-1"
              data-testid="button-onboarding-back"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

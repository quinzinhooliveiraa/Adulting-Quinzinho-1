import { useState, useEffect } from "react";
import {
  ArrowRight, ArrowLeft, Bell, Check,
  Map, BookOpen, PenLine, MessageCircle, Smile,
  BellRing, Crown, Loader2, CheckCircle2, Clock,
  CreditCard, ShieldCheck, Sparkles, FileText, Brain,
  Smartphone, Plus, Share
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bookCover from "@/assets/images/book-cover-oficial.png";
import { subscribeToPush, isPushSupported } from "@/utils/pushNotifications";

type StepId = "welcome" | "pwa" | "checkin" | "journal" | "questions" | "journeys" | "book" | "notifications" | "premium";

const STEP_ORDER: StepId[] = ["welcome", "pwa", "checkin", "journal", "questions", "journeys", "book", "notifications", "premium"];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"enter-right" | "enter-left" | "exit-left" | "exit-right" | "idle">("idle");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (isStandalone) setPwaInstalled(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const goTo = (newIndex: number) => {
    if (isAnimating || newIndex === stepIndex) return;
    const dir = newIndex > stepIndex ? "right" : "left";
    setIsAnimating(true);
    setSlideDirection(dir === "right" ? "exit-left" : "exit-right");

    setTimeout(() => {
      setStepIndex(newIndex);
      setSlideDirection(dir === "right" ? "enter-right" : "enter-left");
      setTimeout(() => {
        setSlideDirection("idle");
        setIsAnimating(false);
      }, 350);
    }, 250);
  };

  const next = () => {
    if (stepIndex < STEP_ORDER.length - 1) goTo(stepIndex + 1);
  };

  const back = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
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

  const [checkoutError, setCheckoutError] = useState("");

  const handleStartTrial = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const productsRes = await fetch("/api/stripe/products");
      const products = await productsRes.json();
      const monthlyPrice = products.find((p: any) => p.recurring?.interval === "month");

      if (!monthlyPrice?.price_id) {
        setCheckoutError("Planos ainda não disponíveis. Tente novamente mais tarde.");
        setCheckoutLoading(false);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          priceId: monthlyPrice.price_id,
          trialDays: 14,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Erro ao iniciar pagamento. Tente novamente.");
      }
    } catch {
      setCheckoutError("Erro de conexão. Tente novamente.");
    }
    setCheckoutLoading(false);
  };

  const slideClass =
    slideDirection === "exit-left" ? "translate-x-[-30px] opacity-0 scale-95" :
    slideDirection === "exit-right" ? "translate-x-[30px] opacity-0 scale-95" :
    slideDirection === "enter-right" ? "animate-slide-in-right" :
    slideDirection === "enter-left" ? "animate-slide-in-left" :
    "translate-x-0 opacity-100 scale-100";

  return (
    <div className={`fixed inset-0 z-[100] bg-background flex flex-col transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0 scale-105"}`}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.2); }
          50% { box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.15); }
        }
        @keyframes staggerFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-right { animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-slide-in-left { animation: slideInLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-float { animation: floatUp 4s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
        .stagger-1 { animation: staggerFade 0.5s ease-out 0.1s both; }
        .stagger-2 { animation: staggerFade 0.5s ease-out 0.2s both; }
        .stagger-3 { animation: staggerFade 0.5s ease-out 0.3s both; }
        .stagger-4 { animation: staggerFade 0.5s ease-out 0.4s both; }
        .stagger-5 { animation: staggerFade 0.5s ease-out 0.5s both; }
      `}</style>

      <div className="flex-1 flex flex-col items-center overflow-y-auto px-6 py-8">
        <div className={`w-full max-w-sm flex flex-col items-center transition-all duration-300 ease-out ${slideClass}`}>

          {currentStep === "welcome" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="animate-float">
                <div className="w-40 h-56 rounded-r-xl rounded-l-sm shadow-2xl shadow-primary/20 overflow-hidden relative border-l-[6px] border-primary/30 transform -rotate-2 hover:rotate-0 transition-transform duration-700 animate-pulse-glow">
                  <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3 pt-4">
                <h1 className="text-3xl font-serif text-foreground leading-tight stagger-1">
                  Bem-vindo à<br /><span className="text-primary">Casa dos 20</span>
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed px-2 stagger-2">
                  Um espaço de calma e autoconhecimento para quem está vivendo a transição dos 20 anos.
                </p>
                <p className="text-xs text-muted-foreground/70 italic px-4 stagger-3">
                  Baseado no livro de Quinzinho Oliveira
                </p>
              </div>
            </div>
          )}

          {currentStep === "pwa" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] space-y-4 stagger-1">
                <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-700 ${
                  pwaInstalled ? "bg-green-500/10 scale-110" : "bg-primary/10 animate-float"
                }`}>
                  {pwaInstalled ? (
                    <CheckCircle2 size={36} className="text-green-500" />
                  ) : (
                    <Smartphone size={36} className="text-primary" />
                  )}
                </div>

                {!pwaInstalled && (
                  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                    <div className="flex items-start gap-3 text-left stagger-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Share size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">No Safari / Chrome</p>
                        <p className="text-[10px] text-muted-foreground">Toque em "Compartilhar" ou no menu do navegador</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-left stagger-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Plus size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Adicionar à Tela Inicial</p>
                        <p className="text-[10px] text-muted-foreground">Para acessar como um app nativo</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">
                  {pwaInstalled ? "App Instalado!" : "Instale o App"}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  {pwaInstalled
                    ? "O app já está na sua tela inicial. Você terá a melhor experiência possível."
                    : "Adicione a Casa dos 20 à sua tela inicial para ter acesso rápido, notificações e uma experiência completa."
                  }
                </p>
              </div>

              {!pwaInstalled && deferredPrompt && (
                <button
                  onClick={async () => {
                    try {
                      await deferredPrompt.prompt();
                      const result = await deferredPrompt.userChoice;
                      if (result.outcome === "accepted") setPwaInstalled(true);
                      setDeferredPrompt(null);
                    } catch {}
                  }}
                  className="w-full max-w-[280px] p-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  data-testid="button-install-pwa"
                >
                  <Plus size={18} />
                  Instalar App
                </button>
              )}
            </div>
          )}

          {currentStep === "checkin" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4 stagger-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-float">
                  <Smile size={28} className="text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground">Como você está hoje?</p>
                <div className="flex justify-center gap-3">
                  {["😔", "😐", "🙂", "😊", "🤩"].map((emoji, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-700 ${i === 3 ? "bg-primary/10 scale-110 ring-2 ring-primary/30" : "bg-muted/50 hover:scale-110"}`}
                      style={{ animation: `staggerFade 0.5s ease-out ${0.2 + i * 0.1}s both` }}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-amber-400 to-green-400 rounded-full transition-all duration-1000" />
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Check-in Diário</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Todo dia, registre como você está se sentindo. Com o tempo, você vai perceber padrões e se conhecer melhor.
                </p>
              </div>
            </div>
          )}

          {currentStep === "journal" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4 stagger-1">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto animate-float">
                  <PenLine size={28} className="text-blue-500" />
                </div>
                <div className="text-left space-y-2">
                  {[4/5, 1, 3/5].map((w, i) => (
                    <div key={i} className="h-2 bg-foreground/10 rounded-full overflow-hidden" style={{ width: `${w * 100}%` }}>
                      <div className="h-full bg-blue-500/20 rounded-full" style={{ animation: `staggerFade 0.8s ease-out ${0.3 + i * 0.15}s both`, width: "0%", animationFillMode: "forwards" }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center">
                  {[{t: "texto", c: "blue"}, {t: "fotos", c: "purple"}, {t: "desenho", c: "green"}].map(({t, c}, i) => (
                    <span key={t} className={`text-[10px] px-2 py-1 rounded-full bg-${c}-500/10 text-${c}-500 font-medium`} style={{ animation: `staggerFade 0.4s ease-out ${0.5 + i * 0.1}s both` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Diário Pessoal</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Escreva seus pensamentos livremente. Adicione fotos, desenhos e banners. Seu espaço privado de reflexão.
                </p>
              </div>
            </div>
          )}

          {currentStep === "questions" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] space-y-3 stagger-1">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-500 animate-pulse-glow">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                    <MessageCircle size={20} className="text-purple-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground text-left">"O que você faria diferente se ninguém estivesse observando?"</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-md transform rotate-1 opacity-70 scale-95 stagger-3">
                  <p className="text-xs text-muted-foreground text-left">"Qual é o medo que mais te impede de agir?"</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Cartas de Reflexão</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Centenas de perguntas profundas para explorar sozinho ou em conversa com amigos. Deslize para descobrir novas cartas.
                </p>
              </div>
            </div>
          )}

          {currentStep === "journeys" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4 stagger-1">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto animate-float">
                  <Map size={28} className="text-emerald-500" />
                </div>
                <div className="space-y-2">
                  {["Autoconhecimento", "Propósito", "Relações"].map((name, i) => (
                    <div
                      key={name}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-300 ${i === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}
                      style={{ animation: `staggerFade 0.4s ease-out ${0.3 + i * 0.12}s both` }}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {i === 0 ? <CheckCircle2 size={14} /> : `${i + 1}`}
                      </div>
                      <span className={`text-xs font-medium ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>{name}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/15 text-left" style={{ animation: `staggerFade 0.4s ease-out 0.7s both` }}>
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Brain size={14} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">Relatório com IA</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">Ao completar, receba uma análise personalizada</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Jornadas de 30 Dias</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Trilhe caminhos temáticos com exercícios diários. Ao completar uma jornada, receba um relatório personalizado feito por IA com seus pontos fortes e dicas práticas.
                </p>
              </div>
            </div>
          )}

          {currentStep === "book" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4 stagger-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-float">
                  <BookOpen size={28} className="text-amber-600" />
                </div>
                <div className="space-y-2">
                  {["A Solidão", "A Incerteza", "A Identidade"].map((ch, i) => (
                    <div key={ch} className="flex items-center gap-2 text-left" style={{ animation: `staggerFade 0.4s ease-out ${0.3 + i * 0.12}s both` }}>
                      <div className="w-1 h-6 rounded-full bg-primary/30" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{ch}</p>
                        <p className="text-[10px] text-muted-foreground">Capítulo {i + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">O Livro</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Leia trechos exclusivos de "A Casa dos 20" e aprofunde suas reflexões com os temas do livro.
                </p>
              </div>
            </div>
          )}

          {currentStep === "notifications" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] space-y-4 stagger-1">
                <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-700 ${
                  notifStatus === "granted" ? "bg-green-500/10 scale-110" : notifStatus === "loading" ? "bg-blue-500/10 animate-pulse" : "bg-blue-500/10 animate-float"
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
                    <div className="flex items-start gap-3 text-left stagger-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Lembrete matinal</p>
                        <p className="text-[10px] text-muted-foreground">Check-in diário às 9h</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-left stagger-3">
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

              <div className="space-y-2 pt-2 stagger-2">
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
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-float stagger-1">
                <Crown size={32} className="text-white" />
              </div>

              <div className="space-y-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Plano Premium</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Desbloqueie toda a experiência da Casa dos 20
                </p>
              </div>

              <div className="w-full max-w-[320px] space-y-3 stagger-3">
                <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Gratuito (sempre)</p>
                  <div className="space-y-2">
                    {[
                      "Check-in diário de humor",
                      "5 cartas por tema de reflexão",
                      "Diário básico com texto",
                      "Trechos selecionados do livro"
                    ].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-left" style={{ animation: `staggerFade 0.3s ease-out ${0.3 + i * 0.08}s both` }}>
                        <Check size={14} className="text-green-500 shrink-0" />
                        <span className="text-xs text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl border border-amber-500/20 p-4 space-y-3 animate-pulse-glow">
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
                      "1º relatório de jornada com IA grátis",
                      "Diário com fotos, desenhos e banners",
                      "Todos os capítulos do livro",
                      "Notificações personalizadas"
                    ].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-left" style={{ animation: `staggerFade 0.3s ease-out ${0.4 + i * 0.08}s both` }}>
                        <Check size={14} className="text-amber-500 shrink-0" />
                        <span className="text-xs text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-500/5 rounded-xl border border-green-500/20 p-3 space-y-2 stagger-4">
                  <div className="flex items-center gap-2 justify-center">
                    <ShieldCheck size={14} className="text-green-600" />
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">14 dias grátis para experimentar</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-left">
                      <CreditCard size={11} className="text-muted-foreground shrink-0" />
                      <p className="text-[10px] text-muted-foreground">Adicione um cartão para iniciar — <span className="font-semibold text-foreground">não será cobrado nada agora</span></p>
                    </div>
                    <div className="flex items-center gap-2 text-left">
                      <Sparkles size={11} className="text-muted-foreground shrink-0" />
                      <p className="text-[10px] text-muted-foreground">A cobrança só começa <span className="font-semibold text-foreground">após 14 dias</span>, e você pode cancelar a qualquer momento</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 w-full flex justify-center pb-6 pt-4 px-6 bg-background">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex justify-center gap-1.5">
            {STEP_ORDER.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === stepIndex ? "w-8 bg-primary" : i < stepIndex ? "w-2 bg-primary/40" : "w-2 bg-muted"}`}
                data-testid={`dot-step-${i}`}
              />
            ))}
          </div>

          {currentStep === "premium" ? (
            <div className="space-y-3">
              {checkoutError && (
                <p className="text-xs text-red-500 text-center" data-testid="text-checkout-error">{checkoutError}</p>
              )}
              <Button
                onClick={handleStartTrial}
                disabled={checkoutLoading}
                className="w-full h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-base font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all"
                data-testid="button-onboarding-premium"
              >
                {checkoutLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Crown size={18} className="mr-2" />
                    Começar Trial Grátis
                  </>
                )}
              </Button>
              <button
                onClick={onComplete}
                className="w-full text-sm text-muted-foreground font-medium hover:text-foreground transition-colors py-2"
                data-testid="button-onboarding-skip-premium"
              >
                Continuar grátis por agora
              </button>
              <button
                onClick={back}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                data-testid="button-onboarding-back"
              >
                <ArrowLeft size={12} />
                Voltar
              </button>
            </div>
          ) : (
            <>
              <Button
                onClick={next}
                className="w-full h-14 rounded-full bg-primary text-primary-foreground text-base font-medium shadow-lg hover:shadow-xl active:scale-95 transition-all"
                data-testid="button-onboarding-next"
              >
                {currentStep === "notifications" && notifStatus === "idle" ? "Pular" : "Continuar"}
                <ArrowRight className="ml-2" size={18} />
              </Button>

              {stepIndex > 0 && (
                <button
                  onClick={back}
                  className="w-full text-xs text-muted-foreground font-medium hover:text-foreground transition-colors py-1 flex items-center justify-center gap-1"
                  data-testid="button-onboarding-back"
                >
                  <ArrowLeft size={12} />
                  Voltar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

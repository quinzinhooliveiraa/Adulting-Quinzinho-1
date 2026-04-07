import { useState, useEffect } from "react";
import { useGeoPrice } from "@/hooks/useGeoPrice";
import {
  ArrowRight, ArrowLeft, Bell, Check,
  Map, BookOpen, PenLine, MessageCircle,
  BellRing, Loader2, CheckCircle2, Clock,
  ShieldCheck, Sparkles, Brain,
  Smartphone, Plus, Share, User,
  Frown, Meh, Smile, Laugh, Star,
  Wifi, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bookCover from "@/assets/images/book-cover-oficial.png";
import { subscribeToPush, isPushSupported } from "@/utils/pushNotifications";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

function PwaSkipButton({ onClick }: { onClick: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return <div className="h-14" />;

  return (
    <button
      onClick={onClick}
      className="w-full h-14 rounded-full text-muted-foreground/60 text-xs font-medium transition-all duration-500 animate-in fade-in"
      data-testid="button-onboarding-skip-pwa"
    >
      Instalar depois
      <ArrowRight className="ml-1 inline" size={12} />
    </button>
  );
}

type StepId = "welcome" | "profile" | "pwa" | "checkin" | "journal" | "questions" | "journeys" | "book" | "notifications" | "trial";

const STEP_ORDER: StepId[] = ["welcome", "profile", "pwa", "checkin", "journal", "questions", "journeys", "book", "notifications", "trial"];

const INTERESTS = [
  { id: "autoconhecimento", label: "Autoconhecimento" },
  { id: "saude-mental", label: "Saúde Mental" },
  { id: "relacoes", label: "Relações" },
  { id: "carreira", label: "Carreira" },
  { id: "proposito", label: "Propósito" },
  { id: "criatividade", label: "Criatividade" },
  { id: "familia", label: "Família" },
  { id: "amizades", label: "Amizades" },
  { id: "financas", label: "Finanças" },
  { id: "espiritualidade", label: "Espiritualidade" },
];

const MOOD_ICONS = [Frown, Meh, Smile, Laugh, Star];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { price: geo } = useGeoPrice();
  const savedStep = parseInt(localStorage.getItem("casa-onboarding-step") || "0", 10);
  const [stepIndex, setStepIndex] = useState(isNaN(savedStep) ? 0 : Math.min(savedStep, STEP_ORDER.length - 1));
  const [isAnimating, setIsAnimating] = useState(false);
  const savedPerm = typeof Notification !== "undefined" && Notification.permission === "granted" && localStorage.getItem("casa-push-subscribed") === "true";
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "granted" | "denied">(savedPerm ? "granted" : "idle");
  const { canInstall, installed: pwaInstalled, promptInstall } = usePwaInstall();
  const [pwaAutoTriggered, setPwaAutoTriggered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"enter-right" | "enter-left" | "exit-left" | "exit-right" | "idle">("idle");
  const [trialLoading, setTrialLoading] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const goTo = (newIndex: number) => {
    if (isAnimating || newIndex === stepIndex) return;
    const dir = newIndex > stepIndex ? "right" : "left";
    setIsAnimating(true);
    setSlideDirection(dir === "right" ? "exit-left" : "exit-right");

    setTimeout(() => {
      setStepIndex(newIndex);
      localStorage.setItem("casa-onboarding-step", String(newIndex));
      setSlideDirection(dir === "right" ? "enter-right" : "enter-left");
      setTimeout(() => {
        setSlideDirection("idle");
        setIsAnimating(false);
      }, 350);
    }, 250);
  };

  const next = () => {
    if (currentStep === "profile") saveProfile();
    if (stepIndex < STEP_ORDER.length - 1) goTo(stepIndex + 1);
  };

  const back = () => {
    if (stepIndex > 0) goTo(stepIndex - 1);
  };

  const currentStep = STEP_ORDER[stepIndex];

  useEffect(() => {
    if (currentStep === "pwa" && canInstall && !pwaInstalled && !pwaAutoTriggered) {
      setPwaAutoTriggered(true);
      const timer = setTimeout(() => {
        promptInstall();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, canInstall, pwaInstalled, pwaAutoTriggered, promptInstall]);

  const handleNotificationActivate = async () => {
    setNotifStatus("loading");
    try {
      const success = await subscribeToPush();
      setNotifStatus(success ? "granted" : "denied");
    } catch {
      setNotifStatus("denied");
    }
  };

  const handleActivateTrial = async () => {
    setTrialLoading(true);
    try {
      const res = await apiRequest("POST", "/api/trial/activate");
      if (res.ok) {
        const data = await res.json();
        queryClient.setQueryData(["/api/auth/me"], (old: any) => ({
          ...old,
          hasPremium: data.hasPremium,
          premiumReason: data.premiumReason,
          trialEndsAt: data.trialEndsAt,
        }));
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    } catch {
      // ignore — complete onboarding anyway
    } finally {
      setTrialLoading(false);
      onComplete();
    }
  };

  const [profileAge, setProfileAge] = useState<number | null>(null);
  const [profileInterests, setProfileInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setProfileInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const saveProfile = async () => {
    if (!profileAge && profileInterests.length === 0) return;
    const body: any = {};
    if (profileAge) body.birthYear = new Date().getFullYear() - profileAge;
    if (profileInterests.length > 0) body.interests = profileInterests;
    try {
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
    } catch {}
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

      <div className="flex-1 flex flex-col items-center overflow-y-auto px-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)", paddingBottom: "1rem" }}>
        <div className={`w-full max-w-sm flex flex-col items-center my-auto transition-all duration-300 ease-out ${slideClass}`}>

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
              <div className="w-full bg-primary/5 border border-primary/15 rounded-xl p-3 stagger-3">
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <ShieldCheck size={14} className="text-primary" />
                  <span className="text-xs font-semibold text-primary">Os teus dados estão protegidos</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck size={16} className="text-primary/70" />
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">E-mail criptografado</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck size={16} className="text-primary/70" />
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">Senha protegida</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck size={16} className="text-primary/70" />
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">Cartão via Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "profile" && (
            <div className="flex flex-col space-y-6 w-full">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <User size={28} className="text-primary" />
                </div>
                <h2 className="text-2xl font-serif text-foreground">Conta-nos sobre ti</h2>
                <p className="text-sm text-muted-foreground">Ajuda-nos a personalizar a tua experiência</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantos anos tens?</p>
                <div className="flex flex-wrap gap-2">
                  {[18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35].map(age => (
                    <button
                      key={age}
                      onClick={() => setProfileAge(profileAge === age ? null : age)}
                      data-testid={`button-age-${age}`}
                      className={`w-12 h-10 rounded-xl text-sm font-medium transition-all ${
                        profileAge === age
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                  <button
                    onClick={() => setProfileAge(profileAge === 36 ? null : 36)}
                    data-testid="button-age-36plus"
                    className={`px-3 h-10 rounded-xl text-sm font-medium transition-all ${
                      profileAge === 36
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    36+
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">O que mais te importa agora?</p>
                <p className="text-[11px] text-muted-foreground/70">Podes escolher vários</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      data-testid={`button-interest-${interest.id}`}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                        profileInterests.includes(interest.id)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === "pwa" && (() => {
            const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent || "");
            return (
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-full max-w-[300px] space-y-4 stagger-1">
                <div className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center transition-all duration-700 ${
                  pwaInstalled ? "bg-green-500/10 scale-110" : "bg-gradient-to-br from-primary/20 to-primary/5 animate-float"
                }`}>
                  {pwaInstalled ? (
                    <CheckCircle2 size={44} className="text-green-500" />
                  ) : (
                    <Smartphone size={44} className="text-primary" />
                  )}
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-serif text-foreground">
                    {pwaInstalled ? "App Instalado!" : "Instala o App"}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pwaInstalled
                      ? "Tudo pronto! O app já está na tua ecrã inicial."
                      : "Instala para receber lembretes diários e ter a melhor experiência."
                    }
                  </p>
                </div>

                {!pwaInstalled && (
                  <>
                    {canInstall ? (
                      <button
                        onClick={promptInstall}
                        className="w-full p-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30 animate-pulse"
                        data-testid="button-install-pwa"
                      >
                        <Plus size={20} />
                        Instalar Agora
                      </button>
                    ) : (
                      <div className="bg-card rounded-2xl border-2 border-primary/30 p-5 space-y-4 shadow-lg">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Siga os passos:</p>
                        {isIos ? (
                          <>
                            <div className="flex items-center gap-3 text-left stagger-2">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                                <Share size={18} className="text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">1. Toque em <span className="text-blue-500">Compartilhar</span></p>
                                <p className="text-[10px] text-muted-foreground">O ícone fica na barra inferior do Safari</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-left stagger-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                <Plus size={18} className="text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">2. <span className="text-primary">Adicionar à Tela de Início</span></p>
                                <p className="text-[10px] text-muted-foreground">Role para baixo no menu e toque nesta opção</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-left stagger-3">
                              <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
                                <Check size={18} className="text-green-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">3. Toque em <span className="text-green-500">Adicionar</span></p>
                                <p className="text-[10px] text-muted-foreground">Pronto! O app aparecerá na sua tela</p>
                              </div>
                            </div>
                            {!isSafari && (
                              <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center">
                                  No iPhone, usa o Safari para instalar o app
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 text-left stagger-2">
                              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                <span className="text-primary text-lg font-bold">⋮</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">1. Toque no <span className="text-primary">menu ⋮</span> do navegador</p>
                                <p className="text-[10px] text-muted-foreground">Os 3 pontos no canto superior direito</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-left stagger-3">
                              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                <Plus size={18} className="text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">2. <span className="text-primary">Instalar app</span> ou <span className="text-primary">Adicionar à tela</span></p>
                                <p className="text-[10px] text-muted-foreground">Confirme para instalar</p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 justify-center pt-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Smartphone size={13} />
                        <Zap size={13} />
                        <Wifi size={13} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Notificações · Acesso rápido · Modo offline</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            );
          })()}

          {currentStep === "checkin" && (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-[280px] bg-card rounded-3xl border border-border p-6 shadow-lg space-y-4 stagger-1">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto animate-float">
                  <Smile size={28} className="text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground">Como estás hoje?</p>
                <div className="flex justify-center gap-3">
                  {MOOD_ICONS.map((Icon, i) => (
                    <div
                      key={i}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 ${i === 3 ? "bg-primary/10 scale-110 ring-2 ring-primary/30" : "bg-muted/50 hover:scale-110"}`}
                      style={{ animation: `staggerFade 0.5s ease-out ${0.2 + i * 0.1}s both` }}
                    >
                      <Icon size={20} className={i === 3 ? "text-primary" : "text-muted-foreground"} />
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
                  Todos os dias, regista como te estás a sentir. Com o tempo, perceberes padrões e conhecer-te melhor.
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
                  Escreve os teus pensamentos livremente. Adiciona fotos, desenhos e banners. O teu espaço privado de reflexão.
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
                  <p className="text-sm font-medium text-foreground text-left">"O que farias diferente se ninguém estivesse a observar?"</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-md transform rotate-1 opacity-70 scale-95 stagger-3">
                  <p className="text-xs text-muted-foreground text-left">"Qual é o medo que mais te impede de agir?"</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Cartas de Reflexão</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Centenas de perguntas profundas para explorar sozinho ou em conversa com amigos. Desliza para descobrir novas cartas.
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
                      <p className="text-[10px] text-muted-foreground leading-tight">Ao completar, recebe uma análise personalizada</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Jornadas de 30 Dias</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Percorre caminhos temáticos com exercícios diários. Ao completar uma jornada, recebe um relatório personalizado feito por IA.
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
                  Lê trechos exclusivos de "A Casa dos 20" e aprofunda as tuas reflexões com os temas do livro.
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
                    ? "Vais receber lembretes gentis para os teus momentos de reflexão."
                    : notifStatus === "denied"
                    ? "Podes ativar as notificações mais tarde nas definições do app."
                    : "Ativa as notificações para receber convites diários à reflexão."
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

              {notifStatus === "granted" && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/push/test", { method: "POST", credentials: "include" });
                      const data = await res.json();
                      if (data.sent > 0) {
                        alert("Notificação enviada! Verifica o teu dispositivo.");
                      } else {
                        alert("Nenhuma assinatura encontrada. Tenta ativar novamente.");
                      }
                    } catch {
                      alert("Erro ao enviar notificação de teste.");
                    }
                  }}
                  className="w-full max-w-[280px] p-3 rounded-2xl border border-green-500/30 bg-green-500/5 text-green-600 font-medium text-sm hover:bg-green-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                  data-testid="button-test-notification"
                >
                  <BellRing size={16} />
                  Testar Notificação
                </button>
              )}
            </div>
          )}

          {currentStep === "trial" && (
            <div className="flex flex-col items-center text-center space-y-5 w-full">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center animate-float stagger-1">
                <Sparkles size={32} className="text-primary" />
              </div>

              <div className="space-y-2 stagger-2">
                <h2 className="text-2xl font-serif text-foreground">Explora tudo por 14 dias</h2>
                <p className="text-sm text-muted-foreground leading-relaxed px-2">
                  Ativa o teu trial gratuito agora e desbloqueia toda a experiência da Casa dos 20, sem cartão de crédito.
                </p>
              </div>

              <div className="w-full max-w-[320px] space-y-3 stagger-3">
                {/* Free forever */}
                <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider text-left">Gratuito (sempre)</p>
                  <div className="space-y-2">
                    {[
                      "Check-in diário de humor",
                      "5 cartas por tema de reflexão",
                      "Diário básico com texto",
                      "Trechos selecionados do livro",
                    ].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-left" style={{ animation: `staggerFade 0.3s ease-out ${0.3 + i * 0.07}s both` }}>
                        <Check size={13} className="text-green-500 shrink-0" />
                        <span className="text-xs text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trial unlocks */}
                <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4 space-y-2.5 animate-pulse-glow">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} /> Desbloqueado no trial
                    </p>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">14 dias grátis</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      "Todas as cartas de reflexão ilimitadas",
                      "Jornadas completas de 30 dias",
                      "1.º relatório de jornada com IA grátis",
                      "Diário com fotos, desenhos e banners",
                      "Notificações personalizadas",
                    ].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 text-left" style={{ animation: `staggerFade 0.3s ease-out ${0.4 + i * 0.07}s both` }}>
                        <Check size={13} className="text-primary shrink-0" />
                        <span className="text-xs text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center">
                  <ShieldCheck size={13} className="text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">Sem cartão de crédito · Cancelas quando quiseres</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 w-full flex justify-center pt-4 px-6 bg-background" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)" }}>
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

          {currentStep === "trial" ? (
            <div className="space-y-3">
              <Button
                onClick={handleActivateTrial}
                disabled={trialLoading}
                className="w-full h-14 rounded-full text-base font-semibold"
                data-testid="button-onboarding-activate-trial"
              >
                {trialLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Ativar 14 dias grátis
                  </>
                )}
              </Button>
              <button
                onClick={onComplete}
                className="w-full text-sm text-muted-foreground font-medium hover:text-foreground transition-colors py-2"
                data-testid="button-onboarding-skip-trial"
              >
                Explorar primeiro
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
              {currentStep === "pwa" && !pwaInstalled ? (
                <PwaSkipButton onClick={next} />
              ) : (
                <Button
                  onClick={next}
                  className="w-full h-14 rounded-full text-base font-medium"
                  data-testid="button-onboarding-next"
                >
                  {currentStep === "notifications" && notifStatus === "idle" ? "Pular" : "Continuar"}
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              )}

              {currentStep === "profile" && !profileAge && profileInterests.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center -mt-1">Podes saltar e preencher mais tarde</p>
              )}

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

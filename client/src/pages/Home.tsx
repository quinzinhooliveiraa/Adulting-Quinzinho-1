import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PenLine, Share, Heart, Meh, Frown, Smile, X, Image as ImageIcon, Check, Hash, Sparkles, Moon, ChevronRight, BookOpen, Brain, BarChart3, Calendar, FileText, TrendingUp, Mic, Square } from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Onboarding from "@/components/Onboarding";
import { DAILY_REFLECTIONS } from "@shared/dailyReflections";
import { getLastCheckIn, recommendContent, RecommendedContent, saveCheckIn, analyzeCheckIn } from "@/utils/intelligentRecommendation";
import BlogReflectionEditor from "@/components/BlogReflectionEditor";
import { generateShareImage, renderShareImageToCanvas, type ShareImageTheme } from "@/utils/shareImage";
import { useAuth } from "@/hooks/useAuth";
import { useCreateEntry } from "@/hooks/useJournal";
import { useCreateCheckin, useLatestCheckin, useCheckins } from "@/hooks/useCheckins";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { JOURNEYS } from "./Journey";
import { Flame, Target, ArrowUpRight, Lock, Clock } from "lucide-react";
import { DEFAULT_REMINDERS, THEMED_REMINDERS } from "@shared/reminders";
import { useLocation } from "wouter";
import ReferralCard from "@/components/ReferralCard";

function TrialBanner({ trialEndsAt, onUpgrade }: {
  trialEndsAt: string | null;
  onUpgrade: () => void;
}) {
  if (!trialEndsAt) return null;
  const msLeft = new Date(trialEndsAt).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60)));
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  if (hoursLeft <= 0) return null;

  const within24h = hoursLeft <= 24;
  const lastDays = daysLeft <= 3;

  if (within24h) {
    return (
      <button
        onClick={onUpgrade}
        className="w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 bg-destructive/10 border border-destructive/30 hover-elevate"
        data-testid="trial-banner-home-urgent"
      >
        <Clock className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">
            últimas horas
          </p>
          <p className="text-xs text-muted-foreground">
            não para agora — é aqui que começa a ficar claro
          </p>
        </div>
        <span className="text-xs font-medium text-destructive shrink-0 whitespace-nowrap">continuar →</span>
      </button>
    );
  }

  if (lastDays) {
    return (
      <button
        onClick={onUpgrade}
        className="w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 bg-muted/60 border border-border hover-elevate"
        data-testid="trial-banner-home-last-days"
      >
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            últimos {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
          </p>
          <p className="text-xs text-muted-foreground">
            não para agora — é aqui que começa a ficar claro
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">continuar →</span>
      </button>
    );
  }

  return (
    <button
      onClick={onUpgrade}
      className="w-full text-left rounded-2xl px-4 py-3 flex items-center gap-3 bg-muted/60 border border-border hover-elevate"
      data-testid="trial-banner-home"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {daysLeft} dias para continuar o que você começou
        </p>
        <p className="text-xs text-muted-foreground">
          algumas respostas só aparecem quando você continua
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">continuar →</span>
    </button>
  );
}


function extractCleanText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === "string") return parsed.text;
  } catch {}
  return raw;
}

const analyzeTextForTags = (text: string) => {
  const cleanText = extractCleanText(text);
  const lowerText = cleanText.toLowerCase();
  const foundTags = new Set<string>();
  
  if (lowerText.match(/\b(medo|futuro|ansioso|ansiedade|preocupa\w*|nervos\w*)\b/)) foundTags.add("ansiedade");
  if (lowerText.match(/\b(objetivo|sentido|carreira|trabalho|propósito)\b|fazer da vida/)) foundTags.add("propósito");
  if (lowerText.match(/\b(namorad[oa]|relacionamento|casamento|amig[oa]s?)\b/)) foundTags.add("relações");
  if (lowerText.match(/\b(identidade|autêntic[oa])\b|eu mesmo|quem sou|minha essência/)) foundTags.add("identidade");
  if (lowerText.match(/\b(sozinho|solitári[oa]|solitude|solidão|isolad[oa])\b/)) foundTags.add("solidão");
  if (lowerText.match(/\b(aprender|evoluir|mudar|crescer|melhorar|crescimento)\b/)) foundTags.add("crescimento");
  if (lowerText.match(/\b(dúvida|incerteza|confus[oa]|perdid[oa])\b|não sei/)) foundTags.add("incerteza");
  if (lowerText.match(/\b(amoro|amorad[oa]|amoroso|apaixonad[oa]|paixão|coração)\b/)) foundTags.add("amor");

  return Array.from(foundTags).slice(0, 3);
};




export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const createEntry = useCreateEntry();
  const createCheckin = useCreateCheckin();
  const { data: latestCheckin } = useLatestCheckin();
  const { data: allCheckins = [] } = useCheckins();

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("casa-dos-20-needs-onboarding") === "true";
  });
  const [mood, setMood] = useState<string | null>(null);
  const [checkInContext, setCheckInContext] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [checkIns, setCheckIns] = useState<{id: string, time: string}[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReminderShareOpen, setIsReminderShareOpen] = useState(false);
  const [shareImageTheme, setShareImageTheme] = useState<ShareImageTheme>("dark");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recommendedContent, setRecommendedContent] = useState<RecommendedContent | null>(null);
  const [showReflectionEditor, setShowReflectionEditor] = useState(false);
  const reminderPreviewRef = useRef<HTMLCanvasElement>(null);
  const reflectionPreviewRef = useRef<HTMLCanvasElement>(null);
  
  const today = format(new Date(), "d 'de' MMMM", { locale: ptBR });

  useEffect(() => {
    if (latestCheckin) {
      const checkinData = {
        date: latestCheckin.date,
        mood: latestCheckin.mood,
        entry: latestCheckin.entry,
        tags: latestCheckin.tags,
        timestamp: new Date(latestCheckin.createdAt).getTime(),
      };
      const content = recommendContent(checkinData);
      setRecommendedContent(content);
    } else {
      const localCheckIn = getLastCheckIn();
      const content = recommendContent(localCheckIn);
      setRecommendedContent(content);
    }
  }, [latestCheckin]);

  const { greeting, userName } = useMemo(() => {
    const brDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hour = brDate.getHours();
    const displayName = user?.name || localStorage.getItem("casa-dos-20-user-name") || "";
    const nameStr = displayName ? `, ${displayName.split(' ')[0]}` : "";
    
    let g = "Bom dia";
    if (hour >= 12 && hour < 18) g = "Boa tarde";
    else if (hour >= 18 || hour < 5) g = "Boa noite";
    
    return { greeting: g, userName: nameStr };
  }, [user]);

  // Deterministic daily seed based on today's date (Brazil timezone)
  const todayDateSeed = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    let seed = 0;
    for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed + today.charCodeAt(i)) | 0;
    return Math.abs(seed);
  }, []);

  // Intelligent Reminder Selection — changes once per day, uses real check-in tags
  const dailyReminder = useMemo(() => {
    const tags = latestCheckin?.tags ?? [];
    const themedTags = tags.filter(t => THEMED_REMINDERS[t]);
    if (themedTags.length > 0) {
      const tag = themedTags[todayDateSeed % themedTags.length];
      const options = THEMED_REMINDERS[tag];
      return options[(todayDateSeed >> 3) % options.length];
    }
    return DEFAULT_REMINDERS[todayDateSeed % DEFAULT_REMINDERS.length];
  }, [latestCheckin, todayDateSeed]);

  const dailyReflection = useMemo(() => {
    if (recommendedContent?.reflection) {
      return recommendedContent.reflection;
    }
    const today = new Date().toISOString().split('T')[0];
    let seed = 0;
    for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed + today.charCodeAt(i)) | 0;
    const index = Math.abs(seed) % DAILY_REFLECTIONS.length;
    return DAILY_REFLECTIONS[index];
  }, [recommendedContent]);

  const moodIcons = [
    { id: "terrible", icon: Frown, label: "Difícil" },
    { id: "bad", icon: Meh, label: "Ansioso" },
    { id: "neutral", icon: Smile, label: "Calmo" },
    { id: "good", icon: Heart, label: "Grato" },
    { id: "excited", icon: Sparkles, label: "Animado" },
    { id: "lonely", icon: Moon, label: "Solitário" },
  ];

  const handleMoodSelect = (id: string) => {
    setMood(id);
    setCheckInContext(""); // Reset context for new check-in
  };

  const handleSubmitCheckIn = async () => {
    if (!mood) return;
    
    setIsSubmittingCheckIn(true);
    const tags = analyzeCheckIn(mood, checkInContext);
    
    try {
      if (user) {
        await createCheckin.mutateAsync({ mood, entry: checkInContext, tags });
      }
      saveCheckIn(mood, checkInContext);
      
      const lastCheckIn = getLastCheckIn();
      const content = recommendContent(lastCheckIn);
      setRecommendedContent(content);
      
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setMood(null);
        setCheckInContext("");
        setIsSubmittingCheckIn(false);
      }, 1500);
      
      const now = new Date();
      const timeStr = format(now, "HH:mm");
      setCheckIns(prev => [...prev, { id: mood, time: timeStr }]);
    } catch {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Intelligent Tagging effect
  useEffect(() => {
    if (reflectionText.length > 15) {
      const tags = analyzeTextForTags(reflectionText);
      // Only show tags that aren't already selected
      setSuggestedTags(tags.filter(t => !selectedTags.includes(t)));
    } else {
      setSuggestedTags([]);
    }
  }, [reflectionText, selectedTags]);

  const weeklySummary = useMemo(() => {
    if (checkIns.length === 0) return null;
    
    const counts: Record<string, number> = {};
    checkIns.forEach(c => {
      counts[c.id] = (counts[c.id] || 0) + 1;
    });
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topMoodId = sorted[0][0];
    const topMood = moodIcons.find(m => m.id === topMoodId);
    const percentage = Math.round((sorted[0][1] / checkIns.length) * 100);
    
    return {
      predominant: topMood?.label || "Calmo",
      percentage: `${percentage}%`,
      trend: percentage > 50 ? "estável" : "variável",
      counts: sorted.map(([id, count]) => ({
        label: moodIcons.find(m => m.id === id)?.label || id,
        percent: Math.round((count / checkIns.length) * 100)
      }))
    };
  }, [checkIns]);

  const handleSaveReflection = async () => {
    if (!reflectionText.trim()) return;
    
    let finalTags = selectedTags;
    if (selectedTags.length === 0 && suggestedTags.length > 0) {
      finalTags = [suggestedTags[0]];
      setSelectedTags(finalTags);
    }

    try {
      if (user) {
        await createEntry.mutateAsync({
          text: reflectionText,
          tags: finalTags,
          mood: mood || undefined,
        });
      }
    } catch {
      // Fallback handled below
    }
    
    setIsSaved(true);
    setTimeout(() => {
      setIsReflecting(false);
      setReflectionText("");
      setSelectedTags([]);
      setIsSaved(false);
    }, 1500);
  };

  const { data: monthlyInsights } = useQuery({
    queryKey: ["/api/insights/monthly"],
    queryFn: async () => {
      const res = await fetch("/api/insights/monthly", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const isPremium = user?.hasPremium || user?.role === "admin";

  const { data: journeyProgressData, refetch: refetchJourney } = useQuery({
    queryKey: ["/api/journey/progress"],
    queryFn: async () => {
      const res = await fetch("/api/journey/progress", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const todayActivity = useMemo(() => {
    if (!isPremium || !journeyProgressData) return null;
    const progressMap: Record<string, { completedDays: string[]; timestamps: Record<string, string> }> = {};
    (journeyProgressData as any[]).forEach((p: any) => {
      let ts: Record<string, string> = {};
      try { ts = JSON.parse(p.completedTimestamps || "{}"); } catch {}
      progressMap[p.journeyId] = { completedDays: p.completedDays, timestamps: ts };
    });
    for (const journey of JOURNEYS) {
      const progress = progressMap[journey.id];
      if (!progress || progress.completedDays.length === 0) continue;
      if (progress.completedDays.length >= journey.totalDays) continue;
      const nextDay = journey.days.find((d) => !progress.completedDays.includes(d.id));
      if (nextDay) {
        const dayIdx = journey.days.findIndex((d) => d.id === nextDay.id);
        let lockedUntilTomorrow = false;
        if (dayIdx > 0) {
          const prevDay = journey.days[dayIdx - 1];
          const prevCompletedAt = progress.timestamps[prevDay.id];
          if (prevCompletedAt) {
            const completedDate = new Date(prevCompletedAt);
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            lockedUntilTomorrow = completedDate >= todayStart;
          }
        }
        return { journey, day: nextDay, completedCount: progress.completedDays.length, lockedUntilTomorrow };
      }
    }
    return null;
  }, [isPremium, journeyProgressData]);

  const handleCompleteJourneyDay = async () => {
    if (!todayActivity || todayActivity.lockedUntilTomorrow) return;
    try {
      await fetch("/api/journey/complete-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ journeyId: todayActivity.journey.id, dayId: todayActivity.day.id }),
      });
      refetchJourney();
    } catch {}
  };

  const moodLabels: Record<string, string> = { "great": "Ótimo", "good": "Bem", "neutral": "Neutro", "bad": "Mal", "awful": "Péssimo" };

  const monthlyReport = useMemo(() => {
    if (!monthlyInsights) {
      return {
        totalEntries: 0,
        dominantTheme: "",
        insight: "Comece a escrever reflexões e fazer check-ins para ver seus insights mensais aqui.",
        activeDays: 0,
        totalDays: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
        totalWords: 0,
        checkinsThisMonth: 0,
        dominantMood: null as string | null,
        topTags: [] as { tag: string; count: number }[],
        moodCounts: {} as Record<string, number>,
        month: "",
      };
    }
    const topTag = monthlyInsights.topTags?.[0]?.tag || "";
    const totalEntries = monthlyInsights.entriesThisMonth || 0;
    const activeDays = monthlyInsights.activeDays || 0;
    const totalDays = monthlyInsights.totalDays || 30;
    const mood = monthlyInsights.dominantMood;
    const moodLabel = mood ? (moodLabels[mood] || mood) : "";
    const words = monthlyInsights.totalWords || 0;

    let insight = "";
    if (totalEntries === 0 && monthlyInsights.checkinsThisMonth === 0) {
      insight = "Você ainda não tem atividade este mês. Comece fazendo um check-in ou escrevendo uma reflexão!";
    } else {
      const parts = [];
      if (totalEntries > 0) parts.push(`Você escreveu ${totalEntries} reflexão(ões) com ${words} palavras`);
      if (monthlyInsights.checkinsThisMonth > 0) parts.push(`fez ${monthlyInsights.checkinsThisMonth} check-in(s)`);
      if (activeDays > 0) parts.push(`esteve ativo em ${activeDays} de ${totalDays} dias`);
      if (topTag) parts.push(`O tema "${topTag}" apareceu mais vezes`);
      if (mood) parts.push(`Seu humor predominante foi "${moodLabel}"`);
      insight = parts.join(". ") + ".";
    }

    return {
      totalEntries,
      dominantTheme: topTag,
      insight,
      activeDays,
      totalDays,
      totalWords: words,
      checkinsThisMonth: monthlyInsights.checkinsThisMonth || 0,
      dominantMood: mood,
      topTags: monthlyInsights.topTags || [],
      moodCounts: monthlyInsights.moodCounts || {},
      month: monthlyInsights.month || "",
    };
  }, [monthlyInsights]);

  const handleSocialShare = (platform: string) => {
    if (platform === 'save') {
      generateShareImage({ text: dailyReminder, theme: shareImageTheme, type: "reminder" });
    }
  };

  useEffect(() => {
    if (isReminderShareOpen && reminderPreviewRef.current) {
      renderShareImageToCanvas(reminderPreviewRef.current, { text: dailyReminder, theme: shareImageTheme, type: "reminder" });
    }
  }, [isReminderShareOpen, shareImageTheme, dailyReminder]);

  useEffect(() => {
    if (isShareOpen && reflectionPreviewRef.current) {
      renderShareImageToCanvas(reflectionPreviewRef.current, { text: dailyReflection.text, theme: shareImageTheme, type: dailyReflection.type === "question" ? "question" : "reflection" });
    }
  }, [isShareOpen, shareImageTheme, dailyReflection]);

  const moodTips: Record<string, string[]> = {
    terrible: [
      "Dê a si mesmo permissão para descansar. Às vezes, o ato mais produtivo é pausar e respirar fundo.",
      "Não se cobre tanto hoje. Pequenos passos ainda são progresso.",
      "O que você pode fazer de gentil por si mesmo nos próximos 15 minutos?"
    ],
    bad: [
      "A ansiedade é uma nuvem, não o céu. Tente escrever três coisas que você pode controlar agora.",
      "Respire em quatro tempos. Sinta seus pés no chão. Você está aqui e está seguro.",
      "Seus pensamentos não são fatos. Deixe-os passar como barcos em um rio."
    ],
    neutral: [
      "Aproveite esta calma para ler uma página do livro ou planejar algo que te traga alegria.",
      "A neutralidade é um terreno fértil. O que você gostaria de plantar hoje?",
      "Um momento de silêncio pode ser o melhor presente que você se dá agora."
    ],
    good: [
      "Que momento precioso. Compartilhe essa gratidão com alguém ou escreva o motivo desse sorriso.",
      "Saboreie esta sensação. Como você pode levar esse brilho para o resto do seu dia?",
      "A felicidade está nas pequenas frestas. Onde mais você a vê hoje?"
    ],
    excited: [
      "Use essa energia para dar o primeiro passo naquele projeto que você estava adiando!",
      "Sua vitalidade é contagiosa. O que você quer criar com esse entusiasmo?",
      "Celebre este impulso! A vida adulta também é feita de grandes começos."
    ],
    lonely: [
      "A solitude pode ser um mestre silencioso. O que sua própria companhia está tentando te dizer hoje?",
      "Estar sozinho é uma oportunidade de se reconectar com quem você é de verdade.",
      "Você é sua primeira casa. Como você pode tornar esse espaço mais acolhedor agora?"
    ],
  };

  const currentTip = useMemo(() => {
    if (!mood) return "";
    const options = moodTips[mood];
    const brNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const dayOfYear = Math.floor((brNow.getTime() - new Date(brNow.getFullYear(), 0, 0).getTime()) / 86400000);
    const seed = dayOfYear + brNow.getHours();
    return options[seed % options.length];
  }, [mood]);

  if (showOnboarding) {
    return <Onboarding onComplete={() => {
      localStorage.removeItem("casa-dos-20-needs-onboarding");
      setShowOnboarding(false);
    }} />;
  }

  return (
    <div className="px-6 md:px-10 pt-12 pb-8 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-x-hidden">
      <header className="space-y-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-sans">
              {today}
            </p>
            <h1 className="text-3xl text-foreground font-serif leading-tight">
              {greeting}{userName}. <br/>
              Como você está agora?
            </h1>
          </div>
        </div>
      </header>

      {user?.premiumReason === "trial" && user?.trialEndsAt && (
        <TrialBanner
          trialEndsAt={user.trialEndsAt}
          onUpgrade={() => navigate("/premium")}
        />
      )}

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-serif text-muted-foreground uppercase tracking-wider">Check-in de Humor</h2>
          {checkIns.length > 0 && (
            <button 
              onClick={() => setIsSummaryOpen(true)}
              className="text-[10px] font-bold text-primary underline"
            >
              Ver Resumo da Semana
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {moodIcons.map((m) => {
            const Icon = m.icon;
            const isActive = mood === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleMoodSelect(m.id)}
                className={`flex flex-col items-center space-y-2 p-4 rounded-2xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]' 
                    : 'bg-card border-border/50 text-muted-foreground hover:bg-muted/50'
                }`}
                data-testid={`mood-${m.id}`}
              >
                <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium tracking-tight text-center">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {mood && (
        <section className="animate-in fade-in zoom-in duration-500 space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">
              O que está acontecendo? (opcional)
            </p>
            <div className="relative">
              <Textarea
                value={checkInContext}
                onChange={(e) => setCheckInContext(e.target.value)}
                placeholder="Compartilhe o contexto... qual é a situação, o que você está sentindo..."
                className="min-h-24 rounded-xl resize-none pr-12"
              />
              <div className="absolute top-3 right-3">
                <AudioButton 
                  onText={(text) => setCheckInContext(prev => prev ? prev.trimEnd() + " " + text : text)} 
                  size={20}
                />
              </div>
            </div>
            <Button
              onClick={handleSubmitCheckIn}
              disabled={isSubmittingCheckIn}
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold"
            >
              {isSubmittingCheckIn ? "Salvando..." : "Registrar Check-in"}
            </Button>
          </div>
          
          <div className="bg-secondary/30 rounded-3xl p-6 border border-primary/5 flex items-start gap-4">
            <div className="p-3 bg-background rounded-2xl shadow-sm text-primary">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Dica para agora</p>
              <p className="text-sm text-foreground leading-relaxed italic">
                "{currentTip}"
              </p>
            </div>
          </div>
        </section>
      )}

      {allCheckins.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-2">
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                <h3 className="font-serif text-lg">Relatório de Humor</h3>
              </div>
              <button
                onClick={() => setIsSummaryOpen(true)}
                className="text-[10px] font-bold text-primary underline uppercase tracking-wider"
              >
                Ver Relatório
              </button>
            </div>
          </div>
        </section>
      )}

      {todayActivity && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-500" data-testid="home-today-activity">
          <div onClick={() => navigate(`/journey/${todayActivity.journey.id}`)} className="block cursor-pointer">
            <div
              className="rounded-2xl border border-primary/20 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${todayActivity.journey.gradientFrom}08, ${todayActivity.journey.gradientTo}05)` }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={14} className="text-primary" />
                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">Atividade de Hoje</span>
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {todayActivity.journey.title} · Dia {todayActivity.day.day}/{todayActivity.journey.totalDays}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${todayActivity.journey.gradientFrom}, ${todayActivity.journey.gradientTo})` }}
                  >
                    <Target size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{todayActivity.day.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{todayActivity.day.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {todayActivity.lockedUntilTomorrow ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-semibold">
                          <Lock size={11} />
                          Disponível amanhã
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCompleteJourneyDay();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold active:scale-95 transition-all"
                          data-testid="button-home-complete-day"
                        >
                          <Check size={11} />
                          Feito
                        </button>
                      )}
                      {todayActivity.day.appLink && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(todayActivity.day.appLink!);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-primary/30 text-primary text-[10px] font-semibold hover:bg-primary/10 transition-colors"
                          data-testid="button-home-applink"
                        >
                          <ArrowUpRight size={10} />
                          Ir para o app
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((todayActivity.completedCount / todayActivity.journey.totalDays) * 100)}%`,
                      background: `linear-gradient(90deg, ${todayActivity.journey.gradientFrom}, ${todayActivity.journey.gradientTo})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-serif text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Reflexão para Hoje
          </h2>
          {dailyReflection.type === "reflection" && dailyReflection.fromBook && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/30">
              <BookOpen size={10} />
              Do Livro
            </span>
          )}
          {dailyReflection.type === "tip" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-green-700 dark:text-green-400 bg-green-100/50 dark:bg-green-950/30 px-2.5 py-1 rounded-full border border-green-200/50 dark:border-green-800/30">
              Dica Prática
            </span>
          )}
          {dailyReflection.type === "reminder" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/30">
              Lembrete
            </span>
          )}
          {dailyReflection.type === "question" && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-purple-700 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-950/30 px-2.5 py-1 rounded-full border border-purple-200/50 dark:border-purple-800/30">
              Questão
            </span>
          )}
        </div>
        
        <div className={`${
          dailyReflection.type === 'reflection' && dailyReflection.fromBook ? 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/50 dark:border-amber-800/30' :
          dailyReflection.type === 'tip' ? 'bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200/50 dark:border-green-800/30' :
          dailyReflection.type === 'reminder' ? 'bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border-blue-200/50 dark:border-blue-800/30' :
          dailyReflection.type === 'question' ? 'bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border-purple-200/50 dark:border-purple-800/30' :
          'glass-card'
        } rounded-3xl p-6 md:p-8 relative overflow-hidden group border`}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <p className="font-serif text-xl md:text-2xl reading-text text-foreground">
              "{dailyReflection.text}"
            </p>
            
            {!isReflecting && !reflectionText && (
              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  onClick={() => setShowReflectionEditor(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                >
                  <PenLine className="mr-2" size={18} />
                  Expandir e Refletir
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsShareOpen(true)}
                  className="w-full rounded-full h-12 text-base font-medium bg-transparent border-border hover:bg-secondary text-foreground transition-all"
                >
                  <Share className="mr-2" size={18} />
                  Compartilhar
                </Button>
              </div>
            )}

            {(isReflecting || reflectionText) && (
              <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="relative">
                  <Textarea 
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Sua mente é um espaço seguro. Escreva livremente..."
                    className="min-h-[160px] bg-background/50 border-border/80 focus:border-primary/50 focus:ring-primary/20 rounded-2xl p-4 pr-12 text-base resize-none font-serif leading-relaxed placeholder:font-sans placeholder:text-sm"
                    autoFocus={isReflecting}
                  />
                  <div className="absolute top-3 right-3">
                    <AudioButton 
                      onText={(text) => setReflectionText(prev => prev ? prev.trimEnd() + " " + text : text)} 
                      size={20}
                    />
                  </div>
                  {isSaved && (
                    <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground p-2 rounded-full shadow-lg animate-in zoom-in">
                      <Check size={16} />
                    </div>
                  )}
                </div>

                {/* Intelligent Tagging Area */}
                {(suggestedTags.length > 0 || selectedTags.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Hash size={14} className="text-muted-foreground opacity-70" />
                    
                    {selectedTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-1 transition-all"
                      >
                        {tag} <X size={10} className="opacity-70 ml-1" />
                      </button>
                    ))}

                    {suggestedTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-dashed border-primary/30 font-medium hover:bg-primary/10 transition-all animate-in fade-in zoom-in"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex space-x-3 pt-2">
                  <Button 
                    onClick={handleSaveReflection}
                    disabled={!reflectionText.trim() || isSaved}
                    className="flex-1 bg-primary text-primary-foreground rounded-full h-11 transition-all"
                  >
                    {isSaved ? "Salvo no Diário" : "Salvar"}
                  </Button>
                  {reflectionText && !isReflecting && (
                    <Button 
                      variant="outline"
                      onClick={() => setIsShareOpen(true)}
                      className="w-11 h-11 rounded-full p-0 flex-shrink-0 border-border bg-background/50"
                    >
                      <Share size={18} />
                    </Button>
                  )}
                  {reflectionText && !isReflecting && (
                    <Button 
                      variant="ghost"
                      onClick={() => setIsReflecting(true)}
                      className="w-11 h-11 rounded-full p-0 flex-shrink-0 bg-secondary/50"
                    >
                      <PenLine size={18} />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/60">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-serif text-foreground">Lembrete do dia</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsReminderShareOpen(true)}
              className="text-primary h-8 px-2 hover:bg-primary/5 rounded-lg"
            >
              <Share size={14} className="mr-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Compartilhar</span>
            </Button>
          </div>
          <p className="text-muted-foreground reading-text text-sm md:text-base italic">
            "{dailyReminder}"
          </p>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-serif text-foreground">Relatório Mensal</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsReportOpen(true)}
              className="text-primary h-8 px-2 hover:bg-primary/5 rounded-lg"
            >
              <ChevronRight size={14} className="mr-1.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ver Insight</span>
            </Button>
          </div>
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 h-[calc(100%-48px)]">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "{monthlyReport.insight}"
            </p>
          </div>
        </section>
      </div>

      {/* Reminder Share Drawer */}
      {isReminderShareOpen && (
        <div className="fixed inset-x-0 top-0 bottom-[64px] sm:bottom-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsReminderShareOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl p-6 pt-8 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 max-h-full overflow-y-auto">
            <button 
              onClick={() => setIsReminderShareOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-serif text-foreground mb-4">Compartilhar Lembrete</h3>
            
            <canvas ref={reminderPreviewRef} width={540} height={540} className="w-full aspect-square rounded-2xl border border-border/30 shadow-inner mb-6" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Tema da imagem</span>
              <div className="flex rounded-full border border-border overflow-hidden">
                <button onClick={() => setShareImageTheme("dark")} className={`px-4 py-1.5 text-xs font-medium transition-colors ${shareImageTheme === "dark" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  Escuro
                </button>
                <button onClick={() => setShareImageTheme("light")} className={`px-4 py-1.5 text-xs font-medium transition-colors ${shareImageTheme === "light" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  Claro
                </button>
              </div>
            </div>
            <Button onClick={() => handleSocialShare('save')} className="w-full bg-primary text-primary-foreground rounded-xl h-14 font-medium shadow-md transition-all" data-testid="button-share-reminder-image">
              <Share className="mr-2" size={20} />
              Compartilhar Imagem
            </Button>
          </div>
        </div>
      )}

      {isReportOpen && (() => {
        const now = new Date();
        const thisMonthCheckins = allCheckins.filter(c => {
          const d = new Date(c.createdAt);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
        return (
          <div className="fixed inset-0 z-[60] flex items-end justify-center">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setIsReportOpen(false)}
            />
            <div
              className="relative w-full max-w-md bg-card border border-border/50 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-400 flex flex-col"
              style={{ maxHeight: "92dvh" }}
            >
              {/* Header fixo */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
                <div>
                  <h3 className="text-xl font-serif text-foreground">Relatório Mensal</h3>
                  {monthlyReport.month && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{monthlyReport.month}</p>
                  )}
                </div>
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats + tags + insight — scrollável junto com os check-ins */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5 pb-8">

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary/30 p-3 rounded-xl text-center">
                    <FileText size={16} className="text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{monthlyReport.totalEntries}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Reflexões</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-xl text-center">
                    <Calendar size={16} className="text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{monthlyReport.activeDays}/{monthlyReport.totalDays}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Dias Ativos</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-xl text-center">
                    <TrendingUp size={16} className="text-primary mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{monthlyReport.totalWords}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Palavras</p>
                  </div>
                </div>

                {/* Temas frequentes */}
                {monthlyReport.topTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Temas mais frequentes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {monthlyReport.topTags.map((t: { tag: string; count: number }) => (
                        <span key={t.tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          #{t.tag} ({t.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insight */}
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-sm text-foreground leading-relaxed italic text-center">
                    "{monthlyReport.insight}"
                  </p>
                </div>

                {/* Check-ins do mês — detalhados */}
                {thisMonthCheckins.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Check-ins do mês · {thisMonthCheckins.length} registro{thisMonthCheckins.length !== 1 ? "s" : ""}
                    </p>
                    {thisMonthCheckins.map((c) => {
                      const moodInfo = moodIcons.find(m => m.id === c.mood);
                      const MoodIcon = moodInfo?.icon ?? Smile;
                      const dateObj = new Date(c.createdAt);
                      const dateLabel = format(dateObj, "d 'de' MMMM", { locale: ptBR });
                      const timeLabel = format(dateObj, "HH:mm", { locale: ptBR });
                      return (
                        <div key={c.id} className="bg-background border border-border/50 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{dateLabel}</span>
                            <span className="text-[10px] text-muted-foreground">{timeLabel}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <MoodIcon size={16} className="text-primary" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{moodInfo?.label ?? c.mood}</span>
                          </div>
                          {c.entry && c.entry.trim() && (
                            <p className="text-sm text-foreground/80 leading-relaxed pl-10">
                              "{c.entry.trim()}"
                            </p>
                          )}
                          {c.tags && c.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pl-10">
                              {c.tags.map((tag, ti) => (
                                <span key={ti} className="text-[10px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/15">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Weekly Summary Modal */}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsSummaryOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-400 flex flex-col"
            style={{ maxHeight: "90dvh" }}>

            {/* Header fixo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
              <div>
                <h3 className="text-xl font-serif text-foreground">Relatório de Humor</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{allCheckins.length} registro{allCheckins.length !== 1 ? "s" : ""} no total</p>
              </div>
              <button
                onClick={() => setIsSummaryOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumo rápido */}
            {weeklySummary && (
              <div className="px-6 py-4 border-b border-border/40 shrink-0">
                <div className="flex gap-3 flex-wrap">
                  {weeklySummary.counts.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-primary/5 rounded-full px-3 py-1">
                      <span className="text-xs font-semibold text-foreground">{item.label}</span>
                      <span className="text-xs text-primary font-bold">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de entradas scrollável */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3 pb-8">
              {allCheckins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum check-in registrado ainda.</p>
              ) : (
                allCheckins.map((c) => {
                  const moodInfo = moodIcons.find(m => m.id === c.mood);
                  const MoodIcon = moodInfo?.icon ?? Smile;
                  const dateObj = new Date(c.createdAt);
                  const dateLabel = format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
                  const timeLabel = format(dateObj, "HH:mm", { locale: ptBR });
                  return (
                    <div key={c.id} className="bg-background border border-border/50 rounded-2xl p-4 space-y-2">
                      {/* Data e hora */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{dateLabel}</span>
                        <span className="text-[10px] text-muted-foreground">{timeLabel}</span>
                      </div>
                      {/* Humor */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MoodIcon size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{moodInfo?.label ?? c.mood}</span>
                      </div>
                      {/* Contexto/motivo */}
                      {c.entry && c.entry.trim() && (
                        <p className="text-sm text-foreground/80 leading-relaxed pl-10">
                          "{c.entry.trim()}"
                        </p>
                      )}
                      {/* Tags */}
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pl-10">
                          {c.tags.map((tag, ti) => (
                            <span key={ti} className="text-[10px] bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/15">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral — shown only after user has engaged with content */}
      <ReferralCard
        hasEngaged={
          allCheckins.length > 0 ||
          (monthlyInsights?.entriesThisMonth || 0) > 0
        }
      />

      {/* Share Drawer Overlay */}
      {isShareOpen && (
        <div className="fixed inset-x-0 top-0 bottom-[64px] sm:bottom-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsShareOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl p-6 pt-8 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500 max-h-full overflow-y-auto">
            <button 
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-serif text-foreground mb-4">Compartilhar reflexão</h3>
            
            <canvas ref={reflectionPreviewRef} width={540} height={540} className="w-full aspect-square rounded-2xl border border-border/30 shadow-inner mb-6" />
            
            <div className="pt-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tema da imagem</span>
                <div className="flex rounded-full border border-border overflow-hidden">
                  <button onClick={() => setShareImageTheme("dark")} className={`px-4 py-1.5 text-xs font-medium transition-colors ${shareImageTheme === "dark" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                    Escuro
                  </button>
                  <button onClick={() => setShareImageTheme("light")} className={`px-4 py-1.5 text-xs font-medium transition-colors ${shareImageTheme === "light" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                    Claro
                  </button>
                </div>
              </div>
              <Button
                onClick={() => generateShareImage({
                  text: dailyReflection.text,
                  theme: shareImageTheme,
                  type: dailyReflection.type === "question" ? "question" : "reflection"
                })}
                className="w-full bg-primary text-primary-foreground rounded-xl h-14 font-medium shadow-md transition-all"
                data-testid="button-share-reflection-image"
              >
                <Share className="mr-2" size={20} />
                Compartilhar Imagem
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReflectionEditor && (
        <BlogReflectionEditor
          initialTitle={dailyReflection.text.substring(0, 50) + "..."}
          initialText={dailyReflection.text}
          origin={dailyReflection.fromBook ? "Do Livro 'Casa dos 20'" : `${dailyReflection.type === 'question' ? 'Pergunta' : 'Reflexão'} Diária`}
          topic={dailyReflection.text}
          showTitleEdit={true}
          onClose={() => setShowReflectionEditor(false)}
          onSave={async (title, content, tags) => {
            const finalTags = tags.length > 0 ? tags : [dailyReflection.type || 'reflexão'];
            if (user) {
              await createEntry.mutateAsync({ text: content, tags: finalTags, mood: mood || undefined });
            }
          }}
        />
      )}

    </div>
  );
}

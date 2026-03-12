import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PenLine, Share, Heart, Meh, Frown, Smile, X, Instagram, Twitter, Copy, Image as ImageIcon, Check, Hash, Sparkles, Moon, ChevronRight, BookOpen, Brain, BarChart3, Calendar, FileText, TrendingUp, Mic, Square } from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Onboarding from "@/components/Onboarding";
import { DAILY_REFLECTIONS } from "./Book";
import { getLastCheckIn, recommendContent, RecommendedContent, saveCheckIn, analyzeCheckIn } from "@/utils/intelligentRecommendation";
import { addNotification } from "@/utils/notificationService";
import BlogReflectionEditor from "@/components/BlogReflectionEditor";
import { generateShareImage, type ShareImageTheme } from "@/utils/shareImage";
import { useAuth } from "@/hooks/useAuth";
import { useCreateEntry } from "@/hooks/useJournal";
import { useCreateCheckin, useLatestCheckin } from "@/hooks/useCheckins";
import { useQuery } from "@tanstack/react-query";


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

// Shared Mock Entries (In a real app, this would come from a database/context)
const RECENT_JOURNAL_ENTRIES = [
  {
    id: 1,
    date: "Ontem",
    text: "Acho que estou me cobrando demais sobre onde eu deveria estar aos 25. Todo mundo parece ter um plano...",
    tags: ["ansiedade", "identidade"]
  },
  {
    id: 2,
    date: "12 de Março",
    text: "Hoje percebi que a solidão não precisa ser vazia. Foi bom ter um momento só para mim.",
    tags: ["solidão", "crescimento"]
  }
];

// Reminders mapped to themes
const THEMED_REMINDERS: Record<string, string[]> = {
  ansiedade: [
    "Respire. O futuro ainda não chegou e você não precisa resolver tudo hoje.",
    "Sua ansiedade é um sinal de que você se importa, mas ela não é uma previsão do futuro.",
    "Está tudo bem não estar bem o tempo todo. Acolha seu sentir."
  ],
  identidade: [
    "Você é muito mais do que suas conquistas ou o seu cargo. Sua essência é única.",
    "Não se compare com o palco dos outros. Sua jornada tem o seu próprio ritmo.",
    "A pessoa que você está se tornando é mais importante do que a que você costumava ser."
  ],
  solidão: [
    "A solitude é o encontro consigo mesmo. Aproveite esse espaço para se ouvir.",
    "Estar sozinho não significa estar desamparado. É um momento de recarregar.",
    "Sua própria companhia é preciosa. Cultive o amor por quem você é no silêncio."
  ],
  propósito: [
    "O propósito não é um destino, é a forma como você caminha todos os dias.",
    "Pequenas ações alinhadas com seus valores valem mais do que grandes metas vazias.",
    "Confie no processo. Suas buscas estão te levando exatamente onde você precisa estar."
  ],
  crescimento: [
    "Crescer dói, mas estagnar dói muito mais. Orgulhe-se de quão longe você chegou.",
    "Cada desafio superado é um degrau na construção da sua melhor versão.",
    "O amadurecimento é um processo lento. Seja gentil com o seu tempo."
  ]
};

const DEFAULT_REMINDERS = [
  "A transição para a vida adulta não é uma corrida. Respire.",
  "Cada pequena vitória merece ser celebrada hoje.",
  "Você está fazendo o melhor que pode com o que tem."
];

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const createEntry = useCreateEntry();
  const createCheckin = useCreateCheckin();
  const { data: latestCheckin } = useLatestCheckin();

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
    const hour = new Date().getHours();
    const displayName = user?.name || localStorage.getItem("casa-dos-20-user-name") || "";
    const nameStr = displayName ? `, ${displayName.split(' ')[0]}` : "";
    
    let g = "Bom dia";
    if (hour >= 12 && hour < 18) g = "Boa tarde";
    else if (hour >= 18 || hour < 5) g = "Boa noite";
    
    return { greeting: g, userName: nameStr };
  }, [user]);

  // Intelligent Reminder Selection
  const dailyReminder = useMemo(() => {
    // In a real app, RECENT_JOURNAL_ENTRIES would be dynamic state
    const latestEntry = RECENT_JOURNAL_ENTRIES[0];
    if (!latestEntry || !latestEntry.tags.length) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
      return DEFAULT_REMINDERS[dayOfYear % DEFAULT_REMINDERS.length];
    }

    // Pick a random tag from the latest entry and a random reminder for that tag
    const randomTag = latestEntry.tags[Math.floor(Math.random() * latestEntry.tags.length)];
    const options = THEMED_REMINDERS[randomTag] || DEFAULT_REMINDERS;
    return options[Math.floor(Math.random() * options.length)];
  }, []);

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
    
    addNotification({
      type: "journal",
      title: "✍️ Reflexão Guardada",
      message: "Sua entrada foi salva no diário com sucesso!",
    });

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

  const moodLabels: Record<string, string> = { "great": "Ótimo", "good": "Bem", "neutral": "Neutro", "bad": "Mal", "awful": "Péssimo" };

  const monthlyReport = useMemo(() => {
    if (!monthlyInsights) {
      return {
        totalEntries: 0,
        dominantTheme: "—",
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
    const topTag = monthlyInsights.topTags?.[0]?.tag || "—";
    const totalEntries = monthlyInsights.entriesThisMonth || 0;
    const activeDays = monthlyInsights.activeDays || 0;
    const totalDays = monthlyInsights.totalDays || 30;
    const mood = monthlyInsights.dominantMood;
    const moodLabel = mood ? (moodLabels[mood] || mood) : "—";
    const words = monthlyInsights.totalWords || 0;

    let insight = "";
    if (totalEntries === 0 && monthlyInsights.checkinsThisMonth === 0) {
      insight = "Você ainda não tem atividade este mês. Comece fazendo um check-in ou escrevendo uma reflexão!";
    } else {
      const parts = [];
      if (totalEntries > 0) parts.push(`Você escreveu ${totalEntries} reflexão(ões) com ${words} palavras`);
      if (monthlyInsights.checkinsThisMonth > 0) parts.push(`fez ${monthlyInsights.checkinsThisMonth} check-in(s)`);
      if (activeDays > 0) parts.push(`esteve ativo em ${activeDays} de ${totalDays} dias`);
      if (topTag !== "—") parts.push(`O tema "${topTag}" apareceu mais vezes`);
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
    const text = `"${dailyReminder}" - Casa dos 20`;
    const url = window.location.href;
    
    switch(platform) {
      case 'instagram':
        // For web stories, we can only really open the app or a share intent
        // Using a more standard share API if available, otherwise fallback
        if (navigator.share) {
          navigator.share({
            title: 'Casa dos 20',
            text: text,
            url: url,
          }).catch(console.error);
        } else {
          window.open(`https://www.instagram.com/reels/create/`, '_blank');
        }
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'substack':
        window.open(`https://substack.com/refer?link=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'save':
        generateShareImage({ text: dailyReminder, theme: shareImageTheme, type: "reminder" });
        break;
    }
  };

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
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const seed = dayOfYear + now.getHours();
    return options[seed % options.length];
  }, [mood]);

  if (showOnboarding) {
    return <Onboarding onComplete={() => {
      localStorage.removeItem("casa-dos-20-needs-onboarding");
      setShowOnboarding(false);
    }} />;
  }

  return (
    <div className="px-6 md:px-10 pt-12 pb-8 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
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

      {checkIns.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-2">
          <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="font-serif text-lg">Resumo Semanal</h3>
              </div>
              <button 
                onClick={() => setIsSummaryOpen(true)}
                className="text-[10px] font-bold text-primary underline uppercase tracking-wider"
              >
                Ver Detalhes
              </button>
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
      
      <section className="pt-6 border-t border-border/60">
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
        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            "{monthlyReport.insight}"
          </p>
        </div>
      </section>

      <section className="pt-6 border-t border-border/60">
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

      {/* Reminder Share Drawer */}
      {isReminderShareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsReminderShareOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl p-6 pt-8 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setIsReminderShareOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-serif text-foreground mb-4">Compartilhar Lembrete</h3>
            
            {/* Visual Preview */}
            <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-background to-secondary/30 p-8 flex flex-col items-center justify-center text-center border border-border/30 shadow-inner mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-noise opacity-[0.03]" />
              <div className="relative z-10 space-y-6">
                <Sparkles size={32} className="text-primary/40 mx-auto" />
                <p className="font-serif text-2xl leading-relaxed text-foreground px-4">
                  "{dailyReminder}"
                </p>
                <div className="pt-6">
                  <div className="h-px w-12 bg-primary/30 mx-auto mb-4" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Casa dos 20</p>
                  <p className="text-[9px] text-muted-foreground italic mt-1">Reflexões para a Vida Adulta</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button onClick={() => handleSocialShare('instagram')} className="flex flex-col items-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Instagram size={24} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Stories</span>
              </button>
              
              <button onClick={() => handleSocialShare('twitter')} className="flex flex-col items-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
                  <Twitter size={22} fill="currentColor" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">X (Twitter)</span>
              </button>
              
              <button onClick={() => handleSocialShare('substack')} className="flex flex-col items-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-[#FF6719] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM22.539 12.086H1.46v9.379l10.539-5.875 10.54 5.875v-9.379zM22.539 4.406H1.46V1.566h21.08v2.84z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Substack</span>
              </button>

              <button onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} className="flex flex-col items-center space-y-3 group">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-secondary text-foreground'}`}>
                  {copied ? <Check size={22} /> : <Copy size={22} />}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {copied ? 'Copiado!' : 'Copiar'}
                </span>
              </button>
            </div>

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
            <Button onClick={() => handleSocialShare('save')} className="w-full bg-primary text-primary-foreground rounded-xl h-14 font-medium shadow-md transition-all">
              <ImageIcon className="mr-2" size={20} />
              Salvar Imagem
            </Button>
          </div>
        </div>
      )}

      {isReportOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsReportOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsReportOpen(false)}
              className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BarChart3 size={28} className="text-primary" />
                </div>
                <h3 className="text-xl font-serif text-foreground">Relatório Mensal</h3>
                {monthlyReport.month && (
                  <p className="text-xs text-muted-foreground capitalize">{monthlyReport.month}</p>
                )}
              </div>

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

              {monthlyReport.checkinsThisMonth > 0 && (
                <div className="bg-secondary/20 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Humor — {monthlyReport.checkinsThisMonth} check-ins</p>
                  <div className="flex gap-1.5">
                    {Object.entries(monthlyReport.moodCounts).map(([mood, count]) => {
                      const total = monthlyReport.checkinsThisMonth;
                      const pct = total > 0 ? Math.round((count as number / total) * 100) : 0;
                      const moodEmojis: Record<string, string> = { great: "😊", good: "🙂", neutral: "😐", bad: "😞", awful: "😢" };
                      return (
                        <div key={mood} className="flex-1 text-center">
                          <div className="text-lg">{moodEmojis[mood] || "❓"}</div>
                          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-sm text-foreground leading-relaxed italic text-center">
                  "{monthlyReport.insight}"
                </p>
              </div>

              <Button 
                onClick={() => setIsReportOpen(false)}
                className="w-full bg-primary text-primary-foreground rounded-full h-11 font-medium text-sm"
              >
                Continuar Jornada
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Summary Modal */}
      {isSummaryOpen && weeklySummary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsSummaryOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsSummaryOpen(false)}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground">Sua Semana</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  Baseado nos seus check-ins, você tem se sentido predominantemente <span className="text-primary font-bold">{weeklySummary.predominant}</span>.
                </p>
              </div>

              <div className="space-y-6">
                {weeklySummary.counts.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
                      <span>{item.label}</span>
                      <span className="text-primary">{item.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 text-center">
                <p className="text-[10px] text-muted-foreground italic">
                  Seu estado emocional parece {weeklySummary.trend} no momento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Drawer Overlay */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsShareOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-border/50 rounded-t-3xl sm:rounded-3xl p-6 pt-8 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <h3 className="text-xl font-serif text-foreground mb-6">Compartilhar reflexão</h3>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button className="flex flex-col items-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Instagram size={24} />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Instagram</span>
              </button>
              
              <button className="flex flex-col items-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
                  <Twitter size={22} fill="currentColor" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">X (Twitter)</span>
              </button>
              
              <button className="flex flex-col items-center space-y-3 group">
                <div className="w-14 h-14 rounded-full bg-[#FF6719] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM22.539 12.086H1.46v9.379l10.539-5.875 10.54 5.875v-9.379zM22.539 4.406H1.46V1.566h21.08v2.84z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Substack</span>
              </button>

              <button onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} className="flex flex-col items-center space-y-3 group">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-secondary text-foreground'}`}>
                  {copied ? <Check size={22} /> : <Copy size={22} />}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                  {copied ? 'Copiado!' : 'Copiar'}
                </span>
              </button>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
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
                className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl h-14 font-medium transition-all"
              >
                <ImageIcon className="mr-2" size={20} />
                Gerar Imagem de Citação
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
            addNotification({
              type: "journal",
              title: "✍️ Pensamento Guardado",
              message: `"${title}" foi salvo com sucesso!`,
            });
          }}
        />
      )}
    </div>
  );
}

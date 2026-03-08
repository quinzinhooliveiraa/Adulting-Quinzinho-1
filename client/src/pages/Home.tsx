import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PenLine, Share, Heart, Meh, Frown, Smile, X, Instagram, Twitter, Copy, Image as ImageIcon, Check, Hash, Sparkles, Moon, ChevronRight, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Onboarding from "@/components/Onboarding";
import { DAILY_REFLECTIONS } from "./Book";

// Refletive Question Pool
const REFLECTION_QUESTIONS = [
  { id: 1, text: "Se você não precisasse provar nada a ninguém, o que estaria fazendo da sua vida agora?", theme: "Identidade" },
  { id: 2, text: "O que você tem evitado sentir ultimamente?", theme: "Ansiedade" },
  { id: 3, text: "Como você definiria 'sucesso' se o dinheiro não existisse?", theme: "Propósito" },
  { id: 4, text: "Qual foi a última vez que você se sentiu verdadeiramente em paz consigo mesmo?", theme: "Solidão" },
  { id: 5, text: "Você está vivendo a vida que escolheu ou a vida que esperam de você?", theme: "Identidade" },
  { id: 6, text: "O que o seu 'eu' de 10 anos atrás pensaria de quem você é hoje?", theme: "Crescimento" },
  { id: 7, text: "Qual a diferença entre a solidão que dói e a solitude que cura?", theme: "Solidão" },
  { id: 8, text: "Se você soubesse que vai dar certo, o que tentaria fazer hoje?", theme: "Incerteza" },
  { id: 9, text: "Em que relacionamentos você sente que pode ser 100% você mesmo?", theme: "Relações" },
  { id: 10, text: "O que você precisa perdoar em si mesmo para conseguir avançar?", theme: "Crescimento" }
];

// Simple mock logic for auto-tagging
const analyzeTextForTags = (text: string) => {
  const lowerText = text.toLowerCase();
  const foundTags = new Set<string>();
  
  if (lowerText.match(/medo|futuro|ansioso|ansiedade|preocupa|nervoso/)) foundTags.add("ansiedade");
  if (lowerText.match(/objetivo|sentido|carreira|trabalho|fazer da vida|propósito/)) foundTags.add("propósito");
  if (lowerText.match(/amor|namorado|namorada|relacionamento|casamento|amigo/)) foundTags.add("relações");
  if (lowerText.match(/eu mesmo|quem sou|minha essência|autêntico|identidade/)) foundTags.add("identidade");
  if (lowerText.match(/sozinho|solitário|solitude|solidão|isolado/)) foundTags.add("solidão");
  if (lowerText.match(/aprender|evoluir|mudar|crescer|melhorar|crescimento/)) foundTags.add("crescimento");
  if (lowerText.match(/não sei|dúvida|incerteza|confuso|perdido/)) foundTags.add("incerteza");

  return Array.from(foundTags).slice(0, 3); // Max 3 suggestions
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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("casa-dos-20-onboarding-complete");
  });
  const [mood, setMood] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [checkIns, setCheckIns] = useState<{id: string, time: string}[]>([]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isReminderShareOpen, setIsReminderShareOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const today = format(new Date(), "d 'de' MMMM", { locale: ptBR });

  // Time-based greeting and User Name
  const { greeting, userName } = useMemo(() => {
    const hour = new Date().getHours();
    const storedName = localStorage.getItem("casa-dos-20-user-name") || "";
    const nameStr = storedName ? `, ${storedName.split(' ')[0]}` : "";
    
    let g = "Bom dia";
    if (hour >= 12 && hour < 18) g = "Boa tarde";
    else if (hour >= 18 || hour < 5) g = "Boa noite";
    
    return { greeting: g, userName: nameStr };
  }, []);

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

  // Rotate daily question based on the day of the year
  const dailyQuestion = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % REFLECTION_QUESTIONS.length;
    return REFLECTION_QUESTIONS[index];
  }, []);

  // Daily reflection from the book
  const dailyReflectionFromBook = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % DAILY_REFLECTIONS.length;
    return DAILY_REFLECTIONS[index];
  }, []);

  const moodIcons = [
    { id: "terrible", icon: Frown, label: "Difícil" },
    { id: "bad", icon: Meh, label: "Ansioso" },
    { id: "neutral", icon: Smile, label: "Calmo" },
    { id: "good", icon: Heart, label: "Grato" },
    { id: "excited", icon: Sparkles, label: "Animado" },
    { id: "lonely", icon: Moon, label: "Solitário" },
  ];

  const handleMoodSelect = (id: string) => {
    const now = new Date();
    
    // Check if there's a check-in in the last 30 minutes
    if (checkIns.length > 0) {
      const lastCheckIn = new Date();
      const [hours, minutes] = checkIns[checkIns.length - 1].time.split(':');
      lastCheckIn.setHours(parseInt(hours), parseInt(minutes));
      
      const diffMs = now.getTime() - lastCheckIn.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 30) {
        // Just update current mood without adding new check-in
        setMood(id);
        const updatedCheckIns = [...checkIns];
        updatedCheckIns[updatedCheckIns.length - 1] = { id, time: format(now, "HH:mm") };
        setCheckIns(updatedCheckIns);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        return;
      }
    }

    setMood(id);
    const timeStr = format(now, "HH:mm");
    setCheckIns(prev => [...prev, { id, time: timeStr }]);
    
    // Auto-save logic for check-in
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) return;
    
    // Auto-select top suggested tags if none selected
    let finalTags = selectedTags;
    if (selectedTags.length === 0 && suggestedTags.length > 0) {
      finalTags = [suggestedTags[0]];
      setSelectedTags(finalTags);
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsReflecting(false);
      setIsSaved(false);
    }, 1500);
  };

  const monthlyReport = useMemo(() => {
    const totalEntries = RECENT_JOURNAL_ENTRIES.length + 5; 
    const dominantTheme = "Identidade";
    
    return {
      totalEntries,
      dominantTheme,
      insight: "Este mês você explorou profundamente sua Identidade. Suas reflexões mostram uma transição de ansiedade para uma calma mais consciente."
    };
  }, []);

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
        // Create a simple canvas and save as image
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1920;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#f0ebe3';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1a1410';
            ctx.font = 'bold 60px serif';
            ctx.textAlign = 'center';
            ctx.fillText('Casa dos 20', canvas.width / 2, 200);
            ctx.font = '40px serif';
            ctx.fillStyle = '#6b6048';
            const maxWidth = 900;
            const lineHeight = 60;
            let y = 400;
            const words = dailyReminder.split(' ');
            let line = '';
            for (let word of words) {
              const testLine = line + word + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxWidth) {
                ctx.fillText(line, canvas.width / 2, y);
                line = word + ' ';
                y += lineHeight;
              } else {
                line = testLine;
              }
            }
            ctx.fillText(line, canvas.width / 2, y);
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `casa-dos-20-${new Date().toISOString().split('T')[0]}.png`;
            link.click();
          }
        } catch (error) {
          console.error('Error saving image:', error);
        }
        break;
    }
  };

  if (showOnboarding) {
    return <Onboarding onComplete={() => {
      localStorage.setItem("casa-dos-20-onboarding-complete", "true");
      setShowOnboarding(false);
    }} />;
  }

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
    // Use day of year + hour to rotate tips
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const seed = dayOfYear + now.getHours();
    return options[seed % options.length];
  }, [mood, moodTips]);

  return (
    <div className="px-6 pt-12 pb-8 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
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
          {checkIns.length > 0 && (
            <div className="bg-secondary/50 p-2 rounded-xl text-[10px] font-medium text-primary border border-primary/10">
              {checkIns.length} check-ins hoje
            </div>
          )}
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
        <div className="grid grid-cols-3 gap-3">
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
        <section className="animate-in fade-in zoom-in duration-500">
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif text-foreground flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            Reflexão do Livro
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Casa dos 20</span>
        </div>

        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-3xl p-6 border border-amber-200/50 dark:border-amber-800/30 space-y-4">
          <p className="font-serif text-lg italic text-foreground/90 leading-relaxed">
            "{dailyReflectionFromBook.text}"
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-amber-200/30">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">— {dailyReflectionFromBook.author}</span>
            <button
              onClick={() => window.open('https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/', '_blank')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 underline"
            >
              Ler mais →
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-serif text-foreground flex items-center gap-2">
            Reflexão Diária
            <Sparkles size={14} className="text-primary opacity-60" />
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-md">
            {dailyQuestion.theme}
          </span>
        </div>
        
        <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <PenLine size={120} />
          </div>
          
          <div className="relative z-10 space-y-6">
            <p className="font-serif text-xl md:text-2xl reading-text text-foreground">
              "{dailyQuestion.text}"
            </p>
            
            {!isReflecting && !reflectionText && (
              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  onClick={() => setIsReflecting(true)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]"
                >
                  <PenLine className="mr-2" size={18} />
                  Escrever sobre isso
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
                    className="min-h-[160px] bg-background/50 border-border/80 focus:border-primary/50 focus:ring-primary/20 rounded-2xl p-4 text-base resize-none font-serif leading-relaxed placeholder:font-sans placeholder:text-sm"
                    autoFocus={isReflecting}
                  />
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

            <Button onClick={() => handleSocialShare('save')} className="w-full bg-primary text-primary-foreground rounded-xl h-14 font-medium shadow-md transition-all">
              <ImageIcon className="mr-2" size={20} />
              Salvar Imagem
            </Button>
          </div>
        </div>
      )}

      {/* Monthly Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsReportOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsReportOpen(false)}
              className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-foreground bg-secondary/50 rounded-full"
            >
              <X size={18} />
            </button>
            
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground">Insight do Mês</h3>
                <p className="text-sm text-muted-foreground leading-relaxed px-4">
                  Uma análise profunda das suas <strong>{monthlyReport.totalEntries} reflexões</strong> e check-ins.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-4 rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Tema Principal</p>
                  <p className="text-sm font-bold text-primary">{monthlyReport.dominantTheme}</p>
                </div>
                <div className="bg-secondary/30 p-4 rounded-2xl text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Evolução</p>
                  <p className="text-sm font-bold text-primary">+12% calma</p>
                </div>
              </div>

              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                <p className="text-sm text-foreground leading-relaxed italic text-center">
                  "{monthlyReport.insight}"
                </p>
              </div>

              <Button 
                onClick={() => setIsReportOpen(false)}
                className="w-full bg-primary text-primary-foreground rounded-full h-12 font-medium"
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

            <div className="pt-6 border-t border-border">
              <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl h-14 font-medium transition-all">
                <ImageIcon className="mr-2" size={20} />
                Gerar Imagem de Citação
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

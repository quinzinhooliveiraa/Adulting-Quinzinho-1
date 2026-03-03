import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PenLine, Share, Heart, Meh, Frown, Smile, X, Instagram, Twitter, Copy, Image as ImageIcon, Check, Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [mood, setMood] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Sharing Drawer State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const today = format(new Date(), "d 'de' MMMM", { locale: ptBR });

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

  const moodIcons = [
    { id: "terrible", icon: Frown, label: "Difícil" },
    { id: "bad", icon: Meh, label: "Ansioso" },
    { id: "neutral", icon: Smile, label: "Calmo" },
    { id: "good", icon: Heart, label: "Grato" },
  ];

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

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

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

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 pt-12 pb-8 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-muted-foreground font-sans">
          {today}
        </p>
        <h1 className="text-3xl text-foreground font-serif leading-tight">
          Bom dia. <br/>
          Como você está hoje?
        </h1>
      </header>

      <section className="flex justify-between items-center bg-card rounded-2xl p-4 shadow-sm border border-border/50">
        {moodIcons.map((m) => {
          const Icon = m.icon;
          const isActive = mood === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className="flex flex-col items-center space-y-2"
              data-testid={`mood-${m.id}`}
            >
              <div className={`p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-primary-foreground scale-110 shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {m.label}
              </span>
            </button>
          );
        })}
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
        <h2 className="text-lg font-serif text-foreground mb-4">Lembrete do dia</h2>
        <p className="text-muted-foreground reading-text text-sm md:text-base">
          {dailyReminder}
        </p>
      </section>

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

              <button onClick={handleCopy} className="flex flex-col items-center space-y-3 group">
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

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Users, User, ChevronLeft, RotateCcw, Share2, Bookmark, ArrowRight,
  Heart, UserPlus, Home as HomeIcon, Wifi, MapPin, Crown, Sparkles,
  PenLine, X, Lock, Send, Copy, Check, Loader2
} from "lucide-react";
import { addNotification } from "@/utils/notificationService";
import { useCreateEntry } from "@/hooks/useJournal";
import { useAuth } from "@/hooks/useAuth";

const SOLO_THEMES = {
  identity: {
    title: "Identidade",
    emoji: "🎭",
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    questions: [
      "Se você não precisasse provar nada a ninguém, o que estaria fazendo?",
      "Você está vivendo a vida que escolheu ou a que esperavam de você?",
      "Qual parte de você que você esconde das pessoas?",
      "Se pudesse recomeçar, faria as mesmas escolhas?",
      "O que te define quando ninguém está olhando?",
      "Qual máscara você mais usa no dia a dia?",
      "Quando foi a última vez que você se sentiu 100% autêntico?",
      "Que versão de você mesmo te assusta?",
    ],
  },
  purpose: {
    title: "Propósito",
    emoji: "🧭",
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    questions: [
      "Como você definiria sucesso sem usar dinheiro na definição?",
      "O que te faria pular da cama todas as manhãs?",
      "Se tivesse apenas 5 anos de vida, o que mudaria hoje?",
      "Qual é o legado que você quer deixar?",
      "Você está correndo atrás do seu sonho ou fugindo de um medo?",
      "O que você faria se soubesse que não ia falhar?",
      "Qual talento seu você está desperdiçando?",
      "O que te dá inveja revela o que você realmente quer?",
    ],
  },
  relationships: {
    title: "Relações",
    emoji: "🤍",
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    questions: [
      "Em que relacionamentos você é 100% você mesmo?",
      "Qual conversa você está evitando ter?",
      "O que você precisa ouvir mas ninguém te diz?",
      "Quem você seria se nunca tivesse conhecido a pessoa mais importante da sua vida?",
      "Você ama ou tem medo de ficar sozinho?",
      "Qual ferida antiga ainda controla seus relacionamentos?",
      "O que você pede dos outros que não dá para si mesmo?",
      "Se pudesse dizer uma verdade para alguém sem consequências, o que diria?",
    ],
  },
  uncertainty: {
    title: "Incerteza",
    emoji: "🌫️",
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    questions: [
      "Se soubesse que vai dar certo, o que tentaria?",
      "Qual é o pior cenário que você imagina e ele é realista?",
      "O que você ganharia se parasse de controlar tudo?",
      "Qual decisão você está adiando por medo?",
      "O que o caos pode te ensinar que a ordem não pode?",
      "Quando a última vez que você se jogou sem rede de segurança?",
      "O que é pior: tentar e falhar ou nunca tentar?",
      "Que certeza você precisa largar para crescer?",
    ],
  },
  growth: {
    title: "Crescimento",
    emoji: "🌱",
    color: "from-lime-500 to-green-600",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
    questions: [
      "Que dor você precisa aceitar para evoluir?",
      "Qual hábito está te impedindo de ser quem você quer ser?",
      "O que a versão de você daqui a 10 anos diria para você hoje?",
      "Qual é a mentira que você mais conta para si mesmo?",
      "O que você precisa desaprender?",
      "Quando foi a última vez que você fez algo pela primeira vez?",
      "Que medo, se superado, mudaria tudo na sua vida?",
      "Você está crescendo ou apenas ficando mais velho?",
    ],
  },
  solitude: {
    title: "Solidão",
    emoji: "🌙",
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    questions: [
      "Você gosta da sua própria companhia ou apenas a tolera?",
      "O que o silêncio te diz quando você finalmente para?",
      "Qual é a diferença entre estar sozinho e se sentir só?",
      "O que você descobre sobre si mesmo quando ninguém está por perto?",
      "Você busca pessoas por conexão ou por medo do vazio?",
      "Qual pensamento aparece quando você não tem distrações?",
      "A solidão é sua amiga ou sua inimiga?",
      "O que falta na sua relação consigo mesmo?",
    ],
  },
};

const CONVERSATION_QUESTIONS: Record<string, { title: string; emoji: string; color: string; questions: string[] }> = {
  amigos: {
    title: "Entre Amigos",
    emoji: "🤝",
    color: "from-sky-500 to-blue-600",
    questions: [
      "Qual é a coisa mais difícil que você já passou e nunca contou pra gente?",
      "Se você pudesse mudar uma coisa na nossa amizade, o que seria?",
      "Quando foi a última vez que eu te decepcionei sem saber?",
      "O que você admira em mim que nunca disse?",
      "Qual é o seu maior medo que seus amigos não sabem?",
      "Se a gente se conhecesse hoje, você acha que seríamos amigos?",
      "O que você gostaria que eu te perguntasse mais?",
      "Qual conselho meu você ignorou e se arrependeu?",
      "O que te incomoda em mim mas você nunca falou?",
      "Se pudesse voltar no tempo, mudaria algum momento nosso?",
      "Você sente que pode ser 100% você mesmo com a gente?",
      "Qual é a mentira mais boba que você já contou pra gente?",
    ],
  },
  casal: {
    title: "Casal",
    emoji: "💕",
    color: "from-rose-500 to-pink-600",
    questions: [
      "O que eu faço que te faz sentir mais amado(a)?",
      "Qual é o seu maior medo sobre nós dois?",
      "O que você sente falta de quando começamos a namorar?",
      "Se pudesse mudar uma coisa em mim, o que seria?",
      "Qual foi o momento que você mais sentiu orgulho de nós?",
      "O que você precisa de mim que tem medo de pedir?",
      "Como você se imagina daqui a 10 anos comigo?",
      "Qual foi a vez que mais te machuquei sem perceber?",
      "O que te faz duvidar de nós?",
      "Se pudesse reviver um momento nosso, qual seria?",
      "O que você acha que falta na nossa relação?",
      "Qual é a coisa mais difícil de amar em mim?",
    ],
  },
  pais: {
    title: "Com Pai/Mãe",
    emoji: "🏠",
    color: "from-amber-500 to-orange-600",
    questions: [
      "Qual foi o momento mais difícil de ser pai/mãe?",
      "O que você gostaria de ter feito diferente na minha criação?",
      "Qual foi o dia mais feliz que eu te proporcionei?",
      "O que você mais admira em mim?",
      "Qual conselho você gostaria de ter recebido na minha idade?",
      "O que te preocupa sobre o meu futuro?",
      "Quando você percebeu que eu tinha crescido?",
      "O que você gostaria que eu soubesse sobre a sua juventude?",
      "Qual foi o maior sacrifício que fez por mim?",
      "O que você espera da nossa relação daqui pra frente?",
    ],
  },
  irmaos: {
    title: "Com Irmão(ã)",
    emoji: "👫",
    color: "from-teal-500 to-cyan-600",
    questions: [
      "Qual é a memória de infância mais marcante que temos juntos?",
      "Você acha que nossos pais trataram a gente de forma igual?",
      "O que você admira em mim que nunca falou?",
      "Qual é a coisa mais irritante que eu faço?",
      "Se pudesse mudar algo na nossa relação, o que seria?",
      "Você sente que me conhece de verdade?",
      "Qual foi o momento que mais precisou de mim?",
      "O que você aprendeu comigo sem perceber?",
      "Qual segredo de infância você nunca contou?",
      "Como você quer que nossa relação seja quando formos mais velhos?",
    ],
  },
  avos: {
    title: "Com Avô/Avó",
    emoji: "🫶",
    color: "from-purple-500 to-violet-600",
    questions: [
      "Qual foi o melhor conselho que já recebeu na vida?",
      "Como era o amor na sua época?",
      "Qual foi o dia mais feliz da sua vida?",
      "O que você gostaria que a minha geração soubesse?",
      "Qual foi a decisão mais corajosa que já tomou?",
      "O que te dá mais orgulho na nossa família?",
      "Qual foi o maior desafio que enfrentou?",
      "O que mudou mais no mundo desde a sua juventude?",
      "Qual lição você aprendeu tarde demais?",
      "O que você deseja para o meu futuro?",
    ],
  },
  tios: {
    title: "Com Tio(a)",
    emoji: "🤗",
    color: "from-orange-500 to-red-600",
    questions: [
      "Como era o meu pai/minha mãe quando era mais novo(a)?",
      "Qual é a história mais engraçada da família que eu não conheço?",
      "O que você aprendeu com a vida que gostaria de ter sabido antes?",
      "Qual foi o momento mais marcante da sua vida?",
      "Como era a relação de vocês quando crianças?",
      "O que você acha que nossa família faz de especial?",
      "Qual foi o seu maior arrependimento?",
      "O que você deseja para os mais novos da família?",
      "Qual tradição de família você gostaria que nunca morresse?",
      "Se pudesse dar um conselho pro seu eu de 20 anos, qual seria?",
    ],
  },
  primos: {
    title: "Com Primo(a)",
    emoji: "✌️",
    color: "from-cyan-500 to-blue-600",
    questions: [
      "Qual é a memória mais marcante que temos juntos?",
      "Você acha que somos parecidos em alguma coisa?",
      "O que você queria ser quando era criança?",
      "Qual foi o momento mais difícil da sua vida até agora?",
      "Se a gente morasse na mesma cidade, o que faria diferente?",
      "O que você aprendeu com sua família que eu posso não ter aprendido com a minha?",
      "Qual é o seu sonho mais maluco?",
      "Você sente que nossa geração está melhor ou pior que a dos nossos pais?",
      "O que te faz mais orgulho de ser da nossa família?",
      "Qual é a coisa que você mais quer na vida agora?",
    ],
  },
  familia_toda: {
    title: "Família Toda",
    emoji: "🏡",
    color: "from-yellow-500 to-amber-600",
    questions: [
      "Qual é a tradição de família que mais te marca?",
      "Se pudesse reviver um momento em família, qual seria?",
      "O que cada um aqui fez que te marcou pra sempre?",
      "Qual é o maior orgulho de ser dessa família?",
      "O que você gostaria que mudasse na nossa dinâmica?",
      "Qual é a história de família que você mais gosta de contar?",
      "O que você aprendeu com essa família que leva pra vida?",
      "Se pudesse agradecer uma coisa a cada pessoa aqui, o que seria?",
      "Qual é o valor mais importante que essa família te passou?",
      "Como você imagina as reuniões de família daqui a 20 anos?",
      "O que falta nas nossas conversas no dia a dia?",
      "Se essa família fosse um time, qual seria o superpoder de cada um?",
    ],
  },
};

type SoloThemeId = keyof typeof SOLO_THEMES;
type RelationType = keyof typeof CONVERSATION_QUESTIONS;
type GameMode = "sozinho" | "conversa";
type ConversaType = "presencial" | "online";

function AnswerSheet({
  question,
  onClose,
  onSaved,
}: {
  question: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const createEntry = useCreateEntry();

  const handleSave = async () => {
    if (!answer.trim()) return;
    const text = `**Pergunta:** ${question}\n\n**Resposta:** ${answer}`;
    try {
      await createEntry.mutateAsync({
        text,
        tags: ["perguntas", "reflexão"],
      });
      onSaved();
      addNotification({
        type: "journal",
        title: "Reflexão salva",
        message: "Sua resposta foi guardada no diário.",
      });
    } catch {
      addNotification({
        type: "journal",
        title: "Erro",
        message: "Não foi possível salvar. Tente novamente.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-t-3xl border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Sua reflexão</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <p className="text-sm text-muted-foreground font-serif italic leading-relaxed">
            "{question}"
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            className="w-full min-h-[120px] p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
            data-testid="textarea-answer"
          />
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={!answer.trim() || createEntry.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-save-answer"
          >
            <Send size={16} />
            {createEntry.isPending ? "Salvando..." : "Salvar no Diário"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CardGame({
  questions,
  title,
  emoji,
  color,
  subtitle,
  onBack,
  weightedMode,
  allowAnswer,
}: {
  questions: string[];
  title: string;
  emoji: string;
  color: string;
  subtitle: string;
  onBack: () => void;
  weightedMode?: boolean;
  allowAnswer?: boolean;
}) {
  const sessionKey = `casa-dos-20-seen-${title}`;

  const [seenIndices, setSeenIndices] = useState<number[]>(() => {
    if (!weightedMode) return [];
    try {
      const stored = localStorage.getItem(sessionKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const getNextCard = useCallback(() => {
    if (!weightedMode) return null;
    const unseen = questions.map((_, i) => i).filter(i => !seenIndices.includes(i));
    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)];
    }
    return Math.floor(Math.random() * questions.length);
  }, [weightedMode, seenIndices, questions]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (weightedMode) {
      const unseen = questions.map((_, i) => i).filter(i => !seenIndices.includes(i));
      if (unseen.length > 0) return unseen[Math.floor(Math.random() * unseen.length)];
      return 0;
    }
    return 0;
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedCards, setSavedCards] = useState<number[]>([]);
  const [cardsPlayed, setCardsPlayed] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const markSeen = (idx: number) => {
    if (weightedMode && !seenIndices.includes(idx)) {
      const updated = [...seenIndices, idx];
      setSeenIndices(updated);
      localStorage.setItem(sessionKey, JSON.stringify(updated));
    }
  };

  const handleNext = () => {
    markSeen(currentIndex);
    const played = cardsPlayed + 1;
    setCardsPlayed(played);

    if (weightedMode) {
      setIsFlipped(false);
      setTimeout(() => {
        const next = getNextCard();
        if (next !== null) setCurrentIndex(next);
      }, 200);
    } else {
      if (currentIndex < questions.length - 1) {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
      } else {
        setShowCompleted(true);
      }
    }
  };

  const handleSave = () => {
    if (!savedCards.includes(currentIndex)) {
      setSavedCards([...savedCards, currentIndex]);
      addNotification({
        type: "journal",
        title: "Carta Salva",
        message: "Pergunta salva para reflexão futura.",
      });
    }
  };

  const handleShare = () => {
    const text = `"${questions[currentIndex]}" — Casa dos 20`;
    if (navigator.share) {
      navigator.share({ title: "Casa dos 20", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      addNotification({
        type: "journal",
        title: "Copiado",
        message: "Pergunta copiada para a área de transferência.",
      });
    }
  };

  const totalForProgress = questions.length;
  const progressValue = weightedMode
    ? Math.min(seenIndices.length + 1, totalForProgress)
    : currentIndex + 1;

  if (showCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="text-6xl mb-6">{emoji}</div>
        <h2 className="text-2xl font-serif text-foreground mb-2">Rodada Completa!</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Você explorou {questions.length} perguntas de {title}.
          {savedCards.length > 0 && ` ${savedCards.length} foram salvas.`}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
              setCardsPlayed(0);
              setShowCompleted(false);
            }}
            className="w-full p-4 bg-primary text-primary-foreground rounded-2xl font-medium flex items-center justify-center gap-2"
            data-testid="button-replay"
          >
            <RotateCcw size={18} /> Jogar Novamente
          </button>
          <button
            onClick={onBack}
            className="w-full p-4 bg-muted text-foreground rounded-2xl font-medium"
            data-testid="button-back-categories"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted" data-testid="button-back">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            {subtitle}
          </p>
          <p className="text-xs text-foreground font-medium">
            {weightedMode ? `${seenIndices.length}/${questions.length} vistas` : `${currentIndex + 1} / ${questions.length}`}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="w-full px-6 mb-3">
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
            style={{ width: `${(progressValue / totalForProgress) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-6 flex flex-col items-center justify-center" style={{ minHeight: "55vh" }}>
        <div
          className="w-full max-w-sm cursor-pointer"
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
          data-testid="card-question"
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              aspectRatio: "3/4",
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${color} shadow-2xl flex flex-col items-center justify-center p-8`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-7xl mb-6 opacity-30">{emoji}</div>
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">
                Casa dos 20
              </p>
              <h3 className="text-white text-xl font-serif text-center">{title}</h3>
              <p className="text-white/50 text-xs mt-6">Toque para revelar</p>
            </div>

            <div
              className="absolute inset-0 rounded-3xl bg-background border-2 border-border shadow-2xl flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="text-3xl mb-6">{emoji}</div>
              <p className="text-foreground font-serif text-xl text-center leading-relaxed">
                "{questions[currentIndex]}"
              </p>
              <p className="text-muted-foreground text-xs mt-6 uppercase tracking-widest">
                {title}
              </p>
            </div>
          </div>
        </div>

        {isFlipped && (
          <div className="flex gap-3 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {allowAnswer && (
              <button
                onClick={() => setShowAnswer(true)}
                className="p-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                data-testid="button-answer-card"
                title="Responder"
              >
                <PenLine size={20} />
              </button>
            )}
            <button
              onClick={handleSave}
              className={`p-3 rounded-full border transition-colors ${
                savedCards.includes(currentIndex)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
              data-testid="button-save-card"
            >
              <Bookmark size={20} fill={savedCards.includes(currentIndex) ? "currentColor" : "none"} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              data-testid="button-share-card"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={handleNext}
              className={`px-6 py-3 rounded-full bg-gradient-to-r ${color} text-white font-medium flex items-center gap-2 shadow-lg`}
              data-testid="button-next-card"
            >
              {weightedMode ? (
                <>Sortear <Sparkles size={16} /></>
              ) : currentIndex < questions.length - 1 ? (
                <>Próxima <ArrowRight size={16} /></>
              ) : (
                "Finalizar"
              )}
            </button>
          </div>
        )}
      </div>

      {showAnswer && (
        <AnswerSheet
          question={questions[currentIndex]}
          onClose={() => setShowAnswer(false)}
          onSaved={() => setShowAnswer(false)}
        />
      )}
    </div>
  );
}

function FamilyMemberSelect({ onSelect, onBack }: { onSelect: (member: RelationType) => void; onBack: () => void }) {
  const members: { id: RelationType; icon: typeof HomeIcon; label: string; desc: string }[] = [
    { id: "pais", icon: Crown, label: "Pai / Mãe", desc: "Conversas entre gerações" },
    { id: "irmaos", icon: UserPlus, label: "Irmão(ã)", desc: "Quem cresceu com você" },
    { id: "avos", icon: Heart, label: "Avô / Avó", desc: "Sabedoria e memórias" },
    { id: "tios", icon: Users, label: "Tio(a)", desc: "Histórias e conselhos" },
    { id: "primos", icon: Sparkles, label: "Primo(a)", desc: "Mesma geração, outros caminhos" },
    { id: "familia_toda", icon: HomeIcon, label: "Família Toda", desc: "Jogo em conjunto" },
  ];

  return (
    <div className="px-6 pt-12 pb-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-family">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-serif text-foreground">Com quem?</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha o membro ou jogue com a família toda.</p>
      </div>
      <div className="space-y-2.5">
        {members.map((m) => {
          const Icon = m.icon;
          const data = CONVERSATION_QUESTIONS[m.id];
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="w-full p-4 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors flex items-center gap-4 text-left active:scale-[0.98]"
              data-testid={`button-family-${m.id}`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center shadow-sm`}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">{data.questions.length}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RelationSelect({
  conversaType,
  onSelect,
  onBack,
}: {
  conversaType: ConversaType;
  onSelect: (relation: RelationType) => void;
  onBack: () => void;
}) {
  const [showFamily, setShowFamily] = useState(false);

  if (showFamily) {
    return <FamilyMemberSelect onSelect={onSelect} onBack={() => setShowFamily(false)} />;
  }

  const relations: { id: RelationType | "familia"; icon: typeof Users; label: string; desc: string; isGroup?: boolean }[] = [
    { id: "amigos", icon: Users, label: "Amigos", desc: "Fortaleça laços com verdade" },
    { id: "casal", icon: Heart, label: "Casal", desc: "Aprofunde a conexão a dois" },
    { id: "familia", icon: HomeIcon, label: "Família", desc: "Pai, mãe, irmão, primo, tio...", isGroup: true },
  ];

  return (
    <div className="px-6 pt-12 pb-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-relation">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-serif text-foreground">
          {conversaType === "presencial" ? "Jogo Presencial" : "Jogo Online"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Com quem você quer conversar?</p>
      </div>
      <div className="space-y-3">
        {relations.map((r) => {
          const Icon = r.icon;
          const data = r.id !== "familia" ? CONVERSATION_QUESTIONS[r.id] : null;
          return (
            <button
              key={r.id}
              onClick={() => {
                if (r.isGroup) {
                  setShowFamily(true);
                } else {
                  onSelect(r.id as RelationType);
                }
              }}
              className="w-full p-4 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-colors flex items-center gap-4 text-left active:scale-[0.98]"
              data-testid={`button-relation-${r.id}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data ? data.color : "from-yellow-500 to-amber-600"} flex items-center justify-center shadow-sm`}>
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              {data && <span className="text-xs text-muted-foreground">{data.questions.length} cartas</span>}
              {r.isGroup && <ChevronLeft size={16} className="text-muted-foreground rotate-180" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PremiumGate({ onBack }: { onBack: () => void }) {
  return (
    <div className="px-6 pt-12 pb-8 flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg">
        <Lock size={28} className="text-white" />
      </div>
      <h1 className="text-2xl font-serif text-foreground text-center mb-2">Modo Cartas Premium</h1>
      <p className="text-sm text-muted-foreground text-center max-w-[280px] leading-relaxed mb-8">
        O modo de cartas é exclusivo para assinantes. Desbloqueie perguntas profundas para jogar sozinho ou com quem importa.
      </p>
      <div className="w-full max-w-xs space-y-3">
        <button
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium text-sm shadow-lg"
          data-testid="button-subscribe"
        >
          Assinar Premium
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl bg-muted text-foreground font-medium text-sm"
          data-testid="button-back-premium"
        >
          Voltar
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-6 text-center max-w-[240px]">
        Se alguém premium te convidou, entre pelo link que recebeu para jogar junto.
      </p>
    </div>
  );
}

function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef<((msg: any) => void)[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/lobby`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handlersRef.current.forEach(h => h(msg));
      } catch {}
    };
    wsRef.current = ws;
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const onMessage = useCallback((handler: (msg: any) => void) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter(h => h !== handler);
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { connect, send, onMessage, disconnect, connected };
}

interface LobbyPlayer {
  name: string;
  id: string;
  isHost: boolean;
}

function LobbyScreen({
  mode,
  relation,
  questions,
  questionData,
  onBack,
  userName,
}: {
  mode: ConversaType;
  relation: RelationType;
  questions: string[];
  questionData: { title: string; emoji: string; color: string };
  onBack: () => void;
  userName: string;
}) {
  const [screen, setScreen] = useState<"choice" | "create" | "join" | "waiting" | "game">("choice");
  const [lobbyCode, setLobbyCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [myId, setMyId] = useState("");
  const [error, setError] = useState("");
  const [currentTurn, setCurrentTurn] = useState("");
  const [currentTurnName, setCurrentTurnName] = useState("");
  const [currentCard, setCurrentCard] = useState(-1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const { connect, send, onMessage, disconnect } = useWebSocket();

  useEffect(() => {
    connect();
    const unsub = onMessage((msg) => {
      if (msg.type === "created") {
        setLobbyCode(msg.code);
        setMyId(msg.playerId);
        setPlayers(msg.players);
        setScreen("waiting");
      }
      if (msg.type === "joined") {
        setLobbyCode(msg.code);
        setMyId(msg.playerId);
        setPlayers(msg.players);
        setScreen("waiting");
      }
      if (msg.type === "player_joined" || msg.type === "player_left") {
        setPlayers(msg.players);
      }
      if (msg.type === "game_started") {
        setPlayers(msg.players);
        setCurrentTurn(msg.currentTurn);
        setCurrentTurnName(msg.currentTurnName);
        setCurrentCard(msg.currentCard);
        setIsFlipped(false);
        setScreen("game");
      }
      if (msg.type === "new_card") {
        setCurrentTurn(msg.currentTurn);
        setCurrentTurnName(msg.currentTurnName);
        setCurrentCard(msg.currentCard);
        setIsFlipped(false);
      }
      if (msg.type === "error") {
        setError(msg.message);
      }
    });
    return () => { unsub(); disconnect(); };
  }, []);

  const handleCreate = () => {
    send({ type: "create", name: userName, mode, relation });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    setError("");
    send({ type: "join", name: userName, code: joinCode.toUpperCase() });
  };

  const handleStart = () => {
    send({ type: "start", totalCards: questions.length });
  };

  const handleNextCard = () => {
    send({ type: "next_card", totalCards: questions.length });
  };

  const handleLeave = () => {
    send({ type: "leave" });
    disconnect();
    onBack();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = players.find(p => p.id === myId)?.isHost || false;
  const isMyTurn = currentTurn === myId;

  if (screen === "game") {
    const cardIndex = Math.max(0, Math.min(currentCard, questions.length - 1));

    return (
      <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
        <div className="px-6 pt-8 pb-4 flex items-center justify-between">
          <button onClick={handleLeave} className="p-2 -ml-2 rounded-full hover:bg-muted" data-testid="button-leave-game">
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              {mode === "online" ? "Online" : "Presencial"} — {lobbyCode}
            </p>
            <p className="text-xs text-foreground font-medium">
              {players.length} jogadores
            </p>
          </div>
          <div className="w-10" />
        </div>

        <div className="px-6 mb-4">
          <div className={`p-3 rounded-xl text-center ${isMyTurn ? "bg-primary/10 border border-primary/20" : "bg-muted/50 border border-border"}`}>
            <p className="text-xs text-muted-foreground mb-0.5">Vez de</p>
            <p className={`text-sm font-medium ${isMyTurn ? "text-primary" : "text-foreground"}`}>
              {isMyTurn ? "Você!" : currentTurnName}
            </p>
          </div>
        </div>

        <div className="px-6 flex flex-col items-center justify-center" style={{ minHeight: "50vh" }}>
          <div
            className="w-full max-w-sm cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={() => setIsFlipped(!isFlipped)}
            data-testid="card-lobby-question"
          >
            <div
              className="relative w-full transition-transform duration-500"
              style={{
                aspectRatio: "3/4",
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${questionData.color} shadow-2xl flex flex-col items-center justify-center p-8`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="text-7xl mb-6 opacity-30">{questionData.emoji}</div>
                <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">Casa dos 20</p>
                <h3 className="text-white text-xl font-serif text-center">{questionData.title}</h3>
                <p className="text-white/50 text-xs mt-6">Toque para revelar</p>
              </div>
              <div
                className="absolute inset-0 rounded-3xl bg-background border-2 border-border shadow-2xl flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="text-3xl mb-6">{questionData.emoji}</div>
                <p className="text-foreground font-serif text-xl text-center leading-relaxed">
                  "{questions[cardIndex]}"
                </p>
                <p className="text-muted-foreground text-xs mt-6 uppercase tracking-widest">
                  {questionData.title}
                </p>
              </div>
            </div>
          </div>

          {isFlipped && (
            <div className="flex gap-3 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {mode === "online" && (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="p-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  data-testid="button-answer-lobby"
                >
                  <PenLine size={20} />
                </button>
              )}
              <button
                onClick={() => {
                  const text = `"${questions[cardIndex]}" — Casa dos 20`;
                  if (navigator.share) {
                    navigator.share({ title: "Casa dos 20", text }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(text);
                  }
                }}
                className="p-3 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                data-testid="button-share-lobby"
              >
                <Share2 size={20} />
              </button>
              {(isMyTurn || isHost) && (
                <button
                  onClick={handleNextCard}
                  className={`px-6 py-3 rounded-full bg-gradient-to-r ${questionData.color} text-white font-medium flex items-center gap-2 shadow-lg`}
                  data-testid="button-next-lobby"
                >
                  Sortear <Sparkles size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-6 mt-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {players.map((p) => (
              <div
                key={p.id}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium shrink-0 ${
                  p.id === currentTurn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p.name} {p.isHost ? "👑" : ""}
              </div>
            ))}
          </div>
        </div>

        {showAnswer && (
          <AnswerSheet
            question={questions[cardIndex]}
            onClose={() => setShowAnswer(false)}
            onSaved={() => setShowAnswer(false)}
          />
        )}
      </div>
    );
  }

  if (screen === "waiting") {
    return (
      <div className="px-6 pt-12 pb-8 space-y-6 animate-in fade-in duration-500">
        <div>
          <button onClick={handleLeave} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-leave-lobby">
            <ChevronLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-serif text-foreground">Sala de Espera</h1>
          <p className="text-sm text-muted-foreground mt-1">Compartilhe o código para outros entrarem.</p>
        </div>

        <div className="p-6 rounded-2xl bg-muted/50 border border-border text-center space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Código da Sala</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-4xl font-mono font-bold text-foreground tracking-[0.3em]">{lobbyCode}</p>
            <button
              onClick={copyCode}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              data-testid="button-copy-code"
            >
              {copiedCode ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-muted-foreground" />}
            </button>
          </div>
          <button
            onClick={() => {
              const text = `Entre na sala ${lobbyCode} no Casa dos 20 para jogar comigo!`;
              if (navigator.share) {
                navigator.share({ title: "Casa dos 20 — Sala", text }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text);
              }
            }}
            className="text-xs text-primary font-medium flex items-center gap-1 mx-auto"
            data-testid="button-share-code"
          >
            <Share2 size={12} /> Compartilhar
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{players.length} jogador(es) na sala</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground/60">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {p.name} {p.id === myId ? "(você)" : ""}
                </p>
              </div>
              {p.isHost && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium">Host</span>
              )}
            </div>
          ))}
        </div>

        {isHost && players.length >= 2 && (
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium text-sm shadow-lg flex items-center justify-center gap-2"
            data-testid="button-start-game"
          >
            <Sparkles size={16} /> Iniciar Jogo ({players.length} jogadores)
          </button>
        )}

        {isHost && players.length < 2 && (
          <p className="text-xs text-muted-foreground text-center">Aguardando mais jogadores para iniciar...</p>
        )}

        {!isHost && (
          <div className="text-center py-4">
            <Loader2 size={24} className="text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Aguardando o host iniciar o jogo...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 pt-12 pb-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-lobby-choice">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-serif text-foreground">
          {mode === "online" ? "Jogo Online" : "Jogo Presencial"} — Lobby
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Crie uma sala ou entre com um código.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={handleCreate}
          className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
          data-testid="button-create-lobby"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${questionData.color} flex items-center justify-center shadow-sm`}>
            <Crown size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Criar Sala</p>
            <p className="text-xs text-muted-foreground">Você será o host e compartilha o código</p>
          </div>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-background text-xs text-muted-foreground">ou</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Entrar numa Sala</p>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código da sala"
              maxLength={5}
              className="flex-1 p-3 rounded-xl bg-background border border-border text-foreground text-center text-lg font-mono tracking-[0.2em] uppercase placeholder:text-muted-foreground placeholder:text-sm placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="input-join-code"
            />
            <button
              onClick={handleJoin}
              disabled={joinCode.length < 5}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
              data-testid="button-join-lobby"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversaTypeSelect({ onSelect, onBack }: { onSelect: (type: ConversaType) => void; onBack: () => void }) {
  return (
    <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-conversa">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-serif text-foreground">Modo Conversa</h1>
        <p className="text-sm text-muted-foreground mt-1">Como vocês vão jogar?</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onSelect("presencial")}
          className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
          data-testid="button-conversa-presencial"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <MapPin size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Presencial</p>
            <p className="text-xs text-muted-foreground">Juntos no mesmo lugar</p>
          </div>
        </button>

        <button
          onClick={() => onSelect("online")}
          className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
          data-testid="button-conversa-online"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Wifi size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Online</p>
            <p className="text-xs text-muted-foreground">Cada um no seu celular, com lobby</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function SoloThemeSelect({ onSelect, onBack }: { onSelect: (theme: SoloThemeId) => void; onBack: () => void }) {
  const themes = Object.entries(SOLO_THEMES) as [SoloThemeId, typeof SOLO_THEMES[SoloThemeId]][];

  return (
    <div className="px-6 pt-12 pb-8 space-y-6 animate-in fade-in duration-500">
      <div>
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-solo">
          <ChevronLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-2xl font-serif text-foreground">Autoconhecimento</h1>
        <p className="text-sm text-muted-foreground mt-1">Escolha um tema e mergulhe fundo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {themes.map(([id, t]) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`p-4 rounded-2xl ${t.bg} border ${t.border} flex flex-col gap-3 text-left hover:shadow-md transition-all active:scale-95`}
            data-testid={`button-theme-${id}`}
          >
            <div className="text-2xl">{t.emoji}</div>
            <div>
              <h3 className="font-medium text-foreground text-sm">{t.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.questions.length} cartas</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Questions() {
  const { user } = useAuth();
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [soloTheme, setSoloTheme] = useState<SoloThemeId | null>(null);
  const [conversaType, setConversaType] = useState<ConversaType | null>(null);
  const [relation, setRelation] = useState<RelationType | null>(null);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [singleDevice, setSingleDevice] = useState(false);

  const premium = user?.hasPremium ?? false;

  if (showPremiumGate) {
    return <PremiumGate onBack={() => setShowPremiumGate(false)} />;
  }

  if (gameMode === "sozinho" && soloTheme) {
    const theme = SOLO_THEMES[soloTheme];
    return (
      <CardGame
        questions={theme.questions}
        title={theme.title}
        emoji={theme.emoji}
        color={theme.color}
        subtitle="Autoconhecimento"
        onBack={() => setSoloTheme(null)}
        allowAnswer={true}
      />
    );
  }

  if (gameMode === "sozinho") {
    return <SoloThemeSelect onSelect={setSoloTheme} onBack={() => setGameMode(null)} />;
  }

  if (gameMode === "conversa" && conversaType && relation && singleDevice) {
    const data = CONVERSATION_QUESTIONS[relation];
    return (
      <CardGame
        questions={data.questions}
        title={data.title}
        emoji={data.emoji}
        color={data.color}
        subtitle={conversaType === "presencial" ? "Presencial" : "Online"}
        onBack={() => { setSingleDevice(false); setRelation(null); }}
        weightedMode={true}
        allowAnswer={true}
      />
    );
  }

  if (gameMode === "conversa" && conversaType && relation && showLobby) {
    const data = CONVERSATION_QUESTIONS[relation];
    return (
      <LobbyScreen
        mode={conversaType}
        relation={relation}
        questions={data.questions}
        questionData={{ title: data.title, emoji: data.emoji, color: data.color }}
        onBack={() => { setShowLobby(false); setRelation(null); }}
        userName={user?.name || "Jogador"}
      />
    );
  }

  if (gameMode === "conversa" && conversaType && relation) {
    const data = CONVERSATION_QUESTIONS[relation];

    if (!showLobby) {
      return (
        <div className="px-6 pt-12 pb-8 space-y-6 animate-in fade-in duration-500">
          <div>
            <button onClick={() => setRelation(null)} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-play-choice">
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-2xl font-serif text-foreground">{data.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">Como quer jogar?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowLobby(true)}
              className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
              data-testid="button-play-lobby"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center shadow-sm`}>
                <Users size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Com Lobby</p>
                <p className="text-xs text-muted-foreground">
                  {conversaType === "online"
                    ? "Crie uma sala, cada um responde no app"
                    : "Crie uma sala, cada um tira carta do celular"}
                </p>
              </div>
            </button>

            <button
              onClick={() => setSingleDevice(true)}
              className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
              data-testid="button-play-single-device"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm">
                <MapPin size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Um Dispositivo</p>
                <p className="text-xs text-muted-foreground">Jogar no mesmo celular, sem sala</p>
              </div>
            </button>
          </div>
        </div>
      );
    }
  }

  if (gameMode === "conversa" && conversaType) {
    return (
      <RelationSelect
        conversaType={conversaType}
        onSelect={setRelation}
        onBack={() => setConversaType(null)}
      />
    );
  }

  if (gameMode === "conversa") {
    return <ConversaTypeSelect onSelect={setConversaType} onBack={() => setGameMode(null)} />;
  }

  return (
    <div className="px-6 pt-12 pb-8 flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="text-center space-y-3 mb-12">
        <h1 className="text-3xl font-serif text-foreground">Perguntas Profundas</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
          Perguntas que aproximam pessoas e revelam verdades.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => {
            if (!premium) {
              setShowPremiumGate(true);
            } else {
              setGameMode("sozinho");
            }
          }}
          className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
          data-testid="button-mode-sozinho"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <User size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-foreground">Sozinho</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Temas de autoconhecimento</p>
          </div>
          {!premium && <Lock size={16} className="text-muted-foreground" />}
        </button>

        <button
          onClick={() => {
            if (!premium) {
              setShowPremiumGate(true);
            } else {
              setGameMode("conversa");
            }
          }}
          className="w-full p-5 rounded-2xl bg-muted/50 border border-border hover:bg-muted transition-all flex items-center gap-4 text-left active:scale-[0.98]"
          data-testid="button-mode-conversa"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
            <Users size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-foreground">Modo Conversa</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Presencial ou online, com quem importa</p>
          </div>
          {!premium && <Lock size={16} className="text-muted-foreground" />}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-10 text-center">
        Inspirado pelo livro Casa dos 20 de Quinzinho Oliveira
      </p>
    </div>
  );
}

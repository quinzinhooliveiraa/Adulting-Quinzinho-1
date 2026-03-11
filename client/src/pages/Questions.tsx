import { useState, useMemo } from "react";
import { Users, User, ChevronLeft, RotateCcw, Share2, Bookmark, ArrowRight } from "lucide-react";
import { addNotification } from "@/utils/notificationService";

const QUESTIONS_DATA = {
  identity: {
    title: "Identidade",
    emoji: "🎭",
    color: "from-amber-500 to-orange-600",
    bg: "from-amber-50 to-orange-50",
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
    bg: "from-emerald-50 to-teal-50",
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
    bg: "from-rose-50 to-pink-50",
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
    bg: "from-violet-50 to-purple-50",
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
    bg: "from-lime-50 to-green-50",
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
    bg: "from-indigo-50 to-blue-50",
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

type CategoryId = keyof typeof QUESTIONS_DATA;

function CardGame({
  mode,
  category,
  onBack,
}: {
  mode: "online" | "presencial";
  category: CategoryId;
  onBack: () => void;
}) {
  const catData = QUESTIONS_DATA[category];
  const questions = catData.questions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedCards, setSavedCards] = useState<number[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    } else {
      setShowCompleted(true);
    }
  };

  const handleSave = () => {
    if (!savedCards.includes(currentIndex)) {
      setSavedCards([...savedCards, currentIndex]);
      addNotification({
        type: "journal",
        title: "💾 Carta Salva",
        message: `Pergunta salva para reflexão futura.`,
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
        title: "📋 Copiado",
        message: "Pergunta copiada para a área de transferência.",
      });
    }
  };

  if (showCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <div className="text-6xl mb-6">{catData.emoji}</div>
        <h2 className="text-2xl font-serif text-foreground mb-2">Rodada Completa!</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Você explorou {questions.length} perguntas sobre {catData.title}.
          {savedCards.length > 0 && ` ${savedCards.length} foram salvas.`}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
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
            Outras Categorias
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted" data-testid="button-back">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            {mode === "online" ? "Autoconhecimento" : "Presencial"}
          </p>
          <p className="text-xs text-foreground font-medium">
            {currentIndex + 1} / {questions.length}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="w-full px-6 mb-3">
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${catData.color} transition-all duration-500`}
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="px-6 flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div
          className="w-full max-w-sm perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          data-testid="card-question"
        >
          <div
            className={`relative w-full transition-transform duration-500 preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}
            style={{
              aspectRatio: "3/4",
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${catData.color} shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-7xl mb-6 opacity-30">{catData.emoji}</div>
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">
                Casa dos 20
              </p>
              <h3 className="text-white text-xl font-serif text-center">{catData.title}</h3>
              <p className="text-white/50 text-xs mt-6">Toque para revelar</p>
            </div>

            <div
              className="absolute inset-0 rounded-3xl bg-background border-2 border-border shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="text-3xl mb-6">{catData.emoji}</div>
              <p className="text-foreground font-serif text-xl text-center leading-relaxed">
                "{questions[currentIndex]}"
              </p>
              <p className="text-muted-foreground text-xs mt-6 uppercase tracking-widest">
                {catData.title}
              </p>
            </div>
          </div>
        </div>

        {isFlipped && (
          <div className="flex gap-3 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
              className={`px-6 py-3 rounded-full bg-gradient-to-r ${catData.color} text-white font-medium flex items-center gap-2 shadow-lg`}
              data-testid="button-next-card"
            >
              {currentIndex < questions.length - 1 ? (
                <>Próxima <ArrowRight size={16} /></>
              ) : (
                "Finalizar"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Questions() {
  const [mode, setMode] = useState<"online" | "presencial" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);

  if (mode && selectedCategory) {
    return (
      <CardGame
        mode={mode}
        category={selectedCategory}
        onBack={() => {
          setSelectedCategory(null);
        }}
      />
    );
  }

  if (mode) {
    const categories = Object.entries(QUESTIONS_DATA) as [CategoryId, typeof QUESTIONS_DATA[CategoryId]][];
    return (
      <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in duration-700">
        <header className="space-y-2">
          <button onClick={() => setMode(null)} className="p-2 -ml-2 rounded-full hover:bg-muted mb-2" data-testid="button-back-mode">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl font-serif text-foreground">
            {mode === "online" ? "Autoconhecimento" : "Jogo Presencial"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "online"
              ? "Escolha um tema e explore perguntas profundas sobre você mesmo."
              : "Escolha uma categoria e jogue com alguém ao seu lado."}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {categories.map(([id, cat]) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`p-5 rounded-2xl bg-gradient-to-br ${cat.bg} border border-border/50 flex flex-col justify-between space-y-4 text-left hover:shadow-md transition-all active:scale-95`}
              data-testid={`button-category-${id}`}
            >
              <div className="text-3xl">{cat.emoji}</div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{cat.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">{cat.questions.length} cartas</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-12 pb-8 flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl font-serif text-foreground">Perguntas Profundas</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Perguntas que aproximam pessoas e revelam verdades. Como você quer jogar?
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={() => setMode("online")}
          className="w-full p-6 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 flex items-center gap-4 hover:shadow-lg transition-all active:scale-[0.98] text-left"
          data-testid="button-mode-online"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-foreground">Sozinho</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Autoconhecimento profundo</p>
          </div>
        </button>

        <button
          onClick={() => setMode("presencial")}
          className="w-full p-6 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 flex items-center gap-4 hover:shadow-lg transition-all active:scale-[0.98] text-left"
          data-testid="button-mode-presencial"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-foreground">Presencial</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Com amigos, casal ou família</p>
          </div>
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground mt-8 text-center">
        Inspirado pelo livro Casa dos 20 de Quinzinho Oliveira
      </p>
    </div>
  );
}

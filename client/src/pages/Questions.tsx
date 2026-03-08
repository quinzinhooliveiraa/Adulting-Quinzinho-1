import { useState } from "react";
import { Users, LockKeyhole, Sparkles, ArrowRight, ChevronLeft, ChevronRight, Heart, Share2, Bookmark, Brain, Volume2, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { 
    id: 'identity', 
    title: 'Identidade', 
    count: 24, 
    icon: '🎭', 
    color: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600'
  },
  { 
    id: 'purpose', 
    title: 'Propósito', 
    count: 18, 
    icon: '🧭', 
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600'
  },
  { 
    id: 'relationships', 
    title: 'Relações', 
    count: 32, 
    icon: '🤍', 
    color: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-600'
  },
  { 
    id: 'uncertainty', 
    title: 'Incerteza', 
    count: 15, 
    icon: '🌫️', 
    color: 'bg-slate-100',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600'
  },
];

const QUESTIONS_BY_CATEGORY: Record<string, any[]> = {
  identity: [
    {
      id: 1,
      category: "Identidade",
      emoji: "🎭",
      question: "Se você não precisasse provar nada a ninguém, o que estaria fazendo da sua vida agora?",
      topic: "A pressão das expectativas externas",
      explanation: "Essa pergunta nos convida a separar o que queremos fazer do que acreditamos que devemos fazer. Aos 20 anos, é fácil viver uma vida desenhada por terceiros. Este é um convite para você se reimaginar.",
      theme: "orange"
    },
    {
      id: 2,
      category: "Identidade",
      emoji: "🎭",
      question: "Você está vivendo a vida que escolheu ou a vida que esperam de você?",
      topic: "O chamado para viver autenticamente",
      explanation: "Aos 20 anos, essa distinção nunca foi tão importante. Viver conforme os outros esperam é uma forma lenta de desaparecer. É hora de recuperar a autoria da sua vida.",
      theme: "orange"
    },
  ],
  purpose: [
    {
      id: 3,
      category: "Propósito",
      emoji: "🧭",
      question: "Como você definiria 'sucesso' se o dinheiro não existisse?",
      topic: "Redefinindo o sucesso na vida adulta",
      explanation: "Libertando-se da métrica financeira, qual seria sua verdadeira medida de uma vida bem vivida? Essa resposta é mais reveladora do que qualquer plano de carreira.",
      theme: "blue"
    },
  ],
  relationships: [
    {
      id: 4,
      category: "Relações",
      emoji: "🤍",
      question: "Em que relacionamentos você sente que pode ser 100% você mesmo?",
      topic: "A autenticidade nas conexões",
      explanation: "Relacionamentos verdadeiros só existem quando podemos ser quem realmente somos. Que espaços em sua vida permitem essa vulnerabilidade?",
      theme: "rose"
    },
  ],
  uncertainty: [
    {
      id: 5,
      category: "Incerteza",
      emoji: "🌫️",
      question: "Se você soubesse que vai dar certo, o que tentaria fazer hoje?",
      topic: "O medo como bússola",
      explanation: "A incerteza paralisa porque inventamos futuros que não existem. E se você confiasse no processo sem precisar ver o final?",
      theme: "slate"
    },
  ],
};

// Flatten all questions for random selection
const ALL_QUESTIONS = Object.values(QUESTIONS_BY_CATEGORY).flat();

function GameSetup({ conversationMode, onStartGame }: any) {
  return (
    <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-4">
        <h1 className="text-3xl font-serif text-foreground">Jogo de Perguntas</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {conversationMode 
            ? "Escolha um tema e comece a jogar com alguém online ou pessoalmente"
            : "Explore questionamentos que te ajudam a se entender melhor"}
        </p>
      </header>

      <div className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">Escolha um Tema</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id} 
              onClick={() => onStartGame(cat.id)}
              className={`p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-primary/30 transition-all group active:scale-95`}
              data-testid={`button-game-category-${cat.id}`}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} perguntas</p>
              </div>
            </button>
          ))}

          {/* Premium Lock example */}
          <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <LockKeyhole size={24} className="text-muted-foreground" />
            </div>
            <div className="text-2xl opacity-50">💼</div>
            <div className="opacity-50">
              <h3 className="font-medium text-foreground text-sm">Carreira</h3>
              <p className="text-xs text-muted-foreground mt-1">Premium</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          const randomIndex = Math.floor(Math.random() * CATEGORIES.length);
          const randomCategory = CATEGORIES[randomIndex];
          onStartGame(randomCategory.id);
        }}
        className="mt-8 w-full p-6 bg-primary text-primary-foreground rounded-3xl relative overflow-hidden group hover:shadow-lg transition-all active:scale-95"
        data-testid="button-random-game"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={100} />
        </div>
        <div className="relative z-10 text-left space-y-2">
          <h3 className="font-serif text-xl">Tema Aleatório</h3>
          <p className="text-sm opacity-80">
            Deixe o acaso escolher para você.
          </p>
          <div className="flex items-center space-x-2 text-sm font-medium pt-2">
            <span>Começar agora</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </button>
    </div>
  );
}

function GameInterface({ category, conversationMode, onBack }: any) {
  const questions = QUESTIONS_BY_CATEGORY[category] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'A' | 'B'>('A');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const current = questions[currentIndex];
  const categoryInfo = CATEGORIES.find(c => c.id === category);
  
  const responseKey = `q${current.id}_${currentPlayer}`;
  const currentResponse = responses[responseKey] || "";
  
  const handleInputChange = (text: string) => {
    setResponses({
      ...responses,
      [responseKey]: text
    });
  };

  const handleNext = () => {
    if (currentResponse.trim()) {
      const newCompleted = new Set(completed);
      newCompleted.add(responseKey);
      setCompleted(newCompleted);

      // If both players answered, move to next question
      if (newCompleted.has(`q${current.id}_A`) && newCompleted.has(`q${current.id}_B`)) {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setCurrentPlayer('A');
        }
      } else {
        setCurrentPlayer(currentPlayer === 'A' ? 'B' : 'A');
      }
    }
  };

  const getPlayerColor = (player: 'A' | 'B') => {
    return player === 'A' ? 'from-blue-50 to-cyan-50' : 'from-rose-50 to-pink-50';
  };

  const getPlayerBorder = (player: 'A' | 'B') => {
    return player === 'A' ? 'border-blue-200' : 'border-rose-200';
  };

  const progressPercentage = Math.round((currentIndex + 1) / questions.length * 100);

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 border-b border-border/30">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-muted transition-all"
            data-testid="button-back-to-setup"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-serif text-foreground">{categoryInfo?.title}</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Jogo de Perguntas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pergunta {currentIndex + 1} de {questions.length}</span>
            <span className="font-bold text-primary">{progressPercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="px-6 py-8 space-y-6">
        {/* Question Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">A Pergunta</p>
              <h2 className="font-serif text-xl text-foreground leading-snug">"{current.question}"</h2>
            </div>
            <span className="text-3xl">{current.emoji}</span>
          </div>
          <p className="text-sm text-foreground/70 italic font-serif border-t border-primary/10 pt-3">
            {current.explanation}
          </p>
        </div>

        {/* Players Cards */}
        <div className="grid grid-cols-1 gap-6">
          {/* Player A */}
          <div className={`bg-gradient-to-br ${currentPlayer === 'A' ? 'from-blue-50 to-cyan-50 border-2 border-blue-300' : 'from-blue-50/50 to-cyan-50/50 border-2 border-blue-200'} rounded-3xl p-6 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Pessoa A</p>
                {currentPlayer === 'A' && (
                  <p className="text-xs text-blue-600 mt-1 animate-pulse">Sua vez de responder</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                A
              </div>
            </div>
            
            {currentPlayer === 'A' ? (
              <div className="space-y-3">
                <textarea
                  value={currentResponse}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="w-full h-32 p-4 bg-white border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-sm"
                  data-testid="input-player-a-response"
                />
                <button
                  onClick={handleNext}
                  disabled={!currentResponse.trim()}
                  className="w-full p-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors active:scale-95"
                  data-testid="button-submit-response"
                >
                  Responder
                </button>
              </div>
            ) : (
              <div className="bg-white/60 rounded-2xl p-4 border border-blue-100 min-h-32 flex items-center">
                <p className={`text-sm ${responses[`q${current.id}_A`] ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                  {responses[`q${current.id}_A`] || "Aguardando resposta..."}
                </p>
              </div>
            )}
          </div>

          {/* Player B */}
          <div className={`bg-gradient-to-br ${currentPlayer === 'B' ? 'from-rose-50 to-pink-50 border-2 border-rose-300' : 'from-rose-50/50 to-pink-50/50 border-2 border-rose-200'} rounded-3xl p-6 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Pessoa B</p>
                {currentPlayer === 'B' && (
                  <p className="text-xs text-rose-600 mt-1 animate-pulse">Sua vez de responder</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                B
              </div>
            </div>
            
            {currentPlayer === 'B' ? (
              <div className="space-y-3">
                <textarea
                  value={currentResponse}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="w-full h-32 p-4 bg-white border border-rose-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none text-sm"
                  data-testid="input-player-b-response"
                />
                <button
                  onClick={handleNext}
                  disabled={!currentResponse.trim()}
                  className="w-full p-3 bg-rose-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-700 transition-colors active:scale-95"
                  data-testid="button-submit-response-b"
                >
                  Responder
                </button>
              </div>
            ) : (
              <div className="bg-white/60 rounded-2xl p-4 border border-rose-100 min-h-32 flex items-center">
                <p className={`text-sm ${responses[`q${current.id}_B`] ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                  {responses[`q${current.id}_B`] || "Aguardando resposta..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Turn indicator */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Turno: <span className="font-bold text-primary">{currentPlayer}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Questions() {
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [gameCategory, setGameCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [randomQuestion, setRandomQuestion] = useState<any | null>(null);

  // If conversation mode is active, show game interface
  if (isConversationMode && gameCategory) {
    return (
      <GameInterface 
        category={gameCategory} 
        conversationMode={isConversationMode}
        onBack={() => setGameCategory(null)}
      />
    );
  }

  // If conversation mode is active, show game setup
  if (isConversationMode) {
    return (
      <GameSetup 
        conversationMode={isConversationMode} 
        onStartGame={(category: string) => setGameCategory(category)}
      />
    );
  }

  // Normal mode - regular interface
  return (
    <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="space-y-4">
        <h1 className="text-3xl font-serif text-foreground">Perguntas Profundas</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Explore questionamentos que te ajudam a se entender melhor e a navegar a transição para a vida adulta.
        </p>
      </header>

      <div className="p-5 rounded-2xl bg-secondary/50 border border-secondary flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">Modo Conversa</h3>
            <p className="text-[11px] text-muted-foreground">Para jogar online ou pessoalmente</p>
          </div>
        </div>
        <Switch 
          checked={isConversationMode}
          onCheckedChange={setIsConversationMode}
          data-testid="toggle-conversation-mode"
        />
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">Coleções</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id} 
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentQuestionIndex(0);
              }}
              className={`p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-primary/30 transition-all group`}
              data-testid={`button-category-${cat.id}`}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} perguntas</p>
              </div>
            </button>
          ))}

          {/* Premium Lock example */}
          <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <LockKeyhole size={24} className="text-muted-foreground" />
            </div>
            <div className="text-2xl opacity-50">💼</div>
            <div className="opacity-50">
              <h3 className="font-medium text-foreground text-sm">Carreira</h3>
              <p className="text-xs text-muted-foreground mt-1">Premium</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          const randomIndex = Math.floor(Math.random() * ALL_QUESTIONS.length);
          setRandomQuestion(ALL_QUESTIONS[randomIndex]);
        }}
        className="mt-8 w-full p-6 bg-primary text-primary-foreground rounded-3xl relative overflow-hidden group hover:shadow-lg transition-all active:scale-95"
        data-testid="button-random-question"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={100} />
        </div>
        <div className="relative z-10 text-left space-y-2">
          <h3 className="font-serif text-xl">Pergunta Aleatória</h3>
          <p className="text-sm opacity-80">
            Deixe o acaso guiar sua próxima reflexão.
          </p>
          <div className="flex items-center space-x-2 text-sm font-medium pt-2">
            <span>Sortear agora</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </button>
    </div>
  );
}

import { useState } from "react";
import { Users, LockKeyhole, Sparkles, ArrowRight, ChevronLeft, ChevronRight, Heart, Share2, Bookmark, Brain, Copy, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReflectionEditor from "@/components/ReflectionEditor";
import { addNotification } from "@/utils/notificationService";

const CATEGORIES = [
  { id: 'identity', title: 'Identidade', count: 24, icon: '🎭' },
  { id: 'purpose', title: 'Propósito', count: 18, icon: '🧭' },
  { id: 'relationships', title: 'Relações', count: 32, icon: '🤍' },
  { id: 'uncertainty', title: 'Incerteza', count: 15, icon: '🌫️' },
];

const QUESTIONS_BY_CATEGORY: Record<string, any[]> = {
  identity: [
    { id: 1, category: "Identidade", emoji: "🎭", question: "Se você não precisasse provar nada a ninguém, o que estaria fazendo?", topic: "As expectativas externas" },
    { id: 2, category: "Identidade", emoji: "🎭", question: "Você está vivendo a vida que escolheu?", topic: "Autenticidade na vida adulta" },
  ],
  purpose: [
    { id: 3, category: "Propósito", emoji: "🧭", question: "Como você definiria sucesso sem dinheiro?", topic: "Redefinindo sucesso" },
  ],
  relationships: [
    { id: 4, category: "Relações", emoji: "🤍", question: "Em que relacionamentos você é 100% você mesmo?", topic: "Autenticidade nas conexões" },
  ],
  uncertainty: [
    { id: 5, category: "Incerteza", emoji: "🌫️", question: "Se soubesse que vai dar certo, o que tentaria?", topic: "O medo como bússola" },
  ],
};

const ALL_QUESTIONS = Object.values(QUESTIONS_BY_CATEGORY).flat();

const GAME_MODES = [
  { id: 'couples', title: 'Para Casais', icon: '💑', color: 'from-rose-50 to-pink-50', border: 'border-rose-200' },
  { id: 'friends', title: 'Para Amigos', icon: '🤝', color: 'from-blue-50 to-cyan-50', border: 'border-blue-200' },
  { id: 'strangers', title: 'Desconhecidos', icon: '👥', color: 'from-purple-50 to-indigo-50', border: 'border-purple-200' },
  { id: 'family', title: 'Para Família', icon: '👨‍👩‍👧‍👦', color: 'from-amber-50 to-orange-50', border: 'border-amber-200' },
];

function GameInterface({ category, gameMode, otherPlayerName, onBack }: any) {
  const questions = QUESTIONS_BY_CATEGORY[category] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState<'A' | 'B'>('A');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showEditor, setShowEditor] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  const current = questions[currentIndex];
  const categoryInfo = CATEGORIES.find(c => c.id === category);
  const responseKey = `q${current.id}_${currentPlayer}`;
  const currentResponse = responses[responseKey] || "";

  const handleNext = () => {
    if (currentResponse.trim()) {
      const newResponses = { ...responses, [responseKey]: currentResponse };
      setResponses(newResponses);

      if (newResponses[`q${current.id}_A`] && newResponses[`q${current.id}_B`]) {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setCurrentPlayer('A');
        }
      } else {
        setCurrentPlayer(currentPlayer === 'A' ? 'B' : 'A');
      }
    }
  };

  const handleSaveQuestion = (text: string) => {
    addNotification({
      type: "journal",
      title: "💭 Resposta da Pergunta Guardada",
      message: `Sua resposta foi salva no diário!`,
    });
    setShowEditor(false);
    setSelectedQuestion(null);
  };

  const progressPercentage = Math.round((currentIndex + 1) / questions.length * 100);

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-6 border-b border-border/30">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-serif text-foreground">{categoryInfo?.title}</h1>
            <p className="text-xs text-muted-foreground uppercase mt-1">Jogo de Perguntas</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pergunta {currentIndex + 1} de {questions.length}</span>
            <span className="font-bold text-primary">{progressPercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-3">
          <h2 className="font-serif text-xl text-foreground">"{current.question}"</h2>
          <p className="text-sm text-foreground/70 italic font-serif border-t border-primary/10 pt-3">{current.topic}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className={`bg-gradient-to-br ${currentPlayer === 'A' ? 'from-blue-50 to-cyan-50 border-2 border-blue-300' : 'from-blue-50/50 to-cyan-50/50 border-2 border-blue-200'} rounded-3xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Pessoa A</p>
                {currentPlayer === 'A' && <p className="text-xs text-blue-600 mt-1 animate-pulse">Sua vez</p>}
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div>
            </div>

            {currentPlayer === 'A' ? (
              <div className="space-y-3">
                <textarea
                  value={currentResponse}
                  onChange={(e) => {
                    const newResponses = { ...responses };
                    newResponses[responseKey] = e.target.value;
                    setResponses(newResponses);
                  }}
                  placeholder="Sua resposta..."
                  className="w-full h-32 p-4 bg-white border border-blue-200 rounded-2xl focus:ring-2 focus:ring-blue-300 resize-none text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedQuestion(current);
                      setShowEditor(true);
                    }}
                    className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                  >
                    💾 Salvar
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!currentResponse.trim()}
                    className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 rounded-2xl p-4 border border-blue-100 min-h-32 flex items-center">
                <p className={`text-sm ${responses[`q${current.id}_A`] ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                  {responses[`q${current.id}_A`] || "Aguardando..."}
                </p>
              </div>
            )}
          </div>

          <div className={`bg-gradient-to-br ${currentPlayer === 'B' ? 'from-rose-50 to-pink-50 border-2 border-rose-300' : 'from-rose-50/50 to-pink-50/50 border-2 border-rose-200'} rounded-3xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase">{otherPlayerName || 'Pessoa B'}</p>
                {currentPlayer === 'B' && <p className="text-xs text-rose-600 mt-1 animate-pulse">Sua vez</p>}
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">B</div>
            </div>

            {currentPlayer === 'B' ? (
              <div className="space-y-3">
                <textarea
                  value={currentResponse}
                  onChange={(e) => {
                    const newResponses = { ...responses };
                    newResponses[responseKey] = e.target.value;
                    setResponses(newResponses);
                  }}
                  placeholder="Sua resposta..."
                  className="w-full h-32 p-4 bg-white border border-rose-200 rounded-2xl focus:ring-2 focus:ring-rose-300 resize-none text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedQuestion(current);
                      setShowEditor(true);
                    }}
                    className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
                  >
                    💾 Salvar
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!currentResponse.trim()}
                    className="flex-1 p-3 bg-rose-600 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 rounded-2xl p-4 border border-rose-100 min-h-32 flex items-center">
                <p className={`text-sm ${responses[`q${current.id}_B`] ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                  {responses[`q${current.id}_B`] || "Aguardando..."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Turno: <span className="font-bold text-primary">{currentPlayer}</span></p>
        </div>
      </div>

      {showEditor && selectedQuestion && (
        <ReflectionEditor
          title={`Resposta: "${selectedQuestion.question.substring(0, 50)}..."`}
          initialText={currentResponse}
          origin={`De: ${categoryInfo?.title || 'Pergunta'}`}
          onClose={() => setShowEditor(false)}
          onSave={(text) => {
            handleSaveQuestion(text);
          }}
        />
      )}
    </div>
  );
}

export default function Questions() {
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [gameCategory, setGameCategory] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [otherPlayerName, setOtherPlayerName] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  // Game interface - when playing
  if (isConversationMode && gameCategory) {
    return (
      <GameInterface
        category={gameCategory}
        gameMode={gameMode}
        otherPlayerName={otherPlayerName}
        onBack={() => {
          setGameCategory(null);
          setGameMode(null);
          setOtherPlayerName(null);
          setRoomCode(null);
          setSelectedMode(null);
          setNameInput("");
        }}
      />
    );
  }

  // Room waiting screen - game setup step 3
  if (isConversationMode && roomCode && selectedMode) {
    const modeInfo = GAME_MODES.find(m => m.id === selectedMode);
    return (
      <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
        <div className="px-6 pt-12 pb-6 text-center space-y-4">
          <h1 className="text-3xl font-serif text-foreground">Sala Criada!</h1>
          <p className="text-sm text-muted-foreground">Código: <strong>{roomCode}</strong></p>
        </div>
        <div className="px-6 space-y-8">
          <div className="bg-primary/5 border-2 border-primary/30 rounded-3xl p-8 space-y-4 text-center">
            <p className="text-xs uppercase tracking-widest text-primary font-bold">Compartilhe o código</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                alert("Código copiado!");
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              <Copy size={14} /> Copiar {roomCode}
            </button>
          </div>
          <Input
            placeholder="Nome do outro jogador"
            value={otherPlayerName || ""}
            onChange={(e) => setOtherPlayerName(e.target.value)}
            className="h-12 rounded-xl"
          />
          <button
            onClick={() => {
              if (otherPlayerName?.trim()) {
                setGameCategory(selectedMode === 'couples' ? 'identity' : selectedMode === 'friends' ? 'purpose' : selectedMode === 'strangers' ? 'relationships' : 'uncertainty');
              }
            }}
            className="w-full p-4 bg-primary text-primary-foreground rounded-2xl font-medium"
          >
            Começar Jogo
          </button>
        </div>
      </div>
    );
  }

  // Mode selection with name input - game setup step 2
  if (isConversationMode && selectedMode) {
    const mode = GAME_MODES.find(m => m.id === selectedMode);
    return (
      <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
        <div className="px-6 pt-12 pb-6">
          <button onClick={() => setSelectedMode(null)} className="p-2 mb-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-3xl font-serif text-foreground">{mode?.title}</h1>
        </div>
        <div className="px-6 space-y-8">
          <div className={`bg-gradient-to-br ${mode?.color} border-2 ${mode?.border} rounded-3xl p-8 text-center space-y-4`}>
            <div className="text-6xl">{mode?.icon}</div>
            <h2 className="font-serif text-2xl text-foreground">{mode?.title}</h2>
          </div>
          <Input
            placeholder="Seu nome"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="h-12 rounded-xl"
          />
          <button
            onClick={() => {
              if (nameInput.trim()) {
                setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
              }
            }}
            className="w-full p-4 bg-primary text-primary-foreground rounded-2xl font-medium"
          >
            Criar Sala
          </button>
        </div>
      </div>
    );
  }

  // Game mode selection - game setup step 1
  if (isConversationMode) {
    return (
      <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in duration-700">
        <header className="space-y-4">
          <h1 className="text-3xl font-serif text-foreground">Jogo de Perguntas</h1>
          <p className="text-muted-foreground text-sm">Escolha um modo e comece a jogar</p>
        </header>

        <div className="space-y-4">
          <h2 className="font-serif text-xl text-foreground">Escolha um Modo</h2>
          <div className="grid grid-cols-2 gap-4">
            {GAME_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`p-5 rounded-2xl bg-gradient-to-br ${m.color} border-2 ${m.border} flex flex-col justify-between space-y-4`}
              >
                <div className="text-3xl">{m.icon}</div>
                <div className="text-left">
                  <h3 className="font-medium text-foreground text-sm">{m.title}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normal mode - browse questions
  return (
    <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h1 className="text-3xl font-serif text-foreground">Perguntas Profundas</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Explore questionamentos que te ajudam a se entender melhor.
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
        />
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">Coleções</h2>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-primary/30 transition-all`}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} perguntas</p>
              </div>
            </button>
          ))}
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

      <button className="mt-8 w-full p-6 bg-primary text-primary-foreground rounded-3xl relative overflow-hidden group hover:shadow-lg transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={100} />
        </div>
        <div className="relative z-10 text-left space-y-2">
          <h3 className="font-serif text-xl">Pergunta Aleatória</h3>
          <p className="text-sm opacity-80">Deixe o acaso guiar sua próxima reflexão.</p>
          <div className="flex items-center space-x-2 text-sm font-medium pt-2">
            <span>Sortear agora</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </button>
    </div>
  );
}

import { useState } from "react";
import { Users, LockKeyhole, Sparkles, ArrowRight, ChevronLeft, ChevronRight, Heart, Share2, Bookmark, Brain, MessageCircle } from "lucide-react";
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

function QuestionCard({ question, liked, saved, onLike, onSave, onShare, conversationMode }: any) {
  const themeColors: Record<string, string> = {
    orange: "from-orange-50 to-amber-50",
    blue: "from-blue-50 to-cyan-50",
    green: "from-emerald-50 to-teal-50",
    rose: "from-rose-50 to-pink-50",
    slate: "from-slate-50 to-gray-50"
  };

  const themeBorder: Record<string, string> = {
    orange: "border-orange-200",
    blue: "border-blue-200",
    green: "border-emerald-200",
    rose: "border-rose-200",
    slate: "border-slate-200"
  };

  if (conversationMode) {
    return (
      <div className="space-y-6">
        {/* Person 1 */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">A</div>
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold text-primary uppercase">Pessoa 1</p>
            <div className="bg-primary/5 rounded-2xl p-4 rounded-tl-none border border-primary/20">
              <p className="text-sm text-foreground leading-relaxed">"{question.question}"</p>
            </div>
          </div>
        </div>

        {/* Person 2 - with response prompt */}
        <div className="flex gap-4 flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center flex-shrink-0 font-bold text-sm">B</div>
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase">Pessoa 2</p>
            <div className="bg-secondary/30 rounded-2xl p-4 rounded-tr-none border border-secondary/40 placeholder-text-sm text-muted-foreground italic">
              Sua resposta...
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-muted/30 rounded-2xl p-4 border border-muted/50">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Tema</p>
          <p className="text-sm font-serif text-foreground/80 italic">{question.explanation}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center pt-4 border-t border-border/40">
          <button
            onClick={() => onLike(question.id)}
            className={`p-3 rounded-full transition-all active:scale-95 ${
              liked.includes(question.id)
                ? "bg-rose-100 text-rose-600"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
            data-testid="button-like-question"
          >
            <Heart size={18} fill={liked.includes(question.id) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onSave(question.id)}
            className={`p-3 rounded-full transition-all active:scale-95 ${
              saved.includes(question.id)
                ? "bg-amber-100 text-amber-600"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
            data-testid="button-save-question"
          >
            <Bookmark size={18} fill={saved.includes(question.id) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onShare(question)}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
            data-testid="button-share-question"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-br ${themeColors[question.theme]} border-2 ${themeBorder[question.theme]} rounded-3xl shadow-lg overflow-hidden`}>
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
        <Brain size={200} />
      </div>

      <div className="relative z-10 p-8 md:p-10 space-y-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{question.emoji}</span>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {question.category}
              </p>
              <h2 className="text-sm font-medium text-foreground mt-0.5">Uma pergunta para você</h2>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-primary font-bold">Tópico</p>
            <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug">
              "{question.question}"
            </h3>
          </div>

          <div className="mt-6 pt-6 border-t border-border/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
              {question.topic}
            </p>
            <p className="text-sm leading-relaxed text-foreground/80 font-serif italic">
              {question.explanation}
            </p>
          </div>
        </div>

        <div className="pt-4 flex gap-3 justify-end border-t border-border/40">
          <button
            onClick={() => onLike(question.id)}
            className={`p-3 rounded-full transition-all active:scale-95 ${
              liked.includes(question.id)
                ? "bg-rose-100 text-rose-600"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
            data-testid="button-like-question"
          >
            <Heart size={18} fill={liked.includes(question.id) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onSave(question.id)}
            className={`p-3 rounded-full transition-all active:scale-95 ${
              saved.includes(question.id)
                ? "bg-amber-100 text-amber-600"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
            data-testid="button-save-question"
          >
            <Bookmark size={18} fill={saved.includes(question.id) ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onShare(question)}
            className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
            data-testid="button-share-question"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Questions() {
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [randomQuestion, setRandomQuestion] = useState<any | null>(null);

  const handleLike = (id: number) => {
    setLiked(liked.includes(id) ? liked.filter(x => x !== id) : [...liked, id]);
  };

  const handleSave = (id: number) => {
    setSaved(saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id]);
  };

  const handleShare = (question: any) => {
    const text = `"${question.question}" - Casa dos 20`;
    if (navigator.share) {
      navigator.share({
        title: 'Casa dos 20',
        text: text,
      }).catch(console.error);
    } else {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * ALL_QUESTIONS.length);
    setRandomQuestion(ALL_QUESTIONS[randomIndex]);
  };

  // Random question modal
  if (randomQuestion) {
    return (
      <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif text-foreground">Pergunta Aleatória</h1>
            <button
              onClick={() => setRandomQuestion(null)}
              className="p-2 rounded-full hover:bg-muted transition-all"
              data-testid="button-close-random"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
        </div>

        <div className="px-6 space-y-6">
          <QuestionCard
            question={randomQuestion}
            liked={liked}
            saved={saved}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            conversationMode={isConversationMode}
          />

          <button
            onClick={handleRandomQuestion}
            className="w-full p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary font-medium hover:bg-primary/20 transition-all active:scale-95"
            data-testid="button-another-random"
          >
            <Sparkles size={16} className="inline mr-2" />
            Sortear Outra
          </button>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    const questions = QUESTIONS_BY_CATEGORY[selectedCategory] || [];
    const current = questions[currentQuestionIndex];
    const category = CATEGORIES.find(c => c.id === selectedCategory);

    return (
      <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCurrentQuestionIndex(0);
              }}
              className="p-2 rounded-full hover:bg-muted transition-all"
              data-testid="button-back-to-categories"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-serif text-foreground">{category?.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {currentQuestionIndex + 1} de {questions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6">
          {current && (
            <QuestionCard
              question={current}
              liked={liked}
              saved={saved}
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              conversationMode={isConversationMode}
            />
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                data-testid="button-prev-question"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex-1 mx-4">
                <div className="flex gap-1.5 justify-center">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentQuestionIndex ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted/70"
                      }`}
                      data-testid={`progress-dot-${i}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                data-testid="button-next-question"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart size={14} />
                <span>{liked.length} salva</span>
              </div>
              <div className="text-muted-foreground/30">•</div>
              <div className="flex items-center gap-1">
                <Bookmark size={14} />
                <span>{saved.length} marcada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-[11px] text-muted-foreground">Para responder a dois</p>
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
        onClick={handleRandomQuestion}
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

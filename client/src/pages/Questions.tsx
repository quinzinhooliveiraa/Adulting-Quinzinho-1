import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Share2, Bookmark, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUESTIONS_COLLECTION = [
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
    category: "Ansiedade",
    emoji: "😰",
    question: "O que você tem evitado sentir ultimamente?",
    topic: "A coragem de sentir o incômodo",
    explanation: "Muitas vezes, evitamos sentimentos desconfortáveis esperando que passem sozinhos. Mas ignorar emoções é como ignorar uma ferida que não cicatriza. Que sentimento está pedindo sua atenção?",
    theme: "blue"
  },
  {
    id: 3,
    category: "Propósito",
    emoji: "🧭",
    question: "Como você definiria 'sucesso' se o dinheiro não existisse?",
    topic: "Redefinindo o sucesso na vida adulta",
    explanation: "Libertando-se da métrica financeira, qual seria sua verdadeira medida de uma vida bem vivida? Essa resposta é mais reveladora do que qualquer plano de carreira.",
    theme: "green"
  },
  {
    id: 4,
    category: "Solidão",
    emoji: "🤍",
    question: "Qual foi a última vez que você se sentiu verdadeiramente em paz consigo mesmo?",
    topic: "O diferença entre estar sozinho e estar em solitude",
    explanation: "A solidão dói quando nos falta autoconhecimento. Mas quando aprendemos a estar consigo, o silêncio vira um refúgio. Quando foi a última vez que você experimentou isso?",
    theme: "rose"
  },
  {
    id: 5,
    category: "Identidade",
    emoji: "🎭",
    question: "Você está vivendo a vida que escolheu ou a vida que esperam de você?",
    topic: "O chamado para viver autenticamente",
    explanation: "Aos 20 anos, essa distinção nunca foi tão importante. Viver conforme os outros esperam é uma forma lenta de desaparecer. É hora de recuperar a autoria da sua vida.",
    theme: "orange"
  },
];

export default function Questions() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);

  const current = QUESTIONS_COLLECTION[currentIndex];
  const themeColors: Record<string, string> = {
    orange: "from-orange-50 to-amber-50",
    blue: "from-blue-50 to-cyan-50",
    green: "from-emerald-50 to-teal-50",
    rose: "from-rose-50 to-pink-50"
  };

  const themeBorder: Record<string, string> = {
    orange: "border-orange-200",
    blue: "border-blue-200",
    green: "border-emerald-200",
    rose: "border-rose-200"
  };

  const themeIcon: Record<string, string> = {
    orange: "text-orange-600",
    blue: "text-blue-600",
    green: "text-emerald-600",
    rose: "text-rose-600"
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < QUESTIONS_COLLECTION.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleLike = (id: number) => {
    setLiked(liked.includes(id) ? liked.filter(x => x !== id) : [...liked, id]);
  };

  const handleSave = (id: number) => {
    setSaved(saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id]);
  };

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif text-foreground">Perguntas Profundas</h1>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} de {QUESTIONS_COLLECTION.length}
          </p>
        </div>
      </div>

      {/* Letter-card interface */}
      <div className="px-6 space-y-6">
        <div className={`relative bg-gradient-to-br ${themeColors[current.theme]} border-2 ${themeBorder[current.theme]} rounded-3xl shadow-lg overflow-hidden`}>
          {/* Decorative corner elements */}
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <Brain size={200} />
          </div>

          <div className="relative z-10 p-8 md:p-10 space-y-8">
            {/* Header with category and emoji */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{current.emoji}</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {current.category}
                  </p>
                  <h2 className="text-sm font-medium text-foreground mt-0.5">Uma pergunta para você</h2>
                </div>
              </div>
            </div>

            {/* Main question */}
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest text-primary font-bold">Tópico</p>
                <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug">
                  "{current.question}"
                </h3>
              </div>

              {/* Topic breakdown */}
              <div className="mt-6 pt-6 border-t border-border/40">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                  {current.topic}
                </p>
                <p className="text-sm leading-relaxed text-foreground/80 font-serif italic">
                  {current.explanation}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 flex gap-3 justify-end border-t border-border/40">
              <button
                onClick={() => handleLike(current.id)}
                className={`p-3 rounded-full transition-all active:scale-95 ${
                  liked.includes(current.id)
                    ? "bg-rose-100 text-rose-600"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
                data-testid="button-like-question"
              >
                <Heart size={18} fill={liked.includes(current.id) ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => handleSave(current.id)}
                className={`p-3 rounded-full transition-all active:scale-95 ${
                  saved.includes(current.id)
                    ? "bg-amber-100 text-amber-600"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
                data-testid="button-save-question"
              >
                <Bookmark size={18} fill={saved.includes(current.id) ? "currentColor" : "none"} />
              </button>
              <button
                className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
                onClick={() => {
                  const text = `"${current.question}" - Casa dos 20`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Casa dos 20',
                      text: text,
                    }).catch(console.error);
                  } else {
                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                  }
                }}
                data-testid="button-share-question"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation and progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              data-testid="button-prev-question"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex-1 mx-4">
              <div className="flex gap-1.5 justify-center">
                {QUESTIONS_COLLECTION.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted/70"
                    }`}
                    data-testid={`progress-dot-${i}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === QUESTIONS_COLLECTION.length - 1}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              data-testid="button-next-question"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Interaction summary */}
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

        {/* CTA for full collection */}
        <div className="mt-8 p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center space-y-3">
          <p className="text-sm text-foreground font-medium">
            Descubra mais perguntas em diferentes categorias
          </p>
          <Button className="w-full bg-primary text-primary-foreground rounded-full h-12 font-medium shadow-sm active:scale-95 transition-all">
            Explorar Coleções
          </Button>
        </div>
      </div>
    </div>
  );
}

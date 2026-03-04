import { useState } from "react";
import { ChevronRight, ArrowRight, Sparkles, BookOpen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import bookCover from "@/assets/images/book-cover.png";

const ONBOARDING_STEPS = [
  {
    title: "Bem-vindo à Casa dos 20",
    description: "Um refúgio para quem está atravessando a transição para a vida adulta. Um espaço de calma, reflexão e autoconhecimento.",
    image: bookCover,
    accent: "bg-primary/10"
  },
  {
    title: "Reflexões Diárias",
    description: "Receba perguntas profundas e lembretes que se adaptam ao seu momento, baseados nos temas do livro de Quinzinho Oliveira.",
    icon: Sparkles,
    accent: "bg-amber-50"
  },
  {
    title: "Seu Espaço Seguro",
    description: "Mantenha um diário íntimo com análise inteligente de temas e acompanhe sua evolução emocional semana a semana.",
    icon: PenLine,
    accent: "bg-rose-50"
  }
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = ONBOARDING_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className={`w-full max-w-sm aspect-[3/4] rounded-[3rem] ${current.accent} mb-12 flex items-center justify-center overflow-hidden relative shadow-inner border border-border/20`}>
        {current.image ? (
          <img src={current.image} alt="Casa dos 20" className="w-2/3 shadow-2xl rounded-lg rotate-3" />
        ) : (
          <current.icon size={120} className="text-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
      </div>

      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-3xl font-serif text-foreground leading-tight px-4">
          {current.title}
        </h1>
        <p className="text-muted-foreground leading-relaxed px-4">
          {current.description}
        </p>
      </div>

      <div className="mt-12 w-full max-w-sm space-y-6">
        <div className="flex justify-center space-x-2">
          {ONBOARDING_STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} 
            />
          ))}
        </div>
        
        <Button 
          onClick={next}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground text-lg font-medium shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          {step === ONBOARDING_STEPS.length - 1 ? "Começar Jornada" : "Próximo"}
          <ArrowRight className="ml-2" size={20} />
        </Button>
      </div>
    </div>
  );
}

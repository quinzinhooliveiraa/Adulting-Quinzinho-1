import { useState } from "react";
import { ArrowRight, Sparkles, Bell, LockKeyhole, Check, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import bookCover from "@/assets/images/book-cover.png";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo à Casa dos 20",
    description: "Um refúgio para quem está atravessando a transição para a vida adulta. Um espaço de calma, reflexão e autoconhecimento.",
    image: bookCover,
    accent: "bg-primary/10"
  },
  {
    id: "features",
    title: "Reflexões Diárias",
    description: "Receba perguntas profundas e lembretes que se adaptam ao seu momento, baseados nos temas do livro de Quinzinho Oliveira.",
    icon: Sparkles,
    accent: "bg-amber-50"
  },
  {
    id: "journey",
    title: "Sua Jornada Guiada",
    description: "Trilhe caminhos temáticos de 7 dias. Cada etapa combina trechos do livro, exercícios práticos e meditações para sua evolução.",
    icon: Map,
    accent: "bg-emerald-50"
  },
  {
    id: "notifications",
    title: "Uma pergunta para você",
    description: "Ative as notificações para receber seu convite diário à reflexão. Prometemos ser o momento mais calmo do seu dia.",
    icon: Bell,
    accent: "bg-blue-50",
    type: "notifications"
  },
  {
    id: "premium",
    title: "A Jornada Completa",
    description: "Acesse todos os capítulos do livro, jornadas guiadas exclusivas e análises profundas do seu diário com o plano Premium.",
    icon: LockKeyhole,
    accent: "bg-purple-50",
    type: "premium"
  }
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [notifications, setNotifications] = useState(true);

  const next = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = ONBOARDING_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto">
      <div className={`w-full max-w-sm aspect-[3/4] rounded-[3rem] ${current.accent} mb-12 flex items-center justify-center overflow-hidden relative shadow-inner border border-border/20 flex-shrink-0`}>
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
        <p className="text-muted-foreground leading-relaxed px-4 text-sm">
          {current.description}
        </p>

        {current.type === "notifications" && (
          <div className="pt-4 flex items-center justify-center space-x-4 animate-in slide-in-from-bottom-2">
            <span className="text-sm font-medium text-foreground">Receber lembretes</span>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        )}

        {current.type === "premium" && (
          <div className="pt-4 space-y-3 animate-in slide-in-from-bottom-2">
            <div className="bg-white/50 border border-primary/10 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                <Check size={12} className="text-green-600" /> Capítulo Incerteza
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                <Check size={12} className="text-green-600" /> Jornada da Liberdade
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase">
                <Check size={12} className="text-green-600" /> Backup na Nuvem
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-muted-foreground italic">Apenas R$ 14,90/mês ou R$ 99,00/ano</p>
              <p className="text-[9px] text-primary/60 font-medium">7 dias grátis para testar</p>
            </div>
          </div>
        )}
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
          data-testid="button-onboarding-next"
        >
          {step === ONBOARDING_STEPS.length - 1 ? "Começar Jornada" : current.type === "premium" ? "Ver planos" : "Próximo"}
          <ArrowRight className="ml-2" size={20} />
        </Button>
        
        {step > 0 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="w-full text-xs text-muted-foreground font-medium hover:text-foreground transition-colors"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );
}

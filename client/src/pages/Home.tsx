import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PenLine, Share, Heart, Meh, Frown, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [mood, setMood] = useState<string | null>(null);
  
  const today = format(new Date(), "d 'de' MMMM", { locale: ptBR });

  const moodIcons = [
    { id: "terrible", icon: Frown, label: "Difícil" },
    { id: "bad", icon: Meh, label: "Ansioso" },
    { id: "neutral", icon: Smile, label: "Calmo" },
    { id: "good", icon: Heart, label: "Grato" },
  ];

  return (
    <div className="px-6 pt-12 pb-8 flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
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
              <div className={`p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'}`}>
                <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {m.label}
              </span>
            </button>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-lg font-serif text-foreground">Uma pergunta para você hoje</h2>
        </div>
        
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <PenLine size={120} />
          </div>
          
          <div className="relative z-10 space-y-8">
            <p className="font-serif text-2xl leading-relaxed text-foreground">
              "Se você não precisasse provar nada a ninguém, o que estaria fazendo da sua vida agora?"
            </p>
            
            <div className="flex flex-col space-y-4 pt-4">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 text-base font-medium shadow-sm transition-all active:scale-[0.98]">
                <PenLine className="mr-2" size={18} />
                Refletir sobre isso
              </Button>
              <Button variant="outline" className="w-full rounded-full h-12 text-base font-medium bg-transparent border-border hover:bg-muted text-foreground transition-all">
                <Share className="mr-2" size={18} />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="pt-4 border-t border-border">
        <h2 className="text-lg font-serif text-foreground mb-4">Lembrete do dia</h2>
        <p className="text-muted-foreground leading-relaxed text-sm">
          A transição para a vida adulta não é uma corrida. É natural sentir que todos estão avançando enquanto você tenta encontrar seu próprio ritmo. Respire.
        </p>
      </section>

    </div>
  );
}

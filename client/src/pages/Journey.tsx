import { useState } from "react";
import { ChevronRight, LockKeyhole, Sparkles, CheckCircle2, Clock, BookOpen, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const JOURNEYS = [
  {
    id: 1,
    title: "A Arte da Incerteza",
    description: "7 dias para aprender a abraçar o desconhecido e transformar o medo do futuro em curiosidade.",
    duration: "7 dias",
    level: "Iniciante",
    progress: 30,
    locked: false,
    color: "bg-amber-500",
    steps: [
      { day: 1, title: "O Vazio é um Espaço", completed: true },
      { day: 2, title: "Expectativas vs Realidade", completed: true },
      { day: 3, title: "A Bússola Interna", completed: false },
      { day: 4, title: "O Peso do Amanhã", completed: false },
    ]
  },
  {
    id: 2,
    title: "Raízes da Identidade",
    description: "Descubra quem você é quando as vozes externas se calam. Um mergulho na sua essência.",
    duration: "10 dias",
    level: "Profundo",
    progress: 0,
    locked: true,
    color: "bg-purple-500",
    steps: []
  },
  {
    id: 3,
    title: "Solitude Curativa",
    description: "Transforme a solidão em uma companhia produtiva e pacífica através da meditação e escrita.",
    duration: "5 dias",
    level: "Essencial",
    progress: 0,
    locked: true,
    color: "bg-emerald-500",
    steps: []
  }
];

export default function Journey() {
  const [selectedJourney, setSelectedJourney] = useState<typeof JOURNEYS[0] | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-8 space-y-2">
        <h1 className="text-3xl font-serif text-foreground">Jornadas</h1>
        <p className="text-muted-foreground text-sm">Caminhos guiados para sua evolução pessoal.</p>
      </div>

      <div className="px-6 space-y-6">
        {JOURNEYS.map((journey) => (
          <div 
            key={journey.id}
            onClick={() => !journey.locked && setSelectedJourney(journey)}
            className={`group relative overflow-hidden rounded-[2.5rem] border p-6 transition-all duration-300 ${
              journey.locked 
                ? "bg-muted/30 border-border/50 opacity-80" 
                : "bg-card border-border hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            }`}
          >
            {journey.locked && (
              <div className="absolute top-6 right-6">
                <div className="bg-primary/10 p-2 rounded-full">
                  <LockKeyhole size={16} className="text-primary" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${journey.color} flex items-center justify-center text-white shadow-lg shadow-current/20`}>
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-foreground">{journey.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      <Clock size={10} /> {journey.duration}
                    </span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                      {journey.level}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{journey.description}"
              </p>

              {!journey.locked && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Progresso</span>
                    <span>{journey.progress}%</span>
                  </div>
                  <Progress value={journey.progress} className="h-1.5" />
                </div>
              )}

              {journey.locked ? (
                <Button className="w-full mt-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl h-12 font-medium hover:bg-primary/20">
                  Liberar com Premium
                </Button>
              ) : (
                <Button className="w-full mt-4 bg-primary text-primary-foreground rounded-2xl h-12 font-medium shadow-lg hover:shadow-primary/20">
                  Continuar Jornada
                  <ChevronRight size={18} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="mt-8 p-8 rounded-[2.5rem] bg-secondary/30 border border-dashed border-border flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary shadow-inner">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-lg">Novos Caminhos em Breve</h4>
            <p className="text-xs text-muted-foreground px-6">
              Estamos preparando jornadas sobre Amor Próprio e Propósito de Vida.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

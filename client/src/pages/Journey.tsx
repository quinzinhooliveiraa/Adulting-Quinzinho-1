import { MapPin, CheckCircle2, LockKeyhole } from "lucide-react";
import journeyHero from "@/assets/images/journey-hero.png";

const STAGES = [
  { id: 1, title: "Incerteza", desc: "O chão desaparece", status: "completed" },
  { id: 2, title: "Solidão", desc: "Aprendendo a estar só", status: "active" },
  { id: 3, title: "Identidade", desc: "Quem sou eu?", status: "locked" },
  { id: 4, title: "Ansiedade", desc: "O medo do futuro", status: "locked" },
  { id: 5, title: "Aceitação", desc: "Abraçando a realidade", status: "locked" },
  { id: 6, title: "Liberdade", desc: "O voo próprio", status: "locked" },
];

export default function Journey() {
  return (
    <div className="min-h-screen pb-10 animate-in fade-in duration-700">
      
      <div className="relative h-64 overflow-hidden rounded-b-[2.5rem] shadow-sm">
        <img 
          src={journeyHero} 
          alt="Jornada abstract background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        
        <div className="absolute bottom-8 left-6 right-6">
          <h1 className="text-4xl font-serif text-foreground mb-2">A Jornada</h1>
          <p className="text-sm text-foreground/80 font-medium">
            Seu caminho através da Casa dos 20
          </p>
        </div>
      </div>

      <div className="px-8 pt-10">
        <div className="relative border-l-2 border-border/60 ml-4 space-y-12">
          
          {STAGES.map((stage, index) => {
            const isCompleted = stage.status === "completed";
            const isActive = stage.status === "active";
            const isLocked = stage.status === "locked";

            return (
              <div key={stage.id} className="relative pl-8">
                {/* Node marker */}
                <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-background flex items-center justify-center ${
                  isCompleted ? "bg-primary" : 
                  isActive ? "bg-accent border-primary" : 
                  "bg-muted border-border"
                }`}>
                  {isCompleted && <CheckCircle2 size={12} className="text-primary-foreground absolute" />}
                  {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>

                <div className={`transition-all duration-300 ${
                  isActive ? "scale-105 origin-left" : "opacity-60"
                }`}>
                  <h3 className={`font-serif text-xl ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {index + 1}. {stage.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{stage.desc}</p>
                  
                  {isActive && (
                    <button className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full text-xs font-medium shadow-sm active:scale-95 transition-all">
                      Continuar a jornada
                    </button>
                  )}
                  
                  {isLocked && (
                    <div className="mt-3 flex items-center space-x-1.5 text-xs text-muted-foreground">
                      <LockKeyhole size={12} />
                      <span>Desbloqueia no nível anterior</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
}

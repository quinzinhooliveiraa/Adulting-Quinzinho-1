import { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, LockKeyhole, Sparkles, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen pb-24 animate-in fade-in duration-700">
      
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
                    <a href={`/journey/${stage.id}`} className="mt-4 inline-flex bg-primary text-primary-foreground rounded-full h-10 px-6 text-xs font-medium shadow-sm active:scale-95 transition-all items-center space-x-1">
                      <span>Continuar a jornada</span>
                      <ChevronRight size={14} />
                    </a>
                  )}
                  
                  {isLocked && (
                    <div className="mt-3 flex items-center space-x-1.5 text-xs text-muted-foreground font-medium">
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

      <div className="px-6 mt-12">
        <div className="p-8 rounded-[2.5rem] bg-secondary/30 border border-dashed border-border flex flex-col items-center text-center space-y-4">
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

import { useRoute, Link } from "wouter";
import { ChevronLeft, CheckCircle2, Circle, PlayCircle, BookOpen, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const JOURNEY_CONTENT: Record<string, any> = {
  "1": {
    title: "Incerteza",
    subtitle: "O chão desaparece",
    description: "Nesta etapa, exploramos como lidar com a sensação de estar perdido e sem rumo no início dos 20 anos.",
    progress: 100,
    tasks: [
      { id: 1, title: "Leitura: O Vazio é um Espaço", type: "read", completed: true },
      { id: 2, title: "Reflexão: O que eu temo hoje?", type: "write", completed: true },
      { id: 3, title: "Meditação: Presença no Caos", type: "audio", completed: true },
    ]
  },
  "2": {
    title: "Solidão",
    subtitle: "Aprendendo a estar só",
    description: "Descubra a diferença entre sentir-se sozinho e desfrutar da sua própria companhia.",
    progress: 45,
    tasks: [
      { id: 1, title: "Leitura: A Solitude Curativa", type: "read", completed: true },
      { id: 2, title: "Exercício: 15 minutos de silêncio", type: "action", completed: false },
      { id: 3, title: "Escrita: Carta para meu eu futuro", type: "write", completed: false },
      { id: 4, title: "Áudio: O som do silêncio", type: "audio", completed: false },
    ]
  }
};

export default function JourneyDetail() {
  const [, params] = useRoute("/journey/:id");
  const id = params?.id || "1";
  const content = JOURNEY_CONTENT[id] || JOURNEY_CONTENT["1"];

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-500">
      <div className="px-6 pt-12 pb-6 flex items-center gap-4">
        <Link href="/journey">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft size={24} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-foreground">{content.title}</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{content.subtitle}</p>
        </div>
      </div>

      <div className="px-6 space-y-8">
        <section className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Progresso da Etapa</p>
              <h3 className="font-serif text-lg text-foreground">{content.progress}% concluído</h3>
            </div>
            <Sparkles size={20} className="text-primary opacity-40" />
          </div>
          <Progress value={content.progress} className="h-2 bg-primary/10" />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-serif text-muted-foreground uppercase tracking-wider px-2">Atividades de Hoje</h2>
          <div className="space-y-3">
            {content.tasks.map((task: any) => (
              <div 
                key={task.id}
                className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${
                  task.completed 
                    ? "bg-secondary/20 border-transparent opacity-70" 
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  task.completed ? "bg-green-100 text-green-600" : "bg-primary/5 text-primary"
                }`}>
                  {task.type === 'read' && <BookOpen size={18} />}
                  {task.type === 'write' && <PenLine size={18} />}
                  {task.type === 'audio' && <PlayCircle size={18} />}
                  {task.type === 'action' && <Sparkles size={18} />}
                </div>
                
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    {task.type === 'read' ? 'Leitura' : task.type === 'write' ? 'Escrita' : task.type === 'audio' ? 'Áudio' : 'Prática'}
                  </p>
                </div>

                {task.completed ? (
                  <CheckCircle2 size={20} className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-muted-foreground opacity-20" />
                )}
              </div>
            ))}
          </div>
        </section>

        {!content.tasks.every((t: any) => t.completed) && (
          <Button className="w-full bg-primary text-primary-foreground rounded-full h-14 text-lg font-medium shadow-lg active:scale-95 transition-all">
            Próxima Atividade
          </Button>
        )}
      </div>
    </div>
  );
}

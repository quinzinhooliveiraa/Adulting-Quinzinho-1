import { useState } from "react";
import { Search, PenLine, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_ENTRIES = [
  {
    id: 1,
    date: "Ontem",
    preview: "Acho que estou me cobrando demais sobre onde eu deveria estar aos 25. Todo mundo parece ter um plano...",
    tags: ["ansiedade", "identidade"]
  },
  {
    id: 2,
    date: "12 de Março",
    preview: "Hoje percebi que a solidão não precisa ser vazia. Foi bom ter um momento só para mim.",
    tags: ["solidão", "crescimento"]
  },
  {
    id: 3,
    date: "05 de Março",
    preview: "O que é sucesso para mim? Talvez não seja o que meus pais esperavam.",
    tags: ["propósito"]
  }
];

const TAGS = ["Todas", "ansiedade", "propósito", "identidade", "solidão", "crescimento", "amor"];

export default function Journal() {
  const [activeTag, setActiveTag] = useState("Todas");

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-500">
      <div className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-background/90 backdrop-blur-xl z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-foreground">Diário</h1>
          <Button size="icon" className="rounded-full bg-primary text-primary-foreground w-10 h-10 shadow-sm active:scale-95 transition-transform">
            <PenLine size={18} />
          </Button>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                activeTag === tag 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4 pb-8">
        {MOCK_ENTRIES.filter(e => activeTag === "Todas" || e.tags.includes(activeTag)).map(entry => (
          <div 
            key={entry.id} 
            className="group p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            data-testid={`journal-entry-${entry.id}`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {entry.date}
              </span>
              <ChevronRight size={16} className="text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            
            <p className="text-foreground text-base leading-relaxed mb-4 line-clamp-3">
              "{entry.preview}"
            </p>
            
            <div className="flex flex-wrap gap-2">
              {entry.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-8 p-6 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center space-y-3 opacity-60">
          <PenLine size={24} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sua mente é um espaço seguro.<br/>O que você precisa libertar hoje?
          </p>
        </div>
      </div>
    </div>
  );
}

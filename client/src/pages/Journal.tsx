import { useState, useEffect } from "react";
import { Search, PenLine, ChevronRight, X, Hash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Simple mock logic for auto-tagging
const analyzeTextForTags = (text: string) => {
  const lowerText = text.toLowerCase();
  const foundTags = new Set<string>();
  
  if (lowerText.match(/medo|futuro|ansioso|ansiedade|preocupa|nervoso/)) foundTags.add("ansiedade");
  if (lowerText.match(/objetivo|sentido|carreira|trabalho|fazer da vida|propósito/)) foundTags.add("propósito");
  if (lowerText.match(/amor|namorado|namorada|relacionamento|casamento|amigo/)) foundTags.add("relações");
  if (lowerText.match(/eu mesmo|quem sou|minha essência|autêntico|identidade/)) foundTags.add("identidade");
  if (lowerText.match(/sozinho|solitário|solitude|solidão|isolado/)) foundTags.add("solidão");
  if (lowerText.match(/aprender|evoluir|mudar|crescer|melhorar|crescimento/)) foundTags.add("crescimento");
  if (lowerText.match(/não sei|dúvida|incerteza|confuso|perdido/)) foundTags.add("incerteza");

  return Array.from(foundTags).slice(0, 3);
};

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

const TAGS = ["Todas", "ansiedade", "propósito", "identidade", "solidão", "crescimento", "amor", "incerteza", "relações"];

export default function Journal() {
  const [activeTag, setActiveTag] = useState("Todas");
  const [isWriting, setIsWriting] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (entryText.length > 15) {
      const tags = analyzeTextForTags(entryText);
      setSuggestedTags(tags.filter(t => !selectedTags.includes(t)));
    } else {
      setSuggestedTags([]);
    }
  }, [entryText, selectedTags]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (!entryText.trim()) return;
    setIsSaved(true);
    setTimeout(() => {
      setIsWriting(false);
      setEntryText("");
      setSelectedTags([]);
      setIsSaved(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-500 pb-24">
      <div className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-foreground">Diário</h1>
        </div>

        {!isWriting && (
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
        )}
      </div>

      <div className="px-6 space-y-4">
        {isWriting ? (
          <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Nova Reflexão</h2>
              <Button 
                onClick={() => setIsWriting(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </Button>
            </div>
            <div className="relative">
              <Textarea 
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                placeholder="Como você está se sentindo agora?"
                className="min-h-[300px] bg-card/50 border-border/80 focus:border-primary/50 focus:ring-primary/20 rounded-3xl p-6 text-lg font-serif leading-relaxed resize-none shadow-inner"
                autoFocus
              />
              {isSaved && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-3xl z-10 animate-in fade-in">
                  <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-xl scale-110">
                    <Check size={32} />
                  </div>
                </div>
              )}
            </div>

            {(suggestedTags.length > 0 || selectedTags.length > 0) && (
              <div className="space-y-3 px-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} /> Temas Identificados
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2 transition-all"
                    >
                      {tag} <X size={12} className="opacity-70" />
                    </button>
                  ))}
                  {suggestedTags.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="text-xs px-4 py-2 rounded-full bg-secondary text-secondary-foreground border border-dashed border-primary/30 font-medium hover:bg-primary/10 transition-all animate-in zoom-in"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleSave}
              disabled={!entryText.trim() || isSaved}
              className="w-full bg-primary text-primary-foreground rounded-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              {isSaved ? "Reflexão Guardada" : "Guardar no Diário"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-700">
            {MOCK_ENTRIES.filter(e => activeTag === "Todas" || e.tags.includes(activeTag)).map(entry => (
              <div 
                key={entry.id} 
                className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                data-testid={`journal-entry-${entry.id}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                    {entry.date}
                  </span>
                  <ChevronRight size={18} className="text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                
                <p className="text-foreground text-lg leading-relaxed mb-6 line-clamp-3 font-serif italic">
                  "{entry.preview}"
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-bold uppercase tracking-tighter">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-8 p-10 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="p-4 rounded-full bg-muted">
                <PenLine size={32} className="text-muted-foreground" />
              </div>
              <p className="font-serif text-lg text-muted-foreground italic">
                Sua mente é um espaço sagrado.<br/>O que você precisa libertar hoje?
              </p>
            </div>
          </div>
        )}
      </div>

      {!isWriting && (
        <div className="fixed bottom-24 right-6 z-40 animate-in zoom-in slide-in-from-bottom-4 duration-500">
          <Button 
            onClick={() => setIsWriting(true)}
            size="icon" 
            className="rounded-full bg-primary text-primary-foreground w-14 h-14 shadow-2xl hover:shadow-primary/20 active:scale-95 transition-all border-4 border-background"
          >
            <PenLine size={24} />
          </Button>
        </div>
      )}
    </div>
  );
}

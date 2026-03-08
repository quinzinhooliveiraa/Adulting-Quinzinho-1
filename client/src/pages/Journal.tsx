import { useState, useEffect } from "react";
import { Search, PenLine, ChevronRight, X, Hash, Check, Share2, Trash2, Edit2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { shareEntry } from "@/utils/journalStorage";
import { addNotification } from "@/utils/notificationService";
import BlogReflectionEditor from "@/components/BlogReflectionEditor";
import NotebookEditor from "@/components/NotebookEditor";
import { useAuth } from "@/hooks/useAuth";
import { useJournalEntries, useCreateEntry, useUpdateEntry, useDeleteEntry } from "@/hooks/useJournal";
import type { JournalEntry } from "@shared/schema";

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

const TAGS = ["Todas", "ansiedade", "propósito", "identidade", "solidão", "crescimento", "amor", "incerteza", "relações"];

interface LocalJournalEntry {
  id: number | string;
  date: string;
  text: string;
  tags: string[];
  mood?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  userId?: string;
  timestamp?: number;
}

export default function Journal() {
  const { user } = useAuth();
  const { data: apiEntries = [], isLoading } = useJournalEntries();
  const createEntryMut = useCreateEntry();
  const updateEntryMut = useUpdateEntry();
  const deleteEntryMut = useDeleteEntry();

  const [activeTag, setActiveTag] = useState("Todas");
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [entryText, setEntryText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LocalJournalEntry | null>(null);
  const [showNotebook, setShowNotebook] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showShare, setShowShare] = useState<string | number | null>(null);

  const entries: LocalJournalEntry[] = apiEntries.map(e => ({
    ...e,
    date: e.date || new Date(e.createdAt).toLocaleDateString("pt-BR"),
  }));

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

  const handleSave = async () => {
    if (!entryText.trim()) return;
    
    let finalTags = selectedTags;
    if (selectedTags.length === 0 && suggestedTags.length > 0) {
      finalTags = [suggestedTags[0]];
      setSelectedTags(finalTags);
    }

    try {
      if (isEditing) {
        await updateEntryMut.mutateAsync({ id: isEditing, text: entryText, tags: finalTags });
        setIsEditing(null);
      } else {
        await createEntryMut.mutateAsync({ text: entryText, tags: finalTags });
      }
    } catch {
      // Will show error via UI
    }

    addNotification({
      type: "journal",
      title: "✍️ Diário Atualizado",
      message: isEditing ? "Sua reflexão foi atualizada!" : "Nova reflexão adicionada ao diário!",
    });
    
    setIsSaved(true);
    setTimeout(() => {
      setIsWriting(false);
      setEntryText("");
      setSelectedTags([]);
      setIsSaved(false);
    }, 1500);
  };

  const handleEdit = (entry: LocalJournalEntry) => {
    setIsEditing(entry.id as number);
    setEntryText(entry.text);
    setSelectedTags(entry.tags);
    setIsWriting(true);
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Tem certeza que deseja deletar esta entrada?")) {
      try {
        await deleteEntryMut.mutateAsync(id as number);
      } catch {
        // Error handling
      }
    }
  };

  const handleShare = (entry: LocalJournalEntry, platform: string) => {
    const shareData = { id: String(entry.id), date: entry.date, text: entry.text, tags: entry.tags, timestamp: Date.now() };
    const url = shareEntry(shareData, platform);
    if (platform === "instagram") {
      const text = `"${entry.text}"\n\n— Casa dos 20 (@quinzinhooliveiraa_)`;
      navigator.clipboard.writeText(text);
      alert("Texto copiado! Cole no Instagram direto.");
    } else {
      window.open(url, "_blank");
    }
    setShowShare(null);
  };

  const filteredEntries = activeTag === "Todas" ? entries : entries.filter(e => e.tags.includes(activeTag));

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-500 pb-24">
      <div className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-foreground">Diário</h1>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            {entries.length} entradas
          </span>
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
        {isWriting && !showNotebook ? (
          <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {isEditing ? "Editar" : "Nova"} Reflexão
              </h2>
              <Button 
                onClick={() => {
                  setIsWriting(false);
                  setIsEditing(null);
                  setEntryText("");
                  setSelectedTags([]);
                }}
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

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  if (entryText.trim()) {
                    setEditingEntry({ 
                      id: isEditing || 0, 
                      text: entryText, 
                      tags: selectedTags, 
                      date: "", 
                      timestamp: Date.now() 
                    });
                    setShowBlogEditor(true);
                  } else {
                    setEditingEntry({ 
                      id: 0, 
                      text: "", 
                      tags: [], 
                      date: "", 
                      timestamp: Date.now() 
                    });
                    setShowBlogEditor(true);
                  }
                }}
                className="flex-1 bg-primary text-primary-foreground rounded-full h-14 font-medium shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
              >
                Abrir Editor Completo
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!entryText.trim() || isSaved}
                variant="outline"
                className="rounded-full h-14 px-6 font-medium"
              >
                {isSaved ? "Guardado!" : "Salvar Rápido"}
              </Button>
            </div>
          </div>
        ) : (
          <>
          <div className="space-y-4 animate-in fade-in duration-700">
            {filteredEntries.length > 0 ? (
              filteredEntries.map(entry => (
                <div 
                  key={entry.id} 
                  className="group p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300"
                  data-testid={`journal-entry-${entry.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                      {entry.date}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setShowShare(entry.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Compartilhar"
                      >
                        <Share2 size={16} className="text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-foreground text-lg leading-relaxed mb-6 font-serif italic">
                    "{entry.text}"
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-bold uppercase tracking-tighter">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {showShare === entry.id && (
                    <div className="mt-4 flex gap-2 animate-in slide-in-from-bottom">
                      <Button
                        size="sm"
                        onClick={() => handleShare(entry, "twitter")}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Twitter
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleShare(entry, "substack")}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Substack
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleShare(entry, "instagram")}
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                      >
                        Instagram
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="mt-8 p-10 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="p-4 rounded-full bg-muted">
                  <PenLine size={32} className="text-muted-foreground" />
                </div>
                <p className="font-serif text-lg text-muted-foreground italic">
                  Sua mente é um espaço sagrado.<br/>O que você precisa libertar hoje?
                </p>
              </div>
            )}
          </div>
          </>
        )}

      {showNotebook && (
        <NotebookEditor
          initialContent={entryText}
          onClose={() => setShowNotebook(false)}
          onSave={(content) => {
            setEntryText(content);
            setShowNotebook(false);
          }}
        />
      )}

      {showBlogEditor && editingEntry && (
        <BlogReflectionEditor
          initialTitle={editingEntry.text.substring(0, 50)}
          initialText={editingEntry.text}
          topic={editingEntry.text}
          showTitleEdit={true}
          origin="Do Diário"
          onClose={() => {
            setShowBlogEditor(false);
            setEditingEntry(null);
          }}
          onSave={async (title, content, tags) => {
            const finalTags = tags.length > 0 ? tags : editingEntry.tags;
            try {
              if (isEditing) {
                await updateEntryMut.mutateAsync({ id: isEditing, text: content, tags: finalTags });
              } else {
                await createEntryMut.mutateAsync({ text: content, tags: finalTags });
              }
            } catch {
              // Error handling
            }
            addNotification({
              type: "journal",
              title: "✍️ Pensamento Guardado",
              message: `"${title}" foi salvo com sucesso!`,
            });
            setIsWriting(false);
            setEntryText("");
            setSelectedTags([]);
            setIsEditing(null);
            setShowBlogEditor(false);
            setEditingEntry(null);
          }}
        />
      )}

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
    </div>
  );
}

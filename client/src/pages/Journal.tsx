import { useState, useEffect } from "react";
import { Search, PenLine, ChevronRight, X, Hash, Check, Share2, Trash2, Edit2, ImagePlus, Archive, ChevronDown, Eye, Crown } from "lucide-react";
import AudioButton from "@/components/AudioButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { shareEntry } from "@/utils/journalStorage";
import { addNotification } from "@/utils/notificationService";
import BlogReflectionEditor from "@/components/BlogReflectionEditor";
import NotebookEditor from "@/components/NotebookEditor";
import { useAuth } from "@/hooks/useAuth";
import { useJournalEntries, useCreateEntry, useUpdateEntry, useDeleteEntry } from "@/hooks/useJournal";
import { useQuery } from "@tanstack/react-query";
import type { JournalEntry } from "@shared/schema";

function JournalUpgradePopup({ limit, onClose }: { limit: number; onClose: () => void }) {
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/stripe/products"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/products");
      return res.json();
    },
    staleTime: 60000,
  });
  const monthlyPrice = products.find((p: any) => p.recurring?.interval === "month");
  const yearlyPrice = products.find((p: any) => p.recurring?.interval === "year");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    const price = selectedPlan === "yearly" ? yearlyPrice : monthlyPrice;
    if (!price) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId: price.price_id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
    setLoading(false);
  };

  const yearlyMonthly = yearlyPrice ? (parseFloat(yearlyPrice.unit_amount) / 100 / 12).toFixed(2).replace(".", ",") : "6,66";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4 border border-border shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
            <Crown size={24} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-serif text-foreground">Limite Mensal Atingido</h3>
          <p className="text-sm text-muted-foreground">
            Você usou todas as suas {limit} reflexões gratuitas deste mês.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`w-full p-3 rounded-xl border-2 transition-all text-left relative ${
              selectedPlan === "yearly" ? "border-amber-500 bg-amber-500/5" : "border-border"
            }`}
            data-testid="plan-yearly-journal"
          >
            <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold">
              MELHOR VALOR
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">R$79,90</span>
              <span className="text-xs text-muted-foreground">/ano</span>
            </div>
            <p className="text-[11px] text-muted-foreground">R${yearlyMonthly}/mês</p>
          </button>

          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
              selectedPlan === "monthly" ? "border-amber-500 bg-amber-500/5" : "border-border"
            }`}
            data-testid="plan-monthly-journal"
          >
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">R$9,90</span>
              <span className="text-xs text-muted-foreground">/mês</span>
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleSubscribe}
            disabled={loading || (!monthlyPrice && !yearlyPrice)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-semibold text-center active:scale-[0.98] transition-transform disabled:opacity-50"
            data-testid="button-upgrade-journal"
          >
            {loading ? "Redirecionando..." : "Assinar Premium"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-muted-foreground"
            data-testid="button-close-upgrade"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function extractCleanText(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.text === "string") return parsed.text;
  } catch {}
  return raw;
}

const analyzeTextForTags = (text: string) => {
  const cleanText = extractCleanText(text);
  const lowerText = cleanText.toLowerCase();
  const foundTags = new Set<string>();
  
  if (lowerText.match(/\b(medo|futuro|ansioso|ansiedade|preocupa\w*|nervos\w*)\b/)) foundTags.add("ansiedade");
  if (lowerText.match(/\b(objetivo|sentido|carreira|trabalho|propósito)\b|fazer da vida/)) foundTags.add("propósito");
  if (lowerText.match(/\b(namorad[oa]|relacionamento|casamento|amig[oa]s?)\b/)) foundTags.add("relações");
  if (lowerText.match(/\b(identidade|autêntic[oa])\b|eu mesmo|quem sou|minha essência/)) foundTags.add("identidade");
  if (lowerText.match(/\b(sozinho|solitári[oa]|solitude|solidão|isolad[oa])\b/)) foundTags.add("solidão");
  if (lowerText.match(/\b(aprender|evoluir|mudar|crescer|melhorar|crescimento)\b/)) foundTags.add("crescimento");
  if (lowerText.match(/\b(dúvida|incerteza|confus[oa]|perdid[oa])\b|não sei/)) foundTags.add("incerteza");
  if (lowerText.match(/\b(amoro|amorad[oa]|amoroso|apaixonad[oa]|paixão|coração)\b/)) foundTags.add("amor");

  return Array.from(foundTags).slice(0, 3);
};

function getEntryTitle(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.text) {
      const rawText = parsed.text;
      const firstLine = rawText.split('\n')[0].trim();
      return firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine || "Reflexão sem título";
    }
  } catch {}
  const firstLine = text.split('\n')[0].trim();
  return firstLine.length > 60 ? firstLine.substring(0, 60) + "..." : firstLine || "Reflexão sem título";
}

function getEntrySummary(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.text) {
      const rawText = parsed.text;
      const lines = rawText.split('\n').filter((l: string) => l.trim());
      const summary = lines.slice(0, 3).join(' ').trim();
      return summary.length > 120 ? summary.substring(0, 120) + "..." : summary;
    }
  } catch {}
  const lines = text.split('\n').filter((l: string) => l.trim());
  const summary = lines.slice(0, 3).join(' ').trim();
  return summary.length > 120 ? summary.substring(0, 120) + "..." : summary;
}

function hasImages(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    return parsed && ((parsed.images && parsed.images.length > 0) || parsed.banner);
  } catch {}
  return false;
}

function getFirstImage(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed?.banner) return parsed.banner;
    if (parsed?.images && parsed.images.length > 0) return parsed.images[0].src;
  } catch {}
  return null;
}

const SOURCE_CATEGORIES = [
  { key: "Todas", label: "Todas", icon: null },
  { key: "diario", label: "Diário", icon: "📝" },
  { key: "perguntas", label: "Perguntas", icon: "💬" },
  { key: "jornada", label: "Jornadas", icon: "🗺️" },
];

function getEntrySource(entry: { tags: string[] }): string {
  if (entry.tags.includes("perguntas") || entry.tags.includes("reflexão")) return "perguntas";
  if (entry.tags.includes("jornada")) return "jornada";
  return "diario";
}

function getSourceLabel(source: string): string {
  const cat = SOURCE_CATEGORIES.find(c => c.key === source);
  return cat?.label || source;
}

function getSourceColor(source: string): string {
  switch (source) {
    case "perguntas": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "jornada": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
    default: return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
  }
}

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
  const isPremium = user?.hasPremium || user?.role === "admin";
  const { data: apiEntries = [], isLoading } = useJournalEntries();
  const createEntryMut = useCreateEntry();
  const updateEntryMut = useUpdateEntry();
  const deleteEntryMut = useDeleteEntry();
  const [journalLimit, setJournalLimit] = useState<{ count: number; limit: number | null; remaining: number | null } | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      fetch("/api/journal/limit", { credentials: "include" })
        .then(r => r.json())
        .then(data => setJournalLimit(data))
        .catch(() => {});
    }
  }, [isPremium, apiEntries.length]);

  const [activeTag, setActiveTag] = useState("Todas");
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);

  useEffect(() => {
    if (isWriting) {
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.top = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isWriting]);
  const [entryText, setEntryText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBlogEditor, setShowBlogEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LocalJournalEntry | null>(null);
  const [showNotebook, setShowNotebook] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showShare, setShowShare] = useState<string | number | null>(null);
  const [viewingEntry, setViewingEntry] = useState<LocalJournalEntry | null>(null);
  const [archivedIds, setArchivedIds] = useState<Set<number | string>>(() => {
    try {
      const stored = localStorage.getItem("casa-dos-20-archived-entries");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [showArchived, setShowArchived] = useState(false);

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
    } catch {}

    addNotification({
      type: "journal",
      title: "Diário Atualizado",
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
    setViewingEntry(null);
    let textToEdit = entry.text;
    try {
      const parsed = JSON.parse(entry.text);
      if (parsed && parsed.text !== undefined) {
        setEditingEntry({
          ...entry,
          text: entry.text,
        });
        setIsEditing(entry.id as number);
        setShowBlogEditor(true);
        return;
      }
    } catch {}
    setIsEditing(entry.id as number);
    setEntryText(textToEdit);
    setSelectedTags(entry.tags);
    setIsWriting(true);
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Tem certeza que deseja deletar esta entrada?")) {
      try {
        await deleteEntryMut.mutateAsync(id as number);
        setViewingEntry(null);
      } catch {}
    }
  };

  const handleArchive = (id: number | string) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("casa-dos-20-archived-entries", JSON.stringify(Array.from(next)));
      return next;
    });
    setViewingEntry(null);
  };

  const handleShare = async (entry: LocalJournalEntry, platform: string) => {
    const plainText = getEntrySummary(entry.text);
    if (platform === "native" && navigator.share) {
      try {
        await navigator.share({
          title: "Casa dos 20 — Diário",
          text: `"${plainText}"\n\n— Casa dos 20`,
        });
        setShowShare(null);
        return;
      } catch {}
    }
    const shareData = { id: String(entry.id), date: entry.date, text: plainText, tags: entry.tags, timestamp: Date.now() };
    const url = shareEntry(shareData, platform);
    if (platform === "instagram") {
      const text = `"${plainText}"\n\n— Casa dos 20 (@quinzinhooliveiraa_)`;
      navigator.clipboard.writeText(text);
      alert("Texto copiado! Cole no Instagram direto.");
    } else {
      window.open(url, "_blank");
    }
    setShowShare(null);
  };

  const handleOpenEntry = (entry: LocalJournalEntry) => {
    setViewingEntry(entry);
  };

  const filteredEntries = activeTag === "Todas"
    ? entries
    : entries.filter(e => getEntrySource(e) === activeTag);
  const visibleEntries = showArchived 
    ? filteredEntries.filter(e => archivedIds.has(e.id))
    : filteredEntries.filter(e => !archivedIds.has(e.id));

  const renderEntryContent = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.text !== undefined) {
        const allImages: any[] = parsed.images || [];
        const wrappedImages = allImages.filter((img: any) => img.textWrap);
        const freeImages = allImages.filter((img: any) => !img.textWrap);
        const contentMinHeight = allImages.length > 0
          ? Math.max(200, ...allImages.map((img: any) => (img.y || 0) + (img.height || 200) + 24))
          : undefined;

        return (
          <div className="space-y-5">
            {parsed.banner && (
              <img src={parsed.banner} alt="" className="w-full rounded-2xl object-cover" style={{ maxHeight: 320 }} />
            )}
            {parsed.title && (
              <h2 className="text-2xl font-serif font-semibold text-foreground leading-tight">{parsed.title}</h2>
            )}
            <div className="relative overflow-hidden" style={{ minHeight: contentMinHeight }}>
              {wrappedImages.map((img: any, i: number) => {
                const side = (img.x || 0) < 150 ? 'left' : 'right';
                return (
                  <img
                    key={`wrap-${i}`}
                    src={img.src}
                    alt=""
                    className="rounded-xl"
                    style={{
                      float: side,
                      width: `${img.width || 200}px`,
                      height: `${img.height || 200}px`,
                      objectFit: (img.fit as any) || 'cover',
                      margin: side === 'left' ? '0 16px 12px 0' : '0 0 12px 16px',
                      marginTop: `${Math.max(0, (img.y || 0))}px`,
                      transform: img.rotation ? `rotate(${img.rotation}deg)` : undefined,
                      maxWidth: '60%',
                    }}
                  />
                );
              })}
              <div className="text-foreground text-[17px] leading-relaxed font-serif whitespace-pre-wrap break-words" style={{ position: 'relative', zIndex: 1 }}>
                {parsed.text}
              </div>
              {freeImages.map((img: any, i: number) => (
                <img
                  key={`free-${i}`}
                  src={img.src}
                  alt=""
                  className="absolute rounded-xl"
                  style={{
                    left: `${img.x || 0}px`,
                    top: `${img.y || 0}px`,
                    width: `${img.width || 200}px`,
                    height: `${img.height || 200}px`,
                    objectFit: (img.fit as any) || 'cover',
                    transform: img.rotation ? `rotate(${img.rotation}deg)` : undefined,
                    zIndex: img.zIndex || 10,
                  }}
                />
              ))}
              {parsed.drawing && (
                <img src={parsed.drawing} alt="" className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: 'fill', zIndex: 2 }} />
              )}
            </div>
          </div>
        );
      }
    } catch {}
    return (
      <div className="text-foreground text-[17px] leading-relaxed font-serif whitespace-pre-wrap break-words">
        {text}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-500 pb-24 overflow-x-hidden">
      <div className="px-6 md:px-10 pt-12 pb-6 space-y-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20 overflow-x-hidden">
        {!isPremium && journalLimit && journalLimit.remaining !== null && (
          <div className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
            journalLimit.remaining <= 3
              ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              : "bg-muted text-muted-foreground"
          }`} data-testid="journal-limit-banner">
            <PenLine size={12} />
            {journalLimit.remaining > 0
              ? `${journalLimit.remaining} reflexão${journalLimit.remaining !== 1 ? "ões" : ""} gratuita${journalLimit.remaining !== 1 ? "s" : ""} restante${journalLimit.remaining !== 1 ? "s" : ""} este mês`
              : "Limite mensal atingido — assine o premium para continuar"}
          </div>
        )}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif text-foreground">Diário</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                showArchived 
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-toggle-archived"
            >
              <Archive size={12} className="inline mr-1" />
              {showArchived ? "Arquivadas" : "Arquivo"}
            </button>
            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
              {visibleEntries.length} entradas
            </span>
          </div>
        </div>

        {!isWriting && !viewingEntry && (
          <div className="overflow-hidden">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {SOURCE_CATEGORIES.map(cat => {
                const count = cat.key === "Todas" ? entries.length : entries.filter(e => getEntrySource(e) === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveTag(cat.key)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-all duration-300 flex items-center gap-1.5 ${
                      activeTag === cat.key
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "bg-card border border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`filter-${cat.key}`}
                  >
                    {cat.icon && <span className="text-xs">{cat.icon}</span>}
                    <span>{cat.label}</span>
                    <span className={`text-[10px] ${activeTag === cat.key ? "opacity-80" : "opacity-50"}`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 md:px-10 space-y-4 overflow-x-hidden">
        {viewingEntry ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setViewingEntry(null)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ChevronDown size={16} className="rotate-90" /> Voltar
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(viewingEntry)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar"
                  data-testid="button-edit-entry"
                >
                  <Edit2 size={16} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleArchive(viewingEntry.id)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title={archivedIds.has(viewingEntry.id) ? "Desarquivar" : "Arquivar"}
                  data-testid="button-archive-entry"
                >
                  <Archive size={16} className={archivedIds.has(viewingEntry.id) ? "text-amber-500" : "text-muted-foreground"} />
                </button>
                <button
                  onClick={() => setShowShare(viewingEntry.id)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Compartilhar"
                  data-testid="button-share-entry"
                >
                  <Share2 size={16} className="text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(viewingEntry.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Deletar"
                  data-testid="button-delete-entry"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                {viewingEntry.date}
              </span>
              
              {renderEntryContent(viewingEntry.text)}

              <div className="flex flex-wrap gap-2 pt-2">
                <span className={`text-[10px] px-3 py-1.5 rounded-full border font-bold uppercase tracking-tighter ${getSourceColor(getEntrySource(viewingEntry))}`}>
                  {getSourceLabel(getEntrySource(viewingEntry))}
                </span>
                {viewingEntry.tags.filter(t => !["perguntas", "reflexão", "jornada"].includes(t)).map(tag => (
                  <span key={tag} className="text-[10px] px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-bold uppercase tracking-tighter">
                    #{tag}
                  </span>
                ))}
              </div>

              {showShare === viewingEntry.id && (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom">
                  {typeof navigator !== "undefined" && navigator.share && (
                    <Button size="sm" onClick={() => handleShare(viewingEntry, "native")} className="flex-1 bg-foreground hover:bg-foreground/90 text-background" data-testid="button-share-native">Compartilhar</Button>
                  )}
                  <Button size="sm" onClick={() => handleShare(viewingEntry, "twitter")} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">Twitter</Button>
                  <Button size="sm" onClick={() => handleShare(viewingEntry, "substack")} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">Substack</Button>
                  <Button size="sm" onClick={() => handleShare(viewingEntry, "instagram")} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">Instagram</Button>
                </div>
              )}
            </div>
          </div>
        ) : isWriting && !showNotebook ? (
          <div className="fixed inset-0 z-[55] bg-background flex flex-col animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-6 pt-12 pb-4 border-b border-border/40">
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
                <X size={18} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-5 overscroll-contain">
              <div className="relative">
                <Textarea 
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder="Como você está se sentindo agora?"
                  className="min-h-[250px] bg-card/50 border-border/80 focus:border-primary/50 focus:ring-primary/20 rounded-3xl p-6 pr-12 text-lg font-serif leading-relaxed resize-none shadow-inner"
                  autoFocus
                />
                <div className="absolute top-4 right-4">
                  <AudioButton 
                    onText={(text) => setEntryText(prev => prev ? prev.trimEnd() + " " + text : text)}
                    size={20}
                  />
                </div>
                {isSaved && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-3xl z-10 animate-in fade-in">
                    <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-xl scale-110">
                      <Check size={32} />
                    </div>
                  </div>
                )}
              </div>

              {(suggestedTags.length > 0 || selectedTags.length > 0) && (
                <div className="space-y-3 overflow-hidden">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} /> Temas Identificados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="text-xs px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2 transition-all max-w-full"
                      >
                        <span className="truncate">{tag}</span> <X size={12} className="opacity-70 shrink-0" />
                      </button>
                    ))}
                    {suggestedTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="text-xs px-4 py-2 rounded-full bg-secondary text-secondary-foreground border border-dashed border-primary/30 font-medium hover:bg-primary/10 transition-all animate-in zoom-in max-w-full"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-border/40 bg-background">
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
            {visibleEntries.length > 0 ? (
              visibleEntries.map(entry => {
                const title = getEntryTitle(entry.text);
                const summary = getEntrySummary(entry.text);
                const thumbnail = getFirstImage(entry.text);
                const isArchived = archivedIds.has(entry.id);
                
                return (
                  <div 
                    key={entry.id} 
                    className="group p-5 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99]"
                    onClick={() => handleOpenEntry(entry)}
                    data-testid={`journal-entry-${entry.id}`}
                  >
                    <div className="flex gap-4">
                      {thumbnail && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                            {entry.date}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={14} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleArchive(entry.id)}
                              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                              title={isArchived ? "Desarquivar" : "Arquivar"}
                            >
                              <Archive size={14} className={isArchived ? "text-amber-500" : "text-muted-foreground"} />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                        
                        <h3 className="text-base font-serif text-foreground font-medium leading-snug mb-1 line-clamp-1">
                          {title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {summary}
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`text-[9px] px-2 py-1 rounded-full border font-bold uppercase tracking-tighter ${getSourceColor(getEntrySource(entry))}`}>
                            {getSourceLabel(getEntrySource(entry))}
                          </span>
                          {entry.tags.filter(t => !["perguntas", "reflexão", "jornada"].includes(t)).map(tag => (
                            <span key={tag} className="text-[9px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-bold uppercase tracking-tighter">
                              #{tag}
                            </span>
                          ))}
                          {hasImages(entry.text) && (
                            <span className="text-[9px] px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter">
                              <ImagePlus size={9} className="inline mr-0.5" /> fotos
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground/50 shrink-0 mt-3" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="mt-8 p-10 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="p-4 rounded-full bg-muted">
                  <PenLine size={32} className="text-muted-foreground" />
                </div>
                <p className="font-serif text-lg text-muted-foreground italic">
                  {showArchived 
                    ? "Nenhuma reflexão arquivada ainda." 
                    : "Sua mente é um espaço sagrado.\nO que você precisa libertar hoje?"}
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
          initialTitle={getEntryTitle(editingEntry.text)}
          initialText={(() => {
            try {
              const parsed = JSON.parse(editingEntry.text);
              if (parsed && parsed.text !== undefined) return parsed.text;
            } catch {}
            return editingEntry.text;
          })()}
          initialImages={(() => {
            try {
              const parsed = JSON.parse(editingEntry.text);
              if (parsed && parsed.images) return parsed.images;
            } catch {}
            return undefined;
          })()}
          initialBanner={(() => {
            try {
              const parsed = JSON.parse(editingEntry.text);
              if (parsed && parsed.banner) return parsed.banner;
            } catch {}
            return undefined;
          })()}
          initialDrawing={(() => {
            try {
              const parsed = JSON.parse(editingEntry.text);
              if (parsed && parsed.drawing) return parsed.drawing;
            } catch {}
            return undefined;
          })()}
          topic={editingEntry.text}
          showTitleEdit={true}
          origin="Do Diário"
          onClose={() => {
            setShowBlogEditor(false);
            setEditingEntry(null);
          }}
          onSave={async (title, content, tags) => {
            const finalTags = tags.length > 0 ? tags : editingEntry.tags;
            if (isEditing) {
              await updateEntryMut.mutateAsync({ id: isEditing, text: content, tags: finalTags });
            } else {
              await createEntryMut.mutateAsync({ text: content, tags: finalTags });
            }
            addNotification({
              type: "journal",
              title: "Pensamento Guardado",
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

      {showUpgradePopup && (
        <JournalUpgradePopup
          limit={journalLimit?.limit || 15}
          onClose={() => setShowUpgradePopup(false)}
        />
      )}

      {!isWriting && !viewingEntry && (
        <div className="fixed bottom-24 right-6 z-40 animate-in zoom-in slide-in-from-bottom-4 duration-500">
          <Button 
            onClick={() => {
              if (!isPremium && journalLimit && journalLimit.remaining !== null && journalLimit.remaining <= 0) {
                setShowUpgradePopup(true);
                return;
              }
              setIsWriting(true);
            }}
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

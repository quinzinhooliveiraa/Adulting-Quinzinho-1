import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark, LockKeyhole, BookOpen, X, ChevronLeft, ChevronRight,
  ShoppingBag, ExternalLink, Instagram, CheckCircle2, List, BookMarked, AlignLeft
} from "lucide-react";
import bookCover from "@/assets/images/book-cover-oficial.png";
import authorImg from "../assets/author.webp";
import BookPurchaseModal from "@/components/BookPurchaseModal";

type Chapter = {
  id: number;
  order: number;
  title: string;
  tag: string | null;
  excerpt: string | null;
  isPreview: boolean;
  pageType: string;
};

type PurchaseStatus = {
  purchased: boolean;
  purchasedAt: string | null;
  pricesCents: number;
};

function formatPrice(cents: number) {
  return `R$\u00a0${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/* ─────────────────────────────────────────────────────────────────
   BOOK STYLES (injected once)
───────────────────────────────────────────────────────────────── */
const BOOK_STYLES = `
  :root {
    --bk-bg: #faf7f2;
    --bk-ink: #1e1810;
    --bk-muted: #78706a;
    --bk-sep: #ddd5c8;
    --bk-accent: #7c5c3a;
    --bk-accent-light: rgba(124,92,58,0.1);
    --bk-page: #f5f0e8;
  }
  .dark {
    --bk-bg: #161410;
    --bk-ink: #ede6dc;
    --bk-muted: #857a6e;
    --bk-sep: #2a2520;
    --bk-accent: #c49a6c;
    --bk-accent-light: rgba(196,154,108,0.12);
    --bk-page: #1a1712;
  }
  .bk-bg    { background: var(--bk-bg) !important; }
  .bk-ink   { color: var(--bk-ink); }
  .bk-muted { color: var(--bk-muted); }
  .bk-sep   { border-color: var(--bk-sep); }
  .bk-accent{ color: var(--bk-accent); }
  .bk-serif { font-family: 'Georgia', 'Times New Roman', serif; }
  .pg-enter-right { animation: pgR .2s ease-out both; }
  .pg-enter-left  { animation: pgL .2s ease-out both; }
  @keyframes pgR { from { opacity:0; transform:translateX(18px) } to { opacity:1; transform:none } }
  @keyframes pgL { from { opacity:0; transform:translateX(-18px) } to { opacity:1; transform:none } }
`;

/* ─────────────────────────────────────────────────────────────────
   TOC PAGE  (virtual – no fetch needed)
───────────────────────────────────────────────────────────────── */
function TocPage({ chapters, purchased, onSelect, onBuy }: {
  chapters: Chapter[];
  purchased: boolean;
  onSelect: (idx: number) => void;
  onBuy: () => void;
}) {
  const realChapters = chapters.filter(c => c.pageType === "chapter");
  const frontMatter = chapters.filter(c => c.pageType === "front-matter");

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-12 bk-bg">
      {/* Ornament */}
      <div className="flex items-center justify-center gap-2 py-10">
        <div className="h-px w-12 opacity-40" style={{ background: "var(--bk-accent)" }} />
        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold bk-accent">Índice</span>
        <div className="h-px w-12 opacity-40" style={{ background: "var(--bk-accent)" }} />
      </div>

      {/* Front matter */}
      {frontMatter.length > 0 && (
        <div className="mb-6">
          {frontMatter.map((ch) => {
            const idx = chapters.findIndex(c => c.id === ch.id);
            return (
              <button key={ch.id} onClick={() => onSelect(idx)}
                className="w-full flex items-baseline justify-between py-2.5 border-b bk-sep group active:opacity-60">
                <span className="bk-serif text-sm italic bk-ink group-hover:bk-accent">{ch.title}</span>
                <span className="text-[10px] font-mono bk-muted ml-2">—</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Chapters */}
      <div>
        {realChapters.map((ch) => {
          const idx = chapters.findIndex(c => c.id === ch.id);
          const locked = !purchased && !ch.isPreview;
          return (
            <button key={ch.id}
              onClick={() => locked ? onBuy() : onSelect(idx)}
              className="w-full flex items-baseline justify-between py-2 border-b bk-sep group active:opacity-60">
              <div className="flex items-baseline gap-3 flex-1 min-w-0">
                <span className="text-[10px] font-mono bk-muted w-5 text-right shrink-0">{ch.order}</span>
                <span className={`bk-serif text-[13px] text-left leading-snug ${locked ? "opacity-40" : "bk-ink"}`}>
                  {ch.title.length > 55 ? ch.title.substring(0, 55) + "…" : ch.title}
                </span>
              </div>
              {locked && <LockKeyhole size={10} className="bk-muted ml-2 shrink-0" />}
              {ch.isPreview && !locked && (
                <span className="text-[8px] ml-2 px-1.5 py-0.5 rounded-full shrink-0 font-semibold" style={{ background: "var(--bk-accent-light)", color: "var(--bk-accent)" }}>Grátis</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CHAPTER PAGE  (fetches content)
───────────────────────────────────────────────────────────────── */
function ChapterPage({ chapter, purchased, onBuy, animClass }: {
  chapter: Chapter;
  purchased: boolean;
  onBuy: () => void;
  animClass: string;
}) {
  const canRead = purchased || chapter.isPreview;
  const isFrontMatter = chapter.pageType === "front-matter";

  const { data, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/book/chapters", chapter.id, "content"],
    queryFn: () => fetch(`/api/book/chapters/${chapter.id}/content`, { credentials: "include" }).then(r => r.json()),
    enabled: canRead,
  });

  if (!canRead) return (
    <div className={`flex-1 overflow-y-auto flex flex-col items-center justify-center gap-5 px-8 text-center ${animClass}`} style={{ background: "var(--bk-bg)" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--bk-accent-light)" }}>
        <LockKeyhole size={24} style={{ color: "var(--bk-accent)" }} />
      </div>
      <div>
        <h3 className="bk-serif text-xl bk-ink mb-2">Capítulo bloqueado</h3>
        <p className="text-sm bk-muted">Adquire o livro para aceder a todos os capítulos.</p>
      </div>
      <button onClick={onBuy} data-testid="btn-buy-reader"
        className="px-8 py-3 rounded-2xl font-semibold text-sm text-white active:scale-[0.98] transition-transform"
        style={{ background: "var(--bk-accent)" }}>
        Comprar acesso completo
      </button>
    </div>
  );

  if (isLoading) return (
    <div className={`flex-1 flex items-center justify-center ${animClass}`} style={{ background: "var(--bk-bg)" }}>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--bk-accent)", animationDelay: `${i*0.15}s` }} />)}
      </div>
    </div>
  );

  const content = data?.content ?? "";

  return (
    <div className={`flex-1 overflow-y-auto ${animClass}`} style={{ background: "var(--bk-bg)" }}>
      <div className="max-w-[62ch] mx-auto px-7 pb-16">

        {/* Front matter header (dedicatória / introdução) */}
        {isFrontMatter ? (
          <div className="pt-14 pb-10 text-center">
            {chapter.tag && (
              <p className="text-[9px] uppercase tracking-[0.28em] font-bold mb-6 bk-accent">{chapter.tag}</p>
            )}
            <h2 className="bk-serif text-2xl bk-ink font-bold mb-3">{chapter.title}</h2>
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="h-px w-16 opacity-30" style={{ background: "var(--bk-accent)" }} />
              <div className="w-1 h-1 rounded-full opacity-40" style={{ background: "var(--bk-accent)" }} />
              <div className="h-px w-16 opacity-30" style={{ background: "var(--bk-accent)" }} />
            </div>
          </div>
        ) : (
          /* Chapter header */
          <div className="pt-12 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 opacity-25" style={{ background: "var(--bk-accent)" }} />
              <span className="text-[9px] uppercase tracking-[0.28em] font-bold bk-accent">
                {chapter.tag ? chapter.tag : `Capítulo ${chapter.order}`}
              </span>
              <div className="h-px flex-1 opacity-25" style={{ background: "var(--bk-accent)" }} />
            </div>

            <h2 className={`bk-serif font-bold bk-ink leading-tight uppercase tracking-wide
              ${chapter.title.length > 60 ? "text-[15px]" : chapter.title.length > 40 ? "text-[17px]" : "text-[19px]"}`}
              style={{ letterSpacing: "0.04em" }}>
              {chapter.title}
            </h2>

            {chapter.excerpt && (
              <p className="bk-serif text-[13px] italic bk-muted mt-4 leading-relaxed border-l-2 pl-3"
                style={{ borderColor: "var(--bk-accent)" }}>
                {chapter.excerpt}
              </p>
            )}
          </div>
        )}

        {/* Body text */}
        {isFrontMatter && chapter.tag === "DEDICATÓRIA" ? (
          /* Dedication: centered italic, pre-wrap preserves line breaks */
          <p className="bk-serif text-base italic bk-ink leading-relaxed text-center"
            style={{ whiteSpace: "pre-wrap" }}>
            {content}
          </p>
        ) : (
          /* Regular prose — pre-wrap keeps every \n exactly as in the PDF */
          <p className="bk-serif bk-ink"
            style={{
              fontSize: "16.5px",
              lineHeight: "1.95",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              letterSpacing: "0.01em",
            } as React.CSSProperties}>
            {content}
          </p>
        )}

        {/* End-of-page ornament */}
        <div className="flex items-center justify-center gap-2 mt-12 opacity-25">
          <div className="h-px w-10" style={{ background: "var(--bk-accent)" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "var(--bk-accent)" }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--bk-accent)" }} />
          <div className="w-1 h-1 rounded-full" style={{ background: "var(--bk-accent)" }} />
          <div className="h-px w-10" style={{ background: "var(--bk-accent)" }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BOOK READER  (full-screen overlay)
───────────────────────────────────────────────────────────────── */
// Virtual page type for TOC
const TOC_ID = -999;

function BookReader({ chapters, startIdx, purchased, onClose, onBuy }: {
  chapters: Chapter[];
  startIdx: number;
  purchased: boolean;
  onClose: () => void;
  onBuy: () => void;
}) {
  // Pages: [TOC virtual, ...sorted chapters]
  const pages = chapters; // already sorted by order, front matter first
  const totalPages = pages.length + 1; // +1 for TOC

  // currentPage: 0 = TOC, 1..n = pages[0..n-1]
  const [currentPage, setCurrentPage] = useState(startIdx + 1); // +1 because page 0 is TOC
  const [animClass, setAnimClass] = useState("");
  const [showToc, setShowToc] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const isToc = currentPage === 0;
  const chapter = isToc ? null : pages[currentPage - 1];
  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;
  const progress = Math.round((currentPage / (totalPages - 1)) * 100);

  function navigate(dir: "prev" | "next") {
    const nextPage = dir === "next" ? currentPage + 1 : currentPage - 1;
    if (nextPage < 0 || nextPage >= totalPages) return;
    setAnimClass(dir === "next" ? "pg-enter-right" : "pg-enter-left");
    setCurrentPage(nextPage);
    setTimeout(() => setAnimClass(""), 220);
  }

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 55) { diff > 0 && hasNext ? navigate("next") : diff < 0 && hasPrev ? navigate("prev") : null; }
    touchStartX.current = null;
  }

  function goToChapter(idx: number) {
    setAnimClass("pg-enter-right");
    setCurrentPage(idx + 1);
    setTimeout(() => setAnimClass(""), 220);
    setShowToc(false);
  }

  function pageLabel() {
    if (isToc) return "Índice";
    const ch = pages[currentPage - 1];
    if (ch.pageType === "front-matter") return ch.title;
    return `Cap. ${ch.order}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bk-bg"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <style>{BOOK_STYLES}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bk-sep bk-bg shrink-0">
        <button onClick={onClose} data-testid="btn-close-reader" className="p-1.5 active:opacity-50">
          <X size={20} className="bk-muted" />
        </button>
        <p className="text-[10px] uppercase tracking-[0.2em] bk-muted font-semibold">A Casa dos 20</p>
        <button onClick={() => setShowToc(true)} data-testid="btn-toc" className="p-1.5 active:opacity-50">
          <List size={20} className="bk-muted" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] shrink-0" style={{ background: "var(--bk-sep)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--bk-accent)" }} />
      </div>

      {/* TOC overlay */}
      {showToc && (
        <div className="absolute inset-0 z-20 flex flex-col bk-bg overflow-hidden">
          <style>{BOOK_STYLES}</style>
          <div className="flex items-center justify-between px-5 py-4 border-b bk-sep shrink-0">
            <h2 className="bk-serif text-lg bk-ink font-bold">Índice</h2>
            <button onClick={() => setShowToc(false)} className="p-1.5 active:opacity-50"><X size={20} className="bk-muted" /></button>
          </div>
          <TocPage chapters={pages} purchased={purchased}
            onSelect={goToChapter} onBuy={() => { setShowToc(false); onBuy(); }} />
        </div>
      )}

      {/* Page content */}
      {isToc ? (
        <TocPage chapters={pages} purchased={purchased} onSelect={goToChapter} onBuy={onBuy} />
      ) : chapter ? (
        <ChapterPage chapter={chapter} purchased={purchased} onBuy={onBuy} animClass={animClass} />
      ) : null}

      {/* Bottom navigation */}
      <div className="shrink-0 border-t bk-sep bk-bg px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("prev")} disabled={!hasPrev}
          data-testid="btn-prev-chapter"
          className="flex items-center gap-1 text-sm disabled:opacity-20 active:opacity-50 transition-opacity bk-muted">
          <ChevronLeft size={16} /> Anterior
        </button>
        <p className="text-[10px] bk-muted font-mono">{pageLabel()} · {currentPage + 1}/{totalPages}</p>
        <button onClick={() => navigate("next")} disabled={!hasNext}
          data-testid="btn-next-chapter"
          className="flex items-center gap-1 text-sm font-semibold disabled:opacity-20 active:opacity-50 transition-opacity"
          style={{ color: hasNext ? "var(--bk-accent)" : "var(--bk-muted)" }}>
          Próximo <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────── */
export default function Book() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sobre" | "ler">("sobre");
  const [readerStartIdx, setReaderStartIdx] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/book/chapters"],
    queryFn: () => fetch("/api/book/chapters", { credentials: "include" }).then(r => r.json()),
  });

  const { data: purchaseStatus } = useQuery<PurchaseStatus>({
    queryKey: ["/api/book/purchase-status"],
    queryFn: () => fetch("/api/book/purchase-status", { credentials: "include" }).then(r => r.json()),
  });

  const purchased = purchaseStatus?.purchased ?? false;
  const priceLabel = purchaseStatus?.pricesCents ? formatPrice(purchaseStatus.pricesCents) : "R$\u00a019,90";

  // Sort chapters: front-matter first (by order), then chapters
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const freeChapters = sortedChapters.filter(c => c.isPreview && c.pageType === "chapter");

  function openChapter(idx: number) {
    const ch = sortedChapters[idx];
    if (!ch) return;
    if (!purchased && !ch.isPreview) { setShowPurchaseModal(true); return; }
    setReaderStartIdx(idx);
  }

  function openReader(startIdx = 0) {
    setReaderStartIdx(startIdx);
  }

  function handlePurchaseSuccess() {
    setShowPurchaseModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/book/purchase-status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/book/chapters"] });
  }

  const tagGradients: Record<string, string> = {
    "ESSENCIAL":   "linear-gradient(135deg,#c9bfb0 0%,#7a6e64 100%)",
    "TRANSIÇÃO":   "linear-gradient(135deg,#b8c4ce 0%,#5c6e7a 100%)",
    "IDENTIDADE":  "linear-gradient(135deg,#c8bdd4 0%,#6e5c7a 100%)",
    "AMOR":        "linear-gradient(135deg,#d4bdb8 0%,#7a5c5c 100%)",
    "CRESCIMENTO": "linear-gradient(135deg,#b8cec4 0%,#5c7a6e 100%)",
    "PROPÓSITO":   "linear-gradient(135deg,#cec4b8 0%,#7a6e5c 100%)",
  };

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-700 overflow-x-hidden">
      <div className="px-6 md:px-10 pt-12 pb-28">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">O Livro</h1>
          <Bookmark size={20} className="text-muted-foreground" />
        </header>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-8">
          <button onClick={() => setActiveTab("sobre")} data-testid="tab-sobre"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "sobre" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            Sobre
          </button>
          <button onClick={() => setActiveTab("ler")} data-testid="tab-ler"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "ler" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            <BookMarked size={14} /> Ler Livro
          </button>
        </div>

        {/* ── TAB: SOBRE ── */}
        {activeTab === "sobre" && (
          <div>
            {/* Cover */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-44 h-60 rounded-r-xl rounded-l-sm shadow-2xl shadow-primary/20 overflow-hidden relative border-l-[6px] border-primary/30 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
              </div>
              <h2 className="mt-8 font-serif text-2xl text-center text-foreground tracking-tight">A Casa dos 20</h2>
              <p className="text-sm text-muted-foreground text-center mt-2 italic font-serif">Refletindo sobre os Desafios da Transição para a Vida Adulta</p>
              <p className="text-xs text-primary/70 font-medium uppercase tracking-widest mt-4">Por Quinzinho Oliveira</p>
            </div>

            {/* Access status */}
            {purchased ? (
              <div className="mb-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Livro desbloqueado</p>
                  <p className="text-xs text-muted-foreground">Tens acesso completo a todos os capítulos.</p>
                </div>
                <button onClick={() => openReader(0)} data-testid="btn-read-now"
                  className="text-xs px-3 py-2 rounded-xl font-semibold text-white shrink-0 active:scale-95 transition-transform"
                  style={{ background: "var(--bk-accent, #7c5c3a)" }}>
                  Ler
                </button>
              </div>
            ) : (
              <div className="mb-8 bg-card border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ler no App</p>
                    <p className="text-xs text-muted-foreground">Acesso completo · sem PDF · permanente</p>
                  </div>
                  <span className="text-lg font-bold text-primary">{priceLabel}</span>
                </div>
                <button onClick={() => setShowPurchaseModal(true)} data-testid="btn-buy-book-in-app"
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                  <BookOpen size={16} /> Comprar e Ler Agora
                </button>
              </div>
            )}

            {/* Free chapters cards */}
            {freeChapters.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg text-foreground">Reflexões do Livro</h3>
                  <BookOpen size={17} className="text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  {freeChapters.map((chapter) => {
                    const idx = sortedChapters.findIndex(c => c.id === chapter.id);
                    const grad = tagGradients[chapter.tag?.toUpperCase() ?? ""] ?? "linear-gradient(135deg,#c9bfb0 0%,#7a6e64 100%)";
                    return (
                      <button key={chapter.id} onClick={() => openChapter(idx)}
                        data-testid={`card-free-ch-${chapter.id}`}
                        className="w-full text-left bg-card border border-border rounded-2xl overflow-hidden active:scale-[0.99] transition-transform shadow-sm">
                        <div className="h-28 w-full relative overflow-hidden" style={{ background: grad }}>
                          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 30% 50%,rgba(255,255,255,0.6) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(0,0,0,0.3) 0%,transparent 50%)" }} />
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
                        </div>
                        <div className="px-5 pb-5 -mt-1">
                          {chapter.tag && <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1.5">{chapter.tag}</p>}
                          <h4 className="font-serif text-xl text-foreground mb-2 leading-tight">{chapter.title}</h4>
                          {chapter.excerpt && <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">"{chapter.excerpt}"</p>}
                          <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--bk-accent,#7c5c3a)" }}>
                            Ler Reflexão <ChevronRight size={13} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* External stores */}
            <div className="mb-6 bg-card rounded-3xl p-6 border border-border space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Outras formas de comprar</h3>
              </div>
              <button onClick={() => window.open("https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/","_blank")} className="w-full p-3.5 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all" data-testid="button-buy-amazon">
                <div className="w-8 h-8 rounded-lg bg-[#FF9900]/20 flex items-center justify-center shrink-0"><span className="text-sm font-bold text-[#FF9900]">A</span></div>
                <div className="flex-1 text-left"><p className="text-xs font-semibold text-foreground">Amazon Brasil</p><p className="text-[10px] text-muted-foreground">E-book e físico</p></div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://books.apple.com/us/book/a-casa-dos-20/id6760140786","_blank")} className="w-full p-3.5 bg-muted border border-border rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all" data-testid="button-buy-apple">
                <div className="w-8 h-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0"><span className="text-sm">🍎</span></div>
                <div className="flex-1 text-left"><p className="text-xs font-semibold text-foreground">Apple Books</p><p className="text-[10px] text-muted-foreground">iBook digital</p></div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://www.clubedeautores.com.br/","_blank")} className="w-full p-3.5 bg-muted border border-border rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all" data-testid="button-buy-clube">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><span className="text-sm font-bold text-primary">C</span></div>
                <div className="flex-1 text-left"><p className="text-xs font-semibold text-foreground">Clube de Autores</p><p className="text-[10px] text-muted-foreground">Livro físico</p></div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
            </div>

            {/* Author */}
            <div className="bg-card rounded-3xl p-6 border border-border flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden border-2 border-background shadow-md">
                <img src={authorImg} alt="Quinzinho Oliveira" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
              <div>
                <h3 className="font-serif text-base text-foreground">Converse com o Autor</h3>
                <p className="text-xs text-muted-foreground mt-1">Feedback, histórias ou apenas para trocar ideias.</p>
              </div>
              <button onClick={() => window.open("https://www.instagram.com/quinzinhooliveiraa_/","_blank")}
                className="w-full py-2.5 text-white rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)" }}
                data-testid="btn-author-instagram">
                <Instagram size={16} /> @quinzinhooliveiraa_
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: LER LIVRO ── */}
        {activeTab === "ler" && (
          <div>
            {/* Buy banner */}
            {!purchased && (
              <div className="mb-6 bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Acesso completo por {priceLabel}</p>
                  <p className="text-xs text-muted-foreground">3 capítulos gratuitos disponíveis</p>
                </div>
                <button onClick={() => setShowPurchaseModal(true)} data-testid="btn-buy-ler-tab"
                  className="text-xs px-3 py-2 bg-primary text-primary-foreground rounded-xl font-semibold shrink-0 active:scale-95 transition-transform">
                  Comprar
                </button>
              </div>
            )}

            {/* Open reader from TOC */}
            <button onClick={() => openReader(0)} data-testid="btn-open-toc"
              className="w-full mb-5 p-4 border border-border bg-card rounded-2xl flex items-center gap-3 active:scale-[0.99] transition-transform">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--bk-accent-light,rgba(124,92,58,0.1))" }}>
                <AlignLeft size={16} style={{ color: "var(--bk-accent,#7c5c3a)" }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Ver Índice Completo</p>
                <p className="text-xs text-muted-foreground">{sortedChapters.filter(c=>c.pageType==="chapter").length} capítulos · introdução · dedicatória</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>

            {/* Chapter list */}
            {chaptersLoading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i=><div key={i} className="h-[68px] bg-muted rounded-2xl animate-pulse"/>)}</div>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {sortedChapters.map((chapter, idx) => {
                  const isLocked = !purchased && !chapter.isPreview;
                  const isFM = chapter.pageType === "front-matter";
                  return (
                    <button key={chapter.id} onClick={() => openChapter(idx)}
                      data-testid={`chapter-read-${chapter.id}`}
                      className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 active:bg-muted">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={isLocked ? {} : { background: "var(--bk-accent-light,rgba(124,92,58,0.1))" }}>
                        {isLocked ? (
                          <LockKeyhole size={14} className="text-muted-foreground" />
                        ) : isFM ? (
                          <BookMarked size={14} style={{ color: "var(--bk-accent,#7c5c3a)" }} />
                        ) : (
                          <span className="text-[10px] font-bold font-mono" style={{ color: "var(--bk-accent,#7c5c3a)" }}>{chapter.order}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {chapter.tag && <p className="text-[9px] uppercase tracking-widest font-bold mb-0.5 truncate" style={{ color: "var(--bk-accent,#7c5c3a)" }}>{chapter.tag}</p>}
                        <p className={`text-sm font-serif font-semibold ${isLocked ? "text-muted-foreground" : "text-foreground"}`}
                          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                          {chapter.title}
                        </p>
                        {chapter.excerpt && (
                          <p className={`text-xs text-muted-foreground mt-0.5 truncate ${isLocked ? "blur-[2px] select-none" : ""}`}>
                            {chapter.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 ml-2">
                        {chapter.isPreview ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--bk-accent-light,rgba(124,92,58,0.1))", color: "var(--bk-accent,#7c5c3a)" }}>Grátis</span>
                        ) : isLocked ? (
                          <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Bloqueado</span>
                        ) : (
                          <ChevronRight size={15} className="text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Book reader overlay */}
      {readerStartIdx !== null && sortedChapters.length > 0 && (
        <BookReader
          chapters={sortedChapters}
          startIdx={readerStartIdx}
          purchased={purchased}
          onClose={() => setReaderStartIdx(null)}
          onBuy={() => { setReaderStartIdx(null); setShowPurchaseModal(true); }}
        />
      )}

      {showPurchaseModal && (
        <BookPurchaseModal
          priceLabel={priceLabel}
          onSuccess={handlePurchaseSuccess}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
    </div>
  );
}

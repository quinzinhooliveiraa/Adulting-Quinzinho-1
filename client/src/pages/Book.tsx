import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark, LockKeyhole, BookOpen, X, ChevronLeft, ChevronRight,
  ShoppingBag, ExternalLink, Instagram, CheckCircle2, List, AlignLeft, BookMarked
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
};

type PurchaseStatus = {
  purchased: boolean;
  purchasedAt: string | null;
  pricesCents: number;
};

function formatPrice(cents: number) {
  return `R$\u00a0${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/* ─────────────────────────────────────────
   BOOK READER  (full-screen overlay)
───────────────────────────────────────── */
function BookReader({
  chapters,
  startIdx,
  purchased,
  onClose,
  onBuy,
}: {
  chapters: Chapter[];
  startIdx: number;
  purchased: boolean;
  onClose: () => void;
  onBuy: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(startIdx);
  const [showToc, setShowToc] = useState(false);
  const [animDir, setAnimDir] = useState<"left" | "right" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const chapter = chapters[currentIdx];
  const canRead = purchased || chapter.isPreview;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < chapters.length - 1;

  const { data: contentData, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/book/chapters", chapter.id, "content"],
    queryFn: () =>
      fetch(`/api/book/chapters/${chapter.id}/content`, { credentials: "include" }).then((r) => r.json()),
    enabled: canRead,
  });

  function navigate(dir: "prev" | "next") {
    setAnimDir(dir === "next" ? "left" : "right");
    setTimeout(() => {
      setCurrentIdx((i) => dir === "next" ? Math.min(i + 1, chapters.length - 1) : Math.max(i - 1, 0));
      setAnimDir(null);
      contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }, 160);
  }

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && hasNext) navigate("next");
      if (diff < 0 && hasPrev) navigate("prev");
    }
    touchStartX.current = null;
  }

  const progress = Math.round(((currentIdx + 1) / chapters.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--book-bg, #faf7f2)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        :root { --book-bg: #faf7f2; --book-ink: #1e1710; --book-muted: #7a6e64; --book-sep: #d8d0c5; --book-accent: #7c5c3a; }
        .dark { --book-bg: #17150f; --book-ink: #ede6dc; --book-muted: #857a6e; --book-sep: #2c2820; --book-accent: #c49a6c; }
        .bk-text { color: var(--book-ink); }
        .bk-muted { color: var(--book-muted); }
        .bk-sep { border-color: var(--book-sep); }
        .page-in-left { animation: pgLeft .16s ease-out both; }
        .page-in-right { animation: pgRight .16s ease-out both; }
        @keyframes pgLeft { from { opacity:0; transform:translateX(14px) } to { opacity:1; transform:translateX(0) } }
        @keyframes pgRight { from { opacity:0; transform:translateX(-14px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bk-sep shrink-0" style={{ background: "var(--book-bg)" }}>
        <button onClick={onClose} className="p-1.5 rounded-full active:opacity-50" data-testid="btn-close-reader">
          <X size={20} className="bk-muted" />
        </button>
        <p className="text-[11px] uppercase tracking-[0.18em] bk-muted font-medium">A Casa dos 20</p>
        <button onClick={() => setShowToc(!showToc)} className="p-1.5 rounded-full active:opacity-50" data-testid="btn-toc">
          <List size={20} className="bk-muted" />
        </button>
      </div>

      {/* Progress */}
      <div className="h-[2px] shrink-0" style={{ background: "var(--book-sep)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--book-accent)" }} />
      </div>

      {/* TOC */}
      {showToc && (
        <div className="absolute inset-0 z-20 flex flex-col overflow-hidden" style={{ background: "var(--book-bg)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b bk-sep">
            <h2 className="font-serif text-lg bk-text font-bold">Índice</h2>
            <button onClick={() => setShowToc(false)} className="p-1.5 active:opacity-50"><X size={20} className="bk-muted" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chapters.map((ch, idx) => {
              const locked = !purchased && !ch.isPreview;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    if (locked) { onBuy(); return; }
                    setCurrentIdx(idx);
                    setShowToc(false);
                    setTimeout(() => contentRef.current?.scrollTo({ top: 0 }), 50);
                  }}
                  data-testid={`toc-ch-${ch.id}`}
                  className={`w-full flex items-center gap-4 px-5 py-3 border-b bk-sep transition-colors active:opacity-60 ${idx === currentIdx ? "bg-amber-500/8" : ""}`}
                  style={idx === currentIdx ? { background: "color-mix(in srgb, var(--book-accent) 8%, transparent)" } : {}}
                >
                  <span className="text-[11px] font-mono bk-muted w-7 text-right shrink-0">{ch.order}</span>
                  <p className={`flex-1 text-sm font-serif bk-text text-left truncate ${locked ? "opacity-40" : ""}`}>{ch.title}</p>
                  {locked ? <LockKeyhole size={12} className="bk-muted shrink-0" /> :
                    idx === currentIdx ? <AlignLeft size={12} className="shrink-0" style={{ color: "var(--book-accent)" }} /> :
                    ch.isPreview ? <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ background: "color-mix(in srgb, var(--book-accent) 15%, transparent)", color: "var(--book-accent)" }}>Grátis</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chapter header */}
      <div className="px-6 pt-8 pb-2 text-center shrink-0">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-10 opacity-40" style={{ background: "var(--book-accent)" }} />
          <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--book-accent)" }}>
            Capítulo {chapter.order}
          </span>
          <div className="h-px w-10 opacity-40" style={{ background: "var(--book-accent)" }} />
        </div>
        {chapter.tag && (
          <p className="text-[10px] uppercase tracking-widest mb-1.5 bk-muted">{chapter.tag}</p>
        )}
        <h2 className={`font-serif font-bold leading-snug bk-text ${chapter.title.length > 35 ? "text-xl" : "text-[22px]"}`}>
          {chapter.title}
        </h2>
      </div>

      {/* Body */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-y-auto px-7 pb-8 ${animDir === "left" ? "page-in-left" : animDir === "right" ? "page-in-right" : ""}`}
      >
        {!canRead ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-5 px-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--book-accent) 12%, transparent)" }}>
              <LockKeyhole size={26} style={{ color: "var(--book-accent)" }} />
            </div>
            <div>
              <h3 className="font-serif text-xl bk-text mb-2">Capítulo bloqueado</h3>
              <p className="text-sm bk-muted">Adquire o livro para aceder a todos os capítulos.</p>
            </div>
            <button onClick={onBuy} className="px-8 py-3 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform text-white" style={{ background: "var(--book-accent)" }} data-testid="btn-buy-from-reader">
              Comprar acesso
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-[55vh]">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--book-accent)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : contentData?.content ? (
          <div className="max-w-[58ch] mx-auto pt-4">
            {chapter.excerpt && (
              <div className="mb-8">
                <p className="font-serif text-[15px] italic leading-relaxed text-center bk-muted">
                  "{chapter.excerpt}"
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-px w-10 opacity-30" style={{ background: "var(--book-accent)" }} />
                  <div className="w-1 h-1 rounded-full opacity-40" style={{ background: "var(--book-accent)" }} />
                  <div className="h-px w-10 opacity-30" style={{ background: "var(--book-accent)" }} />
                </div>
              </div>
            )}
            <div
              className="font-serif leading-[1.9] bk-text whitespace-pre-wrap text-[16.5px]"
              style={{ textAlign: "justify", hyphens: "auto", letterSpacing: "0.005em" } as React.CSSProperties}
            >
              {contentData.content}
            </div>
            {chapter.isPreview && (
              <div className="mt-12 text-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 opacity-30" style={{ background: "var(--book-accent)" }} />
                  <span className="text-[10px] uppercase tracking-widest bk-muted">Pré-visualização gratuita</span>
                  <div className="h-px flex-1 opacity-30" style={{ background: "var(--book-accent)" }} />
                </div>
              </div>
            )}
            {/* End-of-chapter ornament */}
            <div className="flex items-center justify-center gap-2 mt-10 mb-2 opacity-30">
              <div className="h-px w-8" style={{ background: "var(--book-accent)" }} />
              <div className="w-1 h-1 rounded-full" style={{ background: "var(--book-accent)" }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--book-accent)" }} />
              <div className="w-1 h-1 rounded-full" style={{ background: "var(--book-accent)" }} />
              <div className="h-px w-8" style={{ background: "var(--book-accent)" }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[55vh]">
            <p className="text-sm bk-muted">Conteúdo não disponível.</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t bk-sep shrink-0 px-6 py-4 flex items-center justify-between" style={{ background: "var(--book-bg)" }}>
        <button onClick={() => navigate("prev")} disabled={!hasPrev} className="flex items-center gap-1.5 text-sm disabled:opacity-20 active:opacity-50 transition-opacity bk-muted" data-testid="btn-prev-chapter">
          <ChevronLeft size={17} /> Anterior
        </button>
        <p className="text-[11px] font-mono bk-muted">{currentIdx + 1} / {chapters.length}</p>
        <button onClick={() => navigate("next")} disabled={!hasNext} className="flex items-center gap-1.5 text-sm font-medium disabled:opacity-20 active:opacity-50 transition-opacity" style={{ color: hasNext ? "var(--book-accent)" : "var(--book-muted)" }} data-testid="btn-next-chapter">
          Próximo <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Book() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sobre" | "ler">("sobre");
  const [readerStartIdx, setReaderStartIdx] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/book/chapters"],
    queryFn: () => fetch("/api/book/chapters", { credentials: "include" }).then((r) => r.json()),
  });

  const { data: purchaseStatus } = useQuery<PurchaseStatus>({
    queryKey: ["/api/book/purchase-status"],
    queryFn: () => fetch("/api/book/purchase-status", { credentials: "include" }).then((r) => r.json()),
  });

  const purchased = purchaseStatus?.purchased ?? false;
  const priceLabel = purchaseStatus?.pricesCents ? formatPrice(purchaseStatus.pricesCents) : "R$\u00a019,90";

  function openChapter(idx: number) {
    const ch = chapters[idx];
    if (!ch) return;
    if (!purchased && !ch.isPreview) { setShowPurchaseModal(true); return; }
    setReaderStartIdx(idx);
  }

  function handlePurchaseSuccess() {
    setShowPurchaseModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/book/purchase-status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/book/chapters"] });
  }

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
          <button
            onClick={() => setActiveTab("sobre")}
            data-testid="tab-sobre"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "sobre" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sobre
          </button>
          <button
            onClick={() => setActiveTab("ler")}
            data-testid="tab-ler"
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "ler" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <BookMarked size={14} />
            Ler Livro
          </button>
        </div>

        {/* ── TAB: SOBRE ── */}
        {activeTab === "sobre" && (
          <div className="space-y-0">
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
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Livro desbloqueado</p>
                  <p className="text-xs text-muted-foreground">Tens acesso completo a todos os capítulos.</p>
                </div>
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
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  data-testid="btn-buy-book-in-app"
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  <BookOpen size={16} />
                  Comprar e Ler Agora
                </button>
              </div>
            )}

            {/* External stores */}
            <div className="mb-6 bg-card rounded-3xl p-6 border border-border space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Outras formas de comprar</h3>
              </div>
              <button onClick={() => window.open("https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/", "_blank")} className="w-full p-3.5 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]" data-testid="button-buy-amazon">
                <div className="w-8 h-8 rounded-lg bg-[#FF9900]/20 flex items-center justify-center shrink-0"><span className="text-sm font-bold text-[#FF9900]">A</span></div>
                <div className="flex-1 text-left"><p className="text-xs font-semibold text-foreground">Amazon Brasil</p><p className="text-[10px] text-muted-foreground">E-book e físico</p></div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://books.apple.com/us/book/a-casa-dos-20/id6760140786", "_blank")} className="w-full p-3.5 bg-muted border border-border rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]" data-testid="button-buy-apple">
                <div className="w-8 h-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0"><span className="text-sm">🍎</span></div>
                <div className="flex-1 text-left"><p className="text-xs font-semibold text-foreground">Apple Books</p><p className="text-[10px] text-muted-foreground">iBook digital</p></div>
                <ExternalLink size={14} className="text-muted-foreground" />
              </button>
              <button onClick={() => window.open("https://www.clubedeautores.com.br/", "_blank")} className="w-full p-3.5 bg-muted border border-border rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]" data-testid="button-buy-clube">
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
              <button
                onClick={() => window.open("https://www.instagram.com/quinzinhooliveiraa_/", "_blank")}
                className="w-full py-2.5 text-white rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)" }}
                data-testid="btn-author-instagram"
              >
                <Instagram size={16} />
                @quinzinhooliveiraa_
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: LER LIVRO ── */}
        {activeTab === "ler" && (
          <div>
            {/* Buy prompt if not purchased */}
            {!purchased && (
              <div className="mb-6 bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Acesso completo por {priceLabel}</p>
                  <p className="text-xs text-muted-foreground">3 capítulos gratuitos disponíveis</p>
                </div>
                <button onClick={() => setShowPurchaseModal(true)} data-testid="btn-buy-ler-tab" className="text-xs px-3 py-2 bg-primary text-primary-foreground rounded-xl font-semibold shrink-0 active:scale-95 transition-transform">
                  Comprar
                </button>
              </div>
            )}

            {/* Chapter list */}
            {chaptersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[68px] bg-muted rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {chapters.map((chapter, idx) => {
                  const isLocked = !purchased && !chapter.isPreview;
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => openChapter(idx)}
                      data-testid={`chapter-read-${chapter.id}`}
                      className="w-full flex items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 active:bg-muted"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={isLocked ? {} : { background: "color-mix(in srgb, var(--book-accent, #7c5c3a) 12%, transparent)" }}>
                        {isLocked ? (
                          <LockKeyhole size={14} className="text-muted-foreground" />
                        ) : (
                          <span className="text-xs font-bold font-mono" style={{ color: "var(--book-accent, #7c5c3a)" }}>{chapter.order}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {chapter.tag && <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-0.5 truncate">{chapter.tag}</p>}
                        <p className={`text-sm font-serif font-semibold truncate ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                          {chapter.title}
                        </p>
                        {chapter.excerpt && (
                          <p className={`text-xs text-muted-foreground mt-0.5 truncate ${isLocked ? "blur-[2px] select-none" : ""}`}>
                            {chapter.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {chapter.isPreview ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "color-mix(in srgb, var(--book-accent, #7c5c3a) 12%, transparent)", color: "var(--book-accent, #7c5c3a)" }}>
                            Grátis
                          </span>
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
      {readerStartIdx !== null && chapters.length > 0 && (
        <BookReader
          chapters={chapters}
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

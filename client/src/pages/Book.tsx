import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark, LockKeyhole, BookOpen, X, ChevronLeft, ChevronRight,
  ShoppingBag, ExternalLink, Instagram, CheckCircle2, List, AlignLeft
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
    }, 180);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

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
      style={{ background: "var(--book-paper, #faf7f2)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        :root { --book-paper: #faf7f2; }
        .dark { --book-paper: #1a1814; }
        .book-text { color: #2a2118; }
        .dark .book-text { color: #e8e0d4; }
        .book-muted { color: #7a6e64; }
        .dark .book-muted { color: #8a8278; }
        .book-border { border-color: #d4c9be; }
        .dark .book-border { border-color: #332e28; }
        .book-page-anim-left { animation: pageLeft 0.18s ease-out both; }
        .book-page-anim-right { animation: pageRight 0.18s ease-out both; }
        @keyframes pageLeft { from { opacity:0; transform: translateX(18px); } to { opacity:1; transform: translateX(0); } }
        @keyframes pageRight { from { opacity:0; transform: translateX(-18px); } to { opacity:1; transform: translateX(0); } }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b book-border shrink-0"
        style={{ borderBottomColor: "var(--book-border-c, #d4c9be)", background: "var(--book-paper)" }}>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full transition-opacity active:opacity-50"
          data-testid="btn-close-reader"
        >
          <X size={20} className="book-muted" />
        </button>
        <div className="text-center flex-1 px-3 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] book-muted font-medium truncate">
            A Casa dos 20
          </p>
        </div>
        <button
          onClick={() => setShowToc(!showToc)}
          className="p-1.5 rounded-full transition-opacity active:opacity-50"
          data-testid="btn-toc"
        >
          <List size={20} className="book-muted" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 shrink-0" style={{ background: "#e4ddd6" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "#8b6f4e" }}
        />
      </div>

      {/* TOC overlay */}
      {showToc && (
        <div className="absolute inset-0 z-10 flex flex-col" style={{ background: "var(--book-paper)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b book-border">
            <h2 className="font-serif text-lg book-text font-bold">Índice</h2>
            <button onClick={() => setShowToc(false)} className="p-1.5 active:opacity-50">
              <X size={20} className="book-muted" />
            </button>
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
                    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
                  }}
                  data-testid={`toc-chapter-${ch.id}`}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 border-b transition-colors active:opacity-60
                    ${idx === currentIdx ? "bg-amber-500/10" : ""}`}
                  style={{ borderBottomColor: "var(--book-border-c, #d4c9be)" }}
                >
                  <span className="text-xs font-mono book-muted w-8 shrink-0 text-right">{ch.order}</span>
                  <div className="flex-1 min-w-0 text-left">
                    {ch.tag && (
                      <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#8b6f4e" }}>{ch.tag}</p>
                    )}
                    <p className={`text-sm font-serif book-text truncate ${locked ? "opacity-50" : ""}`}>{ch.title}</p>
                  </div>
                  <div className="shrink-0">
                    {locked ? (
                      <LockKeyhole size={13} className="book-muted" />
                    ) : idx === currentIdx ? (
                      <AlignLeft size={13} style={{ color: "#8b6f4e" }} />
                    ) : ch.isPreview ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#8b6f4e22", color: "#8b6f4e" }}>Grátis</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chapter header */}
      <div className="px-6 pt-7 pb-3 text-center shrink-0">
        <div className="inline-flex items-center gap-3 mb-3">
          <div className="h-px w-8" style={{ background: "#8b6f4e55" }} />
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: "#8b6f4e" }}>
            Capítulo {chapter.order}
          </span>
          <div className="h-px w-8" style={{ background: "#8b6f4e55" }} />
        </div>
        {chapter.tag && (
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8b6f4e" }}>{chapter.tag}</p>
        )}
        <h2
          className={`font-serif font-bold leading-snug book-text ${chapter.title.length > 30 ? "text-xl" : "text-2xl"}`}
        >
          {chapter.title}
        </h2>
      </div>

      {/* Content area */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-y-auto px-6 pb-6
          ${animDir === "left" ? "book-page-anim-left" : animDir === "right" ? "book-page-anim-right" : ""}`}
      >
        {!canRead ? (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center gap-5 px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#8b6f4e1a" }}>
              <LockKeyhole size={28} style={{ color: "#8b6f4e" }} />
            </div>
            <div>
              <h3 className="font-serif text-xl book-text mb-2">Capítulo bloqueado</h3>
              <p className="text-sm book-muted">Adquire o livro para ler todos os capítulos completos.</p>
            </div>
            <button
              onClick={onBuy}
              className="px-8 py-3 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform text-white"
              style={{ background: "#8b6f4e" }}
              data-testid="btn-buy-from-reader"
            >
              Comprar acesso digital
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-[55vh]">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "#8b6f4e", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : contentData?.content ? (
          <div className="max-w-[62ch] mx-auto">
            {chapter.excerpt && (
              <div className="mb-8 mt-2">
                <p className="font-serif text-base italic leading-relaxed text-center book-muted">
                  "{chapter.excerpt}"
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-px w-12" style={{ background: "#8b6f4e44" }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: "#8b6f4e44" }} />
                  <div className="h-px w-12" style={{ background: "#8b6f4e44" }} />
                </div>
              </div>
            )}
            <div
              className="font-serif leading-[1.95] book-text whitespace-pre-wrap text-[16px] tracking-[0.01em]"
              style={{ textAlign: "justify", hyphens: "auto" } as React.CSSProperties}
            >
              {contentData.content}
            </div>
            {chapter.isPreview && (
              <div className="mt-12 text-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1" style={{ background: "#8b6f4e33" }} />
                  <span className="text-[10px] uppercase tracking-widest book-muted">Fim da pré-visualização</span>
                  <div className="h-px flex-1" style={{ background: "#8b6f4e33" }} />
                </div>
                <p className="text-xs book-muted">Este capítulo é gratuito como prévia.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[55vh]">
            <p className="text-sm book-muted">Conteúdo não disponível.</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t book-border shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--book-paper)", borderTopColor: "var(--book-border-c, #d4c9be)" }}>
        <button
          onClick={() => navigate("prev")}
          disabled={!hasPrev}
          className="flex items-center gap-2 text-sm transition-opacity disabled:opacity-25 active:opacity-50"
          style={{ color: "#7a6e64" }}
          data-testid="btn-prev-chapter"
        >
          <ChevronLeft size={18} />
          <span className="hidden xs:inline">Anterior</span>
        </button>

        <div className="text-center">
          <p className="text-[11px] font-mono book-muted">
            {currentIdx + 1} / {chapters.length}
          </p>
        </div>

        <button
          onClick={() => navigate("next")}
          disabled={!hasNext}
          className="flex items-center gap-2 text-sm font-medium transition-opacity disabled:opacity-25 active:opacity-50"
          style={{ color: hasNext ? "#8b6f4e" : "#7a6e64" }}
          data-testid="btn-next-chapter"
        >
          <span className="hidden xs:inline">Próximo</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function Book() {
  const queryClient = useQueryClient();
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
    if (!purchased && !ch.isPreview) {
      setShowPurchaseModal(true);
      return;
    }
    setReaderStartIdx(idx);
  }

  function handlePurchaseSuccess() {
    setShowPurchaseModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/book/purchase-status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/book/chapters"] });
  }

  const freeChapters = chapters.filter(c => c.isPreview).length;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-700 overflow-x-hidden">
      <div className="px-5 md:px-10 pt-12 pb-28">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">O Livro</h1>
          <Bookmark size={20} className="text-muted-foreground" />
        </header>

        {/* Book cover card */}
        <div className="bg-card border border-border rounded-3xl p-6 mb-6 flex gap-5 items-start shadow-sm">
          <div
            className="w-24 h-32 rounded-r-lg rounded-l-[2px] overflow-hidden shrink-0 shadow-xl relative"
            style={{ boxShadow: "4px 4px 16px rgba(0,0,0,0.25), inset -2px 0 6px rgba(0,0,0,0.15)", borderLeft: "4px solid #5a3e2b" }}
          >
            <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Por Quinzinho Oliveira</p>
            <h2 className="font-serif text-xl font-bold text-foreground leading-tight mb-1">A Casa dos 20</h2>
            <p className="text-xs text-muted-foreground italic font-serif leading-snug mb-3">
              Refletindo sobre os Desafios da Transição para a Vida Adulta
            </p>
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen size={11} className="text-primary/60" />
                {chapters.length} capítulos
              </span>
              {freeChapters > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-green-500" />
                  {freeChapters} grátis
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Access / purchase */}
        {purchased ? (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">Livro desbloqueado</p>
              <p className="text-xs text-muted-foreground">Acesso completo a todos os capítulos.</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Ler no App</p>
                <p className="text-xs text-muted-foreground">Acesso completo · permanente</p>
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

        {/* Chapter list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-serif text-xl text-foreground">Capítulos</h3>
            <span className="text-xs text-muted-foreground">{chapters.length}</span>
          </div>

          {chaptersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[72px] bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Os capítulos serão disponibilizados em breve.
            </p>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {chapters.map((chapter, idx) => {
                const isLocked = !purchased && !chapter.isPreview;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => openChapter(idx)}
                    data-testid={`chapter-card-${chapter.id}`}
                    className="w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                  >
                    {/* Number */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: isLocked ? "transparent" : "#8b6f4e18", border: isLocked ? "1px solid var(--border)" : "none" }}>
                      {isLocked ? (
                        <LockKeyhole size={14} className="text-muted-foreground" />
                      ) : (
                        <span className="text-xs font-bold font-mono" style={{ color: "#8b6f4e" }}>{chapter.order}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {chapter.tag && (
                        <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-0.5 truncate">{chapter.tag}</p>
                      )}
                      <p className={`text-sm font-serif font-semibold text-foreground truncate ${isLocked ? "opacity-60" : ""}`}>
                        {chapter.title}
                      </p>
                      {chapter.excerpt && (
                        <p className={`text-xs text-muted-foreground mt-0.5 truncate ${isLocked ? "blur-[2px] select-none" : ""}`}>
                          {chapter.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Badge */}
                    <div className="shrink-0">
                      {chapter.isPreview ? (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "#8b6f4e18", color: "#8b6f4e" }}>Grátis</span>
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

        {/* External stores */}
        <div className="mt-8 bg-card rounded-3xl p-5 border border-border space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={15} className="text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Outras formas de comprar</h3>
          </div>
          {[
            {
              href: "https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/",
              label: "Amazon Brasil", sub: "E-book e físico",
              icon: <span className="text-sm font-bold" style={{ color: "#FF9900" }}>A</span>,
              bg: "#FF990018", testid: "button-buy-amazon"
            },
            {
              href: "https://books.apple.com/us/book/a-casa-dos-20/id6760140786",
              label: "Apple Books", sub: "iBook digital",
              icon: <span className="text-sm">🍎</span>,
              bg: "var(--muted)", testid: "button-buy-apple"
            },
            {
              href: "https://www.clubedeautores.com.br/",
              label: "Clube de Autores", sub: "Livro físico",
              icon: <span className="text-sm font-bold text-primary">C</span>,
              bg: "var(--muted)", testid: "button-buy-clube"
            },
          ].map((s) => (
            <button
              key={s.testid}
              onClick={() => window.open(s.href, "_blank")}
              data-testid={s.testid}
              className="w-full p-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] border border-border"
              style={{ background: s.bg }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-background/50">{s.icon}</div>
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              </div>
              <ExternalLink size={13} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Author */}
        <div className="mt-5 bg-card rounded-3xl p-5 border border-border flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-background shadow-md">
            <img src={authorImg} alt="Quinzinho Oliveira" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
          </div>
          <div>
            <h3 className="font-serif text-sm text-foreground">Converse com o Autor</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Feedback, histórias ou apenas para trocar ideias.</p>
          </div>
          <button
            onClick={() => window.open("https://www.instagram.com/quinzinhooliveiraa_/", "_blank")}
            className="w-full py-2.5 text-white rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)" }}
            data-testid="btn-author-instagram"
          >
            <Instagram size={15} />
            @quinzinhooliveiraa_
          </button>
        </div>
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

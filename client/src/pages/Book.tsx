import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Bookmark, LockKeyhole, BookOpen, X, ChevronLeft, ChevronRight,
  ShoppingBag, ExternalLink, Instagram, CheckCircle2, List, BookMarked, AlignLeft,
  Highlighter, Trash2
} from "lucide-react";
import bookCover from "@/assets/images/book-cover-oficial.png";
import authorImg from "../assets/author.webp";
import BookPurchaseModal from "@/components/BookPurchaseModal";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";

type Chapter = {
  id: number;
  order: number;
  title: string;
  tag: string | null;
  excerpt: string | null;
  isPreview: boolean;
  pageType: string;
  pdfPage: number | null;
};

/**
 * Converts raw PDF-imported text into clean paragraphs.
 * Handles two formats:
 *  1. Paragraphs separated by \n\n (some chapters)
 *  2. Only single \n line-wraps, paragraphs detected by sentence-end + capital-start
 */
function processContent(raw: string): string[] {
  if (!raw.trim()) return [];

  if (raw.includes("\n\n")) {
    // Format 1: explicit paragraph breaks
    return raw
      .split(/\n\n+/)
      .map(block =>
        block.split("\n")
          .map(l => l.trim())
          .filter(l => l.length > 0)
          .join(" ")
      )
      .filter(p => p.trim().length > 0);
  }

  // Format 2: only single \n — join PDF-wrapped lines into paragraphs
  // A new paragraph starts when the previous line ends with sentence punctuation
  // AND the next line starts with a capital (or special) letter
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const paragraphs: string[] = [];
  let current = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    current = current ? current + " " + line : line;

    const next = lines[i + 1];
    if (!next) { paragraphs.push(current); break; }

    const endsWithPunct = /[.!?]["»"']?$/.test(line);
    const nextStartsCap  = /^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ""—]/.test(next);

    if (endsWithPunct && nextStartsCap) {
      paragraphs.push(current);
      current = "";
    }
  }

  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.filter(p => p.length > 0);
}

type BookHighlight = {
  id: number;
  userId: string;
  chapterId: number;
  subPage: number;
  paraIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  color: string;
  createdAt: string;
};

type PendingHL = {
  paraIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  rect: DOMRect;
};

const HL_COLORS = {
  yellow: { bg: "rgba(255,236,90,0.55)",  dark: "rgba(255,236,90,0.3)",  label: "Amarelo" },
  green:  { bg: "rgba(120,210,130,0.55)", dark: "rgba(120,210,130,0.3)", label: "Verde" },
  pink:   { bg: "rgba(255,160,180,0.55)", dark: "rgba(255,160,180,0.3)", label: "Rosa" },
  blue:   { bg: "rgba(100,190,240,0.55)", dark: "rgba(100,190,240,0.3)", label: "Azul" },
} as const;

type HLColor = keyof typeof HL_COLORS;

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
  .bk-hl-yellow { background: rgba(255,236,90,0.55); border-radius: 2px; cursor: pointer; }
  .bk-hl-green  { background: rgba(120,210,130,0.55); border-radius: 2px; cursor: pointer; }
  .bk-hl-pink   { background: rgba(255,160,180,0.55); border-radius: 2px; cursor: pointer; }
  .bk-hl-blue   { background: rgba(100,190,240,0.55); border-radius: 2px; cursor: pointer; }
  .dark .bk-hl-yellow { background: rgba(255,236,90,0.28); }
  .dark .bk-hl-green  { background: rgba(120,210,130,0.28); }
  .dark .bk-hl-pink   { background: rgba(255,160,180,0.28); }
  .dark .bk-hl-blue   { background: rgba(100,190,240,0.28); }
  .bk-hl-yellow:active,.bk-hl-green:active,.bk-hl-pink:active,.bk-hl-blue:active { opacity:0.7; }
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
  const epilogues = chapters.filter(c => c.pageType === "epilogue");

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-28 bk-bg">
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
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                {ch.pdfPage && <span className="text-[9px] font-mono bk-muted">{ch.pdfPage}</span>}
                {locked && <LockKeyhole size={10} className="bk-muted" />}
                {ch.isPreview && !locked && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--bk-accent-light)", color: "var(--bk-accent)" }}>Grátis</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Epilogue */}
      {epilogues.length > 0 && (
        <div className="mt-6">
          {epilogues.map((ch) => {
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
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CHAPTER PAGE  (fetches content + highlights)
───────────────────────────────────────────────────────────────── */
function ChapterPage({ chapter, purchased, onBuy, animClass, subPage, onActualSubPageCount, allChapters, onGoToChapter, highlights, onSaveHighlight, onDeleteHighlight }: {
  chapter: Chapter;
  purchased: boolean;
  onBuy: () => void;
  animClass: string;
  subPage: number;
  onActualSubPageCount: (n: number) => void;
  allChapters?: Chapter[];
  onGoToChapter?: (idx: number) => void;
  highlights: BookHighlight[];
  onSaveHighlight: (data: { chapterId: number; subPage: number; paraIndex: number; startOffset: number; endOffset: number; text: string; color: HLColor }) => void;
  onDeleteHighlight: (id: number) => void;
}) {
  const canRead = purchased || chapter.isPreview;
  const isFrontMatter = chapter.pageType === "front-matter" || chapter.pageType === "epilogue";
  const contentRef = useRef<HTMLDivElement>(null);
  const [pendingHL, setPendingHL] = useState<PendingHL | null>(null);
  const [activeHLId, setActiveHLId] = useState<number | null>(null);
  const [activeHLPos, setActiveHLPos] = useState<{ x: number; y: number } | null>(null);

  const { data, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/book/chapters", chapter.id, "content"],
    queryFn: () => fetch(`/api/book/chapters/${chapter.id}/content`, { credentials: "include" }).then(r => r.json()),
    enabled: canRead,
  });

  const rawContent = data?.content ?? "";
  const pdfPages: string[] = rawContent
    ? rawContent.split("\f").map(p => p.trim()).filter(p => p.length > 0)
    : [];

  useEffect(() => {
    if (!data) return;
    if (rawContent === "__TOC__") onActualSubPageCount(1);
    else if (pdfPages.length > 0) onActualSubPageCount(pdfPages.length);
  }, [data?.content]);

  const safeSubPage = Math.min(subPage, Math.max(0, pdfPages.length - 1));
  const pageText = pdfPages[safeSubPage] ?? "";
  const currentPdfPage = chapter.pdfPage != null && pdfPages.length > 0
    ? chapter.pdfPage + safeSubPage : null;

  // ─── Selection detection ───────────────────────────────────────
  const getParaSelection = useCallback((): PendingHL | null => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return null;
    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (text.length < 2) return null;
    let node: Node | null = range.startContainer;
    let paraEl: HTMLElement | null = null;
    while (node && node !== document.body) {
      const el = node as HTMLElement;
      if ((el as HTMLElement).dataset?.paraIdx !== undefined) { paraEl = el; break; }
      node = node.parentElement;
    }
    if (!paraEl) return null;
    const paraIdx = parseInt(paraEl.dataset.paraIdx || "0");
    const preRange = document.createRange();
    preRange.selectNodeContents(paraEl);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = Math.min(startOffset + text.length, (paraEl.textContent || "").length);
    const rect = range.getBoundingClientRect();
    return { paraIndex: paraIdx, startOffset, endOffset, text, rect };
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !canRead) return;
    function onEnd() {
      setTimeout(() => {
        const r = getParaSelection();
        if (r) setPendingHL(r);
      }, 80);
    }
    el.addEventListener("mouseup", onEnd);
    el.addEventListener("touchend", onEnd);
    return () => { el.removeEventListener("mouseup", onEnd); el.removeEventListener("touchend", onEnd); };
  }, [canRead, data?.content, getParaSelection]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-hl-toolbar]") && !t.closest("[data-hl-tooltip]")) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) setPendingHL(null);
        if (!t.closest("[data-highlight-id]")) { setActiveHLId(null); setActiveHLPos(null); }
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ─── Render paragraph with highlights ─────────────────────────
  function renderPara(text: string, paraIdx: number): React.ReactNode {
    const hls = highlights
      .filter(h => h.chapterId === chapter.id && h.subPage === safeSubPage && h.paraIndex === paraIdx)
      .sort((a, b) => a.startOffset - b.startOffset);
    if (!hls.length) return text;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    for (const hl of hls) {
      const s = Math.max(hl.startOffset, cursor);
      const e = Math.min(hl.endOffset, text.length);
      if (s >= e) continue;
      if (s > cursor) nodes.push(text.slice(cursor, s));
      nodes.push(
        <mark key={hl.id} className={`bk-hl-${hl.color}`} data-highlight-id={hl.id}
          onClick={(ev) => {
            ev.stopPropagation();
            setPendingHL(null);
            window.getSelection()?.removeAllRanges();
            if (activeHLId === hl.id) { setActiveHLId(null); setActiveHLPos(null); }
            else {
              const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
              setActiveHLId(hl.id);
              setActiveHLPos({ x: r.left + r.width / 2, y: r.top });
            }
          }}>
          {text.slice(s, e)}
        </mark>
      );
      cursor = e;
    }
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  }

  function clampX(x: number) {
    return Math.max(96, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 400) - 96));
  }
  function calcToolbarY(rect: DOMRect) {
    const top = rect.top - 60;
    return top < 8 ? rect.bottom + 10 : top;
  }

  if (!canRead) return (
    <div className={`flex-1 overflow-y-auto flex flex-col items-center justify-center gap-5 px-8 text-center ${animClass}`} style={{ background: "var(--bk-bg)" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--bk-accent-light)" }}>
        <LockKeyhole size={24} style={{ color: "var(--bk-accent)" }} />
      </div>
      <div>
        <h3 className="bk-serif text-xl bk-ink font-bold mb-2">Capítulo bloqueado</h3>
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

  // Sumário
  if (rawContent === "__TOC__" && allChapters) {
    const fmChapters = allChapters.filter(c => c.pageType === "front-matter" && c.title !== "Sumário");
    const regularChapters = allChapters.filter(c => c.pageType === "chapter");
    const epilogueChapters = allChapters.filter(c => c.pageType === "epilogue");
    return (
      <div className={`flex-1 overflow-y-auto ${animClass}`} style={{ background: "var(--bk-bg)" }}>
        <div className="max-w-[62ch] mx-auto px-7 pb-16">
          <div className="pt-14 pb-8 text-center">
            <h2 className="bk-serif text-2xl bk-ink font-bold mb-3">Sumário</h2>
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="h-px w-16 opacity-30" style={{ background: "var(--bk-accent)" }} />
              <div className="w-1 h-1 rounded-full opacity-40" style={{ background: "var(--bk-accent)" }} />
              <div className="h-px w-16 opacity-30" style={{ background: "var(--bk-accent)" }} />
            </div>
          </div>
          {fmChapters.map(ch => {
            const idx = allChapters.indexOf(ch);
            return (
              <button key={ch.id} onClick={() => onGoToChapter?.(idx)}
                className="w-full flex items-center gap-3 py-3 border-b bk-sep text-left active:opacity-60 group">
                <BookMarked size={13} className="shrink-0 opacity-50" style={{ color: "var(--bk-accent)" }} />
                <span className="bk-serif text-sm bk-ink italic">{ch.title}</span>
              </button>
            );
          })}
          {regularChapters.map(ch => {
            const idx = allChapters.indexOf(ch);
            const isLocked = !purchased && !ch.isPreview;
            return (
              <button key={ch.id} onClick={() => !isLocked && onGoToChapter?.(idx)} disabled={isLocked}
                className="w-full flex items-start gap-3 py-3 border-b bk-sep text-left disabled:opacity-40 active:opacity-60 group">
                <span className="text-[10px] font-mono font-bold shrink-0 mt-0.5 w-5 text-right" style={{ color: "var(--bk-accent)" }}>{ch.order}</span>
                <span className="bk-serif text-sm bk-ink leading-snug">{ch.title}</span>
                {isLocked && <LockKeyhole size={11} className="shrink-0 mt-1 ml-auto bk-muted" />}
              </button>
            );
          })}
          {epilogueChapters.map(ch => {
            const idx = allChapters.indexOf(ch);
            return (
              <button key={ch.id} onClick={() => onGoToChapter?.(idx)}
                className="w-full flex items-center gap-3 py-3 border-b bk-sep text-left active:opacity-60 group">
                <BookMarked size={13} className="shrink-0 opacity-50" style={{ color: "var(--bk-accent)" }} />
                <span className="bk-serif text-sm bk-ink italic">{ch.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const isSpacedTitle = /^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇÜ](\s[A-ZÁÉÍÓÚÀÂÊÔÃÕÇÜ])*$/.test(pageText.trim());
  const paras = isSpacedTitle ? [] : processContent(pageText);

  return (
    <>
      <div className={`flex-1 overflow-y-auto ${animClass}`} style={{ background: "var(--bk-bg)" }}>
        <div ref={contentRef} className="max-w-[62ch] mx-auto px-7 pb-16">

          {safeSubPage === 0 && (
            isFrontMatter ? (
              <div className="pt-14 pb-10 text-center">
                {chapter.tag && <p className="text-[9px] uppercase tracking-[0.28em] font-bold mb-6 bk-accent">{chapter.tag}</p>}
                <h2 className="bk-serif text-2xl bk-ink font-bold mb-3">{chapter.title}</h2>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <div className="h-px w-16 opacity-30" style={{ background: "var(--bk-accent)" }} />
                  <div className="w-1 h-1 rounded-full opacity-40" style={{ background: "var(--bk-accent)" }} />
                  <div className="h-px w-16 opacity-30" style={{ background: "var(--bk-accent)" }} />
                </div>
              </div>
            ) : (
              <div className="pt-12 pb-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 opacity-25" style={{ background: "var(--bk-accent)" }} />
                  <span className="text-[9px] uppercase tracking-[0.28em] font-bold bk-accent">
                    {chapter.tag ? chapter.tag : `Capítulo ${chapter.order}`}
                  </span>
                  <div className="h-px flex-1 opacity-25" style={{ background: "var(--bk-accent)" }} />
                </div>
                <h2 className={`bk-serif font-bold bk-ink leading-tight uppercase tracking-wide ${chapter.title.length > 60 ? "text-[15px]" : chapter.title.length > 40 ? "text-[17px]" : "text-[19px]"}`}
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
            )
          )}

          {isSpacedTitle ? (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: "50vh" }}>
              <p className="bk-serif font-bold bk-accent text-center" style={{ fontSize: "13px", letterSpacing: "0.35em", lineHeight: "3", opacity: 0.85 }}>
                {pageText.trim()}
              </p>
              <div className="flex items-center justify-center gap-2 mt-8 opacity-25">
                <div className="h-px w-10" style={{ background: "var(--bk-accent)" }} />
                <div className="w-1 h-1 rounded-full" style={{ background: "var(--bk-accent)" }} />
                <div className="h-px w-10" style={{ background: "var(--bk-accent)" }} />
              </div>
            </div>
          ) : isFrontMatter && chapter.tag === "DEDICATÓRIA" ? (
            <div className="py-4 space-y-5 text-center">
              {paras.map((p, i) => (
                <p key={i} data-para-idx={i} className="bk-serif text-base italic bk-ink leading-relaxed">
                  {renderPara(p, i)}
                </p>
              ))}
            </div>
          ) : (
            <div className="pt-2 pb-2">
              {paras.map((p, i) => (
                <p key={i} data-para-idx={i} className="bk-serif bk-ink mb-5 last:mb-0"
                  style={{
                    fontSize: "16.5px", lineHeight: "1.92", textAlign: "justify",
                    hyphens: "auto", letterSpacing: "0.008em",
                    textIndent: i === 0 && safeSubPage === 0 ? "0" : "1.5em",
                  } as React.CSSProperties}>
                  {renderPara(p, i)}
                </p>
              ))}
            </div>
          )}

          {currentPdfPage && (
            <div className="flex items-center justify-center mt-8 mb-2">
              <span className="text-[10px] font-mono bk-muted">{currentPdfPage}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-12 opacity-25">
            <div className="h-px w-10" style={{ background: "var(--bk-accent)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--bk-accent)" }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--bk-accent)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--bk-accent)" }} />
            <div className="h-px w-10" style={{ background: "var(--bk-accent)" }} />
          </div>
        </div>
      </div>

      {/* ── Highlight color toolbar ── */}
      {pendingHL && (
        <div data-hl-toolbar
          className="fixed z-[200] pointer-events-auto"
          style={{ left: clampX(pendingHL.rect.left + pendingHL.rect.width / 2), top: calcToolbarY(pendingHL.rect), transform: "translateX(-50%)" }}>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-2 shadow-2xl"
            style={{ background: "var(--bk-ink)" }}>
            {(Object.entries(HL_COLORS) as [HLColor, typeof HL_COLORS[HLColor]][]).map(([color, cfg]) => (
              <button key={color}
                data-testid={`btn-hl-${color}`}
                title={cfg.label}
                className="w-7 h-7 rounded-full active:scale-90 transition-transform ring-2 ring-transparent hover:ring-white/30"
                style={{ background: cfg.bg }}
                onClick={() => {
                  onSaveHighlight({
                    chapterId: chapter.id, subPage: safeSubPage,
                    paraIndex: pendingHL.paraIndex,
                    startOffset: pendingHL.startOffset, endOffset: pendingHL.endOffset,
                    text: pendingHL.text, color,
                  });
                  setPendingHL(null);
                  window.getSelection()?.removeAllRanges();
                }}
              />
            ))}
            <button className="ml-1 opacity-50 hover:opacity-90 transition-opacity"
              onClick={() => { setPendingHL(null); window.getSelection()?.removeAllRanges(); }}>
              <X size={14} style={{ color: "var(--bk-bg)" }} />
            </button>
          </div>
          {pendingHL.rect.top - 60 >= 8 && (
            <div className="flex justify-center">
              <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid var(--bk-ink)" }} />
            </div>
          )}
        </div>
      )}

      {/* ── Delete highlight tooltip ── */}
      {activeHLId !== null && activeHLPos && (
        <div data-hl-tooltip
          className="fixed z-[200] pointer-events-auto"
          style={{ left: clampX(activeHLPos.x), top: activeHLPos.y - 54, transform: "translateX(-50%)" }}>
          <div className="flex items-center rounded-full shadow-2xl overflow-hidden"
            style={{ background: "var(--bk-ink)" }}>
            <button data-testid="btn-hl-delete"
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium active:opacity-70"
              style={{ color: "var(--bk-bg)" }}
              onClick={() => { onDeleteHighlight(activeHLId); setActiveHLId(null); setActiveHLPos(null); }}>
              <Trash2 size={13} /> Remover marcação
            </button>
          </div>
          <div className="flex justify-center">
            <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid var(--bk-ink)" }} />
          </div>
        </div>
      )}
    </>
  );
}


/* ─────────────────────────────────────────────────────────────────
   BOOK READER  (full-screen overlay)
───────────────────────────────────────────────────────────────── */
function BookReader({ chapters, startIdx, purchased, onClose, onBuy }: {
  chapters: Chapter[];
  startIdx: number;
  purchased: boolean;
  onClose: () => void;
  onBuy: () => void;
}) {
  const initCounts = chapters.map((ch, i) => {
    if (!ch.pdfPage) return 1;
    const next = chapters[i + 1]?.pdfPage;
    if (!next) return 5;
    return Math.max(1, next - ch.pdfPage);
  });

  const [chapterIdx, setChapterIdx] = useState(startIdx);
  const [subPage, setSubPage]       = useState(0);
  const [animClass, setAnimClass]   = useState("");
  const [showToc, setShowToc]       = useState(false);
  const [showHLPanel, setShowHLPanel] = useState(false);
  const [subPageCounts, setSubPageCounts] = useState<number[]>(initCounts);
  const touchStartX = useRef<number | null>(null);

  const chapter      = chapters[chapterIdx];
  const subPageCount = subPageCounts[chapterIdx] ?? 1;
  const hasPrev = chapterIdx > 0 || subPage > 0;
  const hasNext = chapterIdx < chapters.length - 1 || subPage < subPageCount - 1;

  const totalSubPages = subPageCounts.reduce((a, b) => a + b, 0);
  const absPage = subPageCounts.slice(0, chapterIdx).reduce((a, b) => a + b, 0) + subPage;
  const progress = totalSubPages > 1 ? Math.round((absPage / (totalSubPages - 1)) * 100) : 100;

  // ─── Highlights ───────────────────────────────────────────────
  const { data: allHighlights = [] } = useQuery<BookHighlight[]>({
    queryKey: ["/api/book/highlights"],
    queryFn: () => fetch("/api/book/highlights", { credentials: "include" }).then(r => r.json()),
  });

  const saveHL = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/book/highlights", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/book/highlights"] }),
  });

  const deleteHL = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/book/highlights/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/book/highlights"] }),
  });

  // ─── Navigation ───────────────────────────────────────────────
  function handleActualSubPageCount(n: number) {
    if (n === subPageCounts[chapterIdx]) return;
    setSubPageCounts(prev => { const nx = [...prev]; nx[chapterIdx] = n; return nx; });
    setSubPage(p => Math.min(p, n - 1));
  }

  function navigate(dir: "prev" | "next") {
    setAnimClass(dir === "next" ? "pg-enter-right" : "pg-enter-left");
    setTimeout(() => setAnimClass(""), 220);
    if (dir === "next") {
      if (subPage < subPageCount - 1) setSubPage(p => p + 1);
      else if (chapterIdx < chapters.length - 1) { setChapterIdx(i => i + 1); setSubPage(0); }
    } else {
      if (subPage > 0) setSubPage(p => p - 1);
      else if (chapterIdx > 0) { const p = chapterIdx - 1; setChapterIdx(p); setSubPage(subPageCounts[p] - 1); }
    }
  }

  function handleTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    // Don't swipe if user is selecting text
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim()) return;
    if (Math.abs(diff) > 55) { diff > 0 && hasNext ? navigate("next") : diff < 0 && hasPrev ? navigate("prev") : null; }
  }

  function goToChapter(idx: number) {
    setAnimClass("pg-enter-right");
    setTimeout(() => setAnimClass(""), 220);
    setChapterIdx(idx); setSubPage(0); setShowToc(false);
  }

  function pageLabel() {
    if (!chapter) return "";
    if (chapter.pageType === "front-matter" || chapter.pageType === "epilogue") return chapter.title;
    const pdfPageNum = chapter.pdfPage != null ? chapter.pdfPage + subPage : null;
    return pdfPageNum ? `Página ${pdfPageNum}` : `Cap. ${chapter.order}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bk-bg pt-safe"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <style>{BOOK_STYLES}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bk-sep bk-bg shrink-0">
        <button onClick={onClose} data-testid="btn-close-reader" className="p-2.5 active:opacity-50">
          <X size={22} className="bk-muted" />
        </button>
        <p className="text-[10px] uppercase tracking-[0.2em] bk-muted font-semibold">A Casa dos 20</p>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowHLPanel(true)} data-testid="btn-highlights-panel"
            className="p-2.5 active:opacity-50 relative">
            <Highlighter size={18} className="bk-muted" />
            {allHighlights.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-bold flex items-center justify-center px-0.5"
                style={{ background: "var(--bk-accent)", color: "var(--bk-bg)" }}>
                {allHighlights.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowToc(true)} data-testid="btn-toc" className="p-2.5 active:opacity-50">
            <List size={20} className="bk-muted" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] shrink-0" style={{ background: "var(--bk-sep)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--bk-accent)" }} />
      </div>

      {/* TOC overlay */}
      {showToc && (
        <div className="absolute inset-0 z-20 flex flex-col bk-bg overflow-hidden pt-safe">
          <style>{BOOK_STYLES}</style>
          <div className="flex items-center justify-between px-5 py-4 border-b bk-sep shrink-0">
            <h2 className="bk-serif text-lg bk-ink font-bold">Índice</h2>
            <button onClick={() => setShowToc(false)} className="p-2.5 active:opacity-50"><X size={20} className="bk-muted" /></button>
          </div>
          <TocPage chapters={chapters} purchased={purchased}
            onSelect={goToChapter} onBuy={() => { setShowToc(false); onBuy(); }} />
        </div>
      )}

      {/* Highlights panel */}
      {showHLPanel && (
        <div className="absolute inset-0 z-20 flex flex-col bk-bg overflow-hidden pt-safe">
          <style>{BOOK_STYLES}</style>
          <div className="flex items-center justify-between px-5 py-4 border-b bk-sep shrink-0">
            <div className="flex items-center gap-2">
              <Highlighter size={16} style={{ color: "var(--bk-accent)" }} />
              <h2 className="bk-serif text-lg bk-ink font-bold">As Tuas Marcações</h2>
            </div>
            <button onClick={() => setShowHLPanel(false)} className="p-2.5 active:opacity-50"><X size={20} className="bk-muted" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-12">
            {allHighlights.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center opacity-30"
                  style={{ background: "var(--bk-accent-light)" }}>
                  <Highlighter size={20} style={{ color: "var(--bk-accent)" }} />
                </div>
                <p className="bk-serif text-base bk-ink opacity-60">Ainda não marcaste nada.</p>
                <p className="text-sm bk-muted text-center">Seleciona texto no livro e escolhe uma cor para sublinhar.</p>
              </div>
            ) : (
              <div>
                {allHighlights.map(hl => {
                  const ch = chapters.find(c => c.id === hl.chapterId);
                  const colorBg = HL_COLORS[hl.color as HLColor]?.bg ?? "rgba(255,236,90,0.55)";
                  return (
                    <div key={hl.id} className="py-4 border-b bk-sep last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: colorBg }} />
                        <div className="flex-1 min-w-0">
                          {ch && (
                            <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
                              style={{ color: "var(--bk-accent)" }}>
                              {ch.pageType === "chapter" ? `Cap. ${ch.order} — ${ch.title.slice(0, 40)}` : ch.title}
                            </p>
                          )}
                          <p className="bk-serif text-[14px] bk-ink leading-relaxed italic">
                            "{hl.text}"
                          </p>
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                            <p className="text-[11px] bk-muted">
                              {new Date(hl.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                            <div className="flex items-center gap-3">
                              {ch && (
                                <button className="text-[11px] font-semibold active:opacity-60"
                                  style={{ color: "var(--bk-accent)" }}
                                  onClick={() => {
                                    const idx = chapters.findIndex(c => c.id === hl.chapterId);
                                    if (idx >= 0) { goToChapter(idx); setShowHLPanel(false); }
                                  }}>
                                  Ir ao capítulo
                                </button>
                              )}
                              <button className="flex items-center gap-1 text-[11px] active:opacity-60"
                                style={{ color: "var(--bk-muted)" }}
                                onClick={() => deleteHL.mutate(hl.id)}>
                                <Trash2 size={12} /> Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page content */}
      {chapter ? (
        <ChapterPage
          chapter={chapter}
          purchased={purchased}
          onBuy={onBuy}
          animClass={animClass}
          subPage={subPage}
          onActualSubPageCount={handleActualSubPageCount}
          allChapters={chapters}
          onGoToChapter={goToChapter}
          highlights={allHighlights}
          onSaveHighlight={(data) => saveHL.mutate(data)}
          onDeleteHighlight={(id) => deleteHL.mutate(id)}
        />
      ) : null}

      {/* Bottom navigation */}
      <div className="shrink-0 border-t bk-sep bk-bg px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("prev")} disabled={!hasPrev}
          data-testid="btn-prev-chapter"
          className="flex items-center gap-1 text-sm disabled:opacity-20 active:opacity-50 transition-opacity bk-muted">
          <ChevronLeft size={16} /> Anterior
        </button>
        <p className="text-[10px] bk-muted font-mono">{pageLabel()}</p>
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
    staleTime: 0,
    queryFn: async () => {
      const r = await fetch("/api/book/chapters", { credentials: "include" });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: purchaseStatus } = useQuery<PurchaseStatus>({
    queryKey: ["/api/book/purchase-status"],
    queryFn: async () => {
      const r = await fetch("/api/book/purchase-status", { credentials: "include" });
      if (!r.ok) return null;
      return r.json();
    },
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
                <p className="text-xs text-muted-foreground">{sortedChapters.filter(c=>c.pageType==="chapter").length} capítulos · sumário · introdução · dedicatória</p>
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
                  const isFM = chapter.pageType === "front-matter" || chapter.pageType === "epilogue";
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

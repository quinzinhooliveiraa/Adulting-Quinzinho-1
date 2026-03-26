import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, BookOpen, X, ChevronLeft, ChevronRight, ShoppingBag, ExternalLink, Instagram } from "lucide-react";
import bookCover from "@/assets/images/book-cover-oficial.png";
import authorImg from "../assets/author.webp";

type Chapter = {
  id: number;
  order: number;
  title: string;
  tag: string | null;
  excerpt: string | null;
  isPreview: boolean;
};

function ChapterReader({
  chapter,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  chapter: Chapter;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const { data: contentData, isLoading } = useQuery<{ content: string }>({
    queryKey: ["/api/book/chapters", chapter.id, "content"],
    queryFn: () =>
      fetch(`/api/book/chapters/${chapter.id}/content`, { credentials: "include" }).then((r) => r.json()),
  });

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors" data-testid="btn-close-reader">
          <X size={20} className="text-muted-foreground" />
        </button>
        <div className="text-center flex-1 px-4 min-w-0">
          {chapter.tag && <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{chapter.tag}</p>}
          <p className="text-sm font-serif font-semibold text-foreground truncate">{chapter.title}</p>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-sm text-muted-foreground animate-pulse">A carregar...</p>
          </div>
        ) : contentData?.content ? (
          <div className="max-w-prose mx-auto">
            {chapter.excerpt && (
              <p className="font-serif text-lg italic text-foreground/70 mb-8 leading-relaxed border-l-2 border-primary/30 pl-4">
                "{chapter.excerpt}"
              </p>
            )}
            <div className="font-serif text-base leading-relaxed text-foreground/85 whitespace-pre-wrap">
              {contentData.content}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-sm text-muted-foreground">Conteúdo ainda não disponível.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1.5 text-sm text-muted-foreground disabled:opacity-30 transition-opacity"
          data-testid="btn-prev-chapter"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-1.5 text-sm text-primary font-medium disabled:opacity-30 transition-opacity"
          data-testid="btn-next-chapter"
        >
          Próximo
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Book() {
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);

  const { data: chapters = [], isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/book/chapters"],
    queryFn: () => fetch("/api/book/chapters", { credentials: "include" }).then((r) => r.json()),
  });

  const selectedChapter = selectedChapterIdx !== null ? chapters[selectedChapterIdx] : null;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-700 overflow-x-hidden">
      <div className="px-6 md:px-10 pt-12 pb-28">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">O Livro</h1>
          <Bookmark size={20} className="text-muted-foreground" />
        </header>

        <div className="flex flex-col items-center mb-10">
          <div className="w-44 h-60 rounded-r-xl rounded-l-sm shadow-2xl shadow-primary/20 overflow-hidden relative border-l-[6px] border-primary/30 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
            <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
          </div>
          <h2 className="mt-8 font-serif text-2xl text-center text-foreground tracking-tight">A Casa dos 20</h2>
          <p className="text-sm text-muted-foreground text-center mt-2 italic font-serif">Refletindo sobre os Desafios da Transição para a Vida Adulta</p>
          <p className="text-xs text-primary/70 font-medium uppercase tracking-widest mt-4">Por Quinzinho Oliveira</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-serif text-xl text-foreground">Capítulos</h3>
            <BookOpen size={16} className="text-primary/50" />
          </div>

          {chaptersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">Os capítulos serão disponibilizados em breve.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {chapters.map((chapter, idx) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapterIdx(idx)}
                  data-testid={`chapter-card-${chapter.id}`}
                  className="bg-card border border-border rounded-2xl p-4 text-left flex items-center gap-4 transition-all hover:border-primary/30 active:scale-[0.98] w-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{chapter.order}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {chapter.tag && (
                      <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">{chapter.tag}</p>
                    )}
                    <p className="text-sm font-serif font-semibold text-foreground">{chapter.title}</p>
                    {chapter.excerpt && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{chapter.excerpt}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 bg-card rounded-3xl p-6 border border-border space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Comprar versão física ou digital</h3>
          </div>
          <p className="text-xs text-muted-foreground">Leva o livro para fora do app — em papel ou e-book.</p>
          <button
            onClick={() => window.open("https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/", "_blank")}
            className="w-full p-3.5 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]"
            data-testid="button-buy-amazon"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FF9900]/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#FF9900]">A</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-foreground">Amazon Brasil</p>
              <p className="text-[10px] text-muted-foreground">E-book e físico</p>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => window.open("https://books.apple.com/us/book/a-casa-dos-20/id6760140786", "_blank")}
            className="w-full p-3.5 bg-muted border border-border rounded-xl flex items-center gap-3 transition-all active:scale-[0.98]"
            data-testid="button-buy-apple"
          >
            <div className="w-8 h-8 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
              <span className="text-sm">🍎</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-foreground">Apple Books</p>
              <p className="text-[10px] text-muted-foreground">iBook digital</p>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="mt-6 bg-card rounded-3xl p-6 border border-border flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary overflow-hidden border-2 border-background shadow-md">
            <img src={authorImg} alt="Quinzinho Oliveira" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
          </div>
          <div>
            <h3 className="font-serif text-base text-foreground">Converse com o Autor</h3>
            <p className="text-xs text-muted-foreground mt-1">Feedback, histórias ou apenas para trocar ideias.</p>
          </div>
          <button
            onClick={() => window.open("https://www.instagram.com/quinzinhooliveiraa_/", "_blank")}
            className="w-full py-2.5 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white rounded-full text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            data-testid="btn-author-instagram"
          >
            <Instagram size={16} />
            @quinzinhooliveiraa_
          </button>
        </div>
      </div>

      {selectedChapter !== null && selectedChapterIdx !== null && (
        <ChapterReader
          chapter={selectedChapter}
          onClose={() => setSelectedChapterIdx(null)}
          onPrev={() => setSelectedChapterIdx((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() => setSelectedChapterIdx((i) => (i !== null && i < chapters.length - 1 ? i + 1 : i))}
          hasPrev={selectedChapterIdx > 0}
          hasNext={selectedChapterIdx < chapters.length - 1}
        />
      )}
    </div>
  );
}

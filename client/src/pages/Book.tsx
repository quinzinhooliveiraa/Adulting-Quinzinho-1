import { Bookmark, LockKeyhole, ChevronRight, BookOpen, Instagram, Mail, MessageCircle } from "lucide-react";
import bookCover from "@/assets/images/book-cover.png";
import solitudeArt from "@/assets/images/solitude.png";
import { Button } from "@/components/ui/button";

const CHAPTERS = [
  { 
    id: "solitude", 
    title: "A Solidão", 
    tag: "Essencial",
    excerpt: "Aprender a estar consigo mesmo é o primeiro passo para não depender da validação alheia. A solidão não é um quarto vazio, é um espaço de encontro.",
    image: solitudeArt,
    locked: false
  },
  { 
    id: "uncertainty", 
    title: "A Incerteza", 
    tag: "Transição",
    excerpt: "A incerteza não é o inimigo, é o terreno onde a coragem é cultivada. Não saber o próximo passo é o que torna a caminhada real.",
    locked: true
  },
  { 
    id: "identity", 
    title: "A Identidade", 
    tag: "Autoconhecimento",
    excerpt: "Você não é o que faz, nem o que possui. Você é o silêncio que resta quando todas as expectativas externas se calam.",
    locked: true
  }
];

export default function Book() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-700">
      <div className="px-6 pt-12 pb-24">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">O Livro</h1>
          <Bookmark size={20} className="text-muted-foreground" />
        </header>

        <div className="flex flex-col items-center mb-12">
          <div className="w-44 h-60 rounded-r-xl rounded-l-sm shadow-2xl shadow-primary/20 overflow-hidden relative border-l-[6px] border-primary/30 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
            <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
          </div>
          <h2 className="mt-8 font-serif text-2xl text-center text-foreground tracking-tight">A Casa dos 20</h2>
          <p className="text-sm text-muted-foreground text-center mt-2 italic font-serif">Refletindo sobre os Desafios da Transição para a Vida Adulta</p>
          <p className="text-xs text-primary/70 font-medium uppercase tracking-widest mt-4">Por Quinzinho Oliveira</p>
        </div>

        {/* Contact Author Section */}
        <div className="mb-12 bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-background shadow-md">
             <span className="font-serif text-2xl text-primary">QO</span>
          </div>
          <div>
            <h3 className="font-serif text-lg text-foreground">Converse com o Autor</h3>
            <p className="text-sm text-muted-foreground mt-1 px-4">
              Feedback, histórias ou apenas para trocar ideias sobre a jornada dos 20 anos.
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white hover:opacity-90 rounded-full h-12 shadow-md border-0 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            onClick={() => window.open('https://instagram.com/', '_blank')} // User can update exact handle
          >
            <Instagram size={20} />
            <span className="font-medium">@quinzinhooliveira</span>
          </Button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-serif text-xl text-foreground">Reflexões do Livro</h3>
            <BookOpen size={16} className="text-primary/50" />
          </div>

          <div className="grid gap-6">
            {CHAPTERS.map((chapter) => (
              <div 
                key={chapter.id} 
                className={`glass-card rounded-3xl overflow-hidden group transition-all duration-500 ${chapter.locked ? 'opacity-80' : 'hover:shadow-lg'}`}
              >
                {!chapter.locked && chapter.image && (
                  <div className="h-40 overflow-hidden relative">
                    <img src={chapter.image} alt={chapter.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                  </div>
                )}
                
                <div className={`p-6 relative ${!chapter.locked && chapter.image ? '-mt-10 bg-background/95 backdrop-blur-md' : 'bg-card'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
                      {chapter.tag}
                    </span>
                    {chapter.locked && <LockKeyhole size={14} className="text-muted-foreground" />}
                  </div>
                  
                  <h4 className="font-serif text-xl mb-3 text-foreground">{chapter.title}</h4>
                  
                  <div className="relative">
                    <p className={`font-serif text-base leading-relaxed text-foreground/80 italic ${chapter.locked ? 'blur-[3px] select-none' : ''}`}>
                      "{chapter.excerpt}"
                    </p>
                    {chapter.locked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95">
                          Desbloquear com Premium
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {!chapter.locked && (
                    <button className="mt-6 flex items-center space-x-2 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      <span>LER CAPÍTULO</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Bookmark } from "lucide-react";
import bookCover from "@/assets/images/book-cover.png";
import solitudeArt from "@/assets/images/solitude.png";

export default function Book() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-700">
      
      <div className="px-6 pt-12 pb-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-foreground">O Livro</h1>
          <Bookmark size={20} className="text-muted-foreground" />
        </header>

        <div className="flex flex-col items-center mb-10">
          <div className="w-40 h-56 rounded-r-xl rounded-l-sm shadow-xl shadow-primary/10 overflow-hidden relative border-l-4 border-primary/20">
            <img src={bookCover} alt="A Casa dos 20" className="w-full h-full object-cover" />
          </div>
          <h2 className="mt-6 font-serif text-xl text-center text-foreground">A Casa dos 20</h2>
          <p className="text-sm text-muted-foreground text-center mt-1">Por Quinzinho Oliveira</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-foreground">Trechos Diários</h3>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Reflexões</span>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden group">
            <div className="h-32 overflow-hidden relative">
              <img src={solitudeArt} alt="Solidão" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
            
            <div className="p-6 relative -mt-8 bg-background/95 backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-wider text-primary font-medium mb-3 block">
                Capítulo: A Solidão
              </span>
              <p className="font-serif text-base leading-relaxed text-foreground italic mb-4">
                "Aprender a estar consigo mesmo é o primeiro passo para não depender da validação alheia. A solidão não é um quarto vazio, é um espaço de encontro."
              </p>
              
              <div className="flex items-center space-x-3 pt-4 border-t border-border">
                <button className="text-xs font-medium text-primary hover:underline">
                  Ler capítulo completo
                </button>
              </div>
            </div>
          </div>

          {/* Locked Premium Content */}
          <div className="p-6 rounded-3xl bg-muted/30 border border-border relative overflow-hidden mt-6">
            <div className="absolute inset-0 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-3 z-10 bg-background/50">
              <span className="text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-full">
                Conteúdo Premium
              </span>
            </div>
            <div className="opacity-40">
              <span className="text-[10px] uppercase tracking-wider font-medium mb-3 block">
                Capítulo: A Incerteza
              </span>
              <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2" />
              <div className="h-4 bg-muted-foreground/20 rounded w-5/6 mb-2" />
              <div className="h-4 bg-muted-foreground/20 rounded w-4/6" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

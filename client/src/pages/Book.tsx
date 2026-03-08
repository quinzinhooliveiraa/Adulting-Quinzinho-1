import { Bookmark, LockKeyhole, ChevronRight, BookOpen, Instagram, Mail, MessageCircle, X } from "lucide-react";
import bookCover from "@/assets/images/book-cover-oficial.png";
import solitudeArt from "@/assets/images/solitude.png";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const CHAPTERS = [
  { 
    id: "solitude", 
    title: "A Solidão", 
    tag: "Essencial",
    excerpt: "É na solidão que nos conhecemos, mas é nas interações com os outros que crescemos.",
    fullText: "Aprender a estar consigo mesmo é o primeiro passo para não depender da validação alheia. A solidão não é um quarto vazio, é um espaço de encontro. Solidão não é vazio, é uma oportunidade para se encontrar.\n\nAlgumas pessoas estão destinadas a serem amadas apenas por um curto período de tempo. É normal se perder em alguém e ainda lutar para encontrar o seu caminho de volta. A verdadeira solidão não é um estado de abandono, mas um convite para redescobrir quem você é quando ninguém mais está olhando.\n\nEste é apenas um trecho do capítulo. Para ler a reflexão completa com todas as nuances e ensinamentos, você precisa adquirir o livro na Amazon.",
    image: solitudeArt,
    locked: false,
    preview: true
  },
  { 
    id: "uncertainty", 
    title: "A Incerteza", 
    tag: "Transição",
    excerpt: "Você já parou para pensar que a incerteza pode ser um presente inesperado em nossas vidas.",
    fullText: "A incerteza não é o inimigo, é o terreno onde a coragem é cultivada. Não saber o próximo passo é o que torna a caminhada real. Aqueles que nunca experimentaram a incerteza nunca realmente viveram.\n\nConfie no esforço que você está disposto a colocar, pois é ele que transforma a incerteza em oportunidade. Abraçar a incerteza é fundamental para o sucesso - é um convite para transformar as pessoas ao seu redor em colaboradores valiosos. A vida não oferece garantias, mas oferece possibilidades infinitas para quem tem coragem de enfrentar o desconhecido.",
    locked: false,
    preview: true
  },
  { 
    id: "identity", 
    title: "A Identidade", 
    tag: "Autoconhecimento",
    excerpt: "Você não pode se sentir confortável consigo mesmo se você não souber quem você é.",
    fullText: "Você não é o que faz, nem o que possui. Você é o silêncio que resta quando todas as expectativas externas se calam. Quando você finalmente para de tentar ser o que os outros esperam, você descobre quem você realmente é.\n\nAssumindo Quem Você Realmente É: Encarando o Medo de Não Ser Aceito. Tirando a Máscara: Vencendo a Síndrome de Impostor. A Jornada da Excepcionalidade: Aceitando Sua Singularidade. Sua identidade não é um destino, é um processo contínuo de descoberta e aceitação.",
    locked: false,
    preview: true
  },
  {
    id: "relationships",
    title: "Os Relacionamentos",
    tag: "Conexão",
    excerpt: "Se alguém quer estar na sua vida, essa pessoa estará.",
    fullText: "Os relacionamentos são o espelho onde nos vemos refletidos. Cada pessoa que entra na nossa vida nos ensina algo sobre nós mesmos, seja através do amor ou da dor.\n\nRazões para relacionamentos acabarem. Navegando Relacionamentos Unilaterais: Reconhecendo o Valor Próprio. As pessoas que o seu coração escolhe, mesmo quando pensa que é na hora errada, são simplesmente as pessoas erradas. Espero que você tenha a coragem de continuar amando profundamente em um mundo que às vezes falha em fazer isso. Os relacionamentos verdadeiros não são sobre perfeição, mas sobre aceitação.",
    locked: false,
    preview: true
  },
  {
    id: "purpose",
    title: "O Propósito",
    tag: "Significado",
    excerpt: "Encontrar propósito não é uma resposta, é uma jornada de descoberta diária.",
    fullText: "Aos vinte anos, muitos sentem a pressão de saber exatamente para onde estão indo. Mas a verdade é que o propósito não é algo que você encontra e coloca em uma prateleira.\n\nO propósito é algo que você constrói, que evolui, que muda conforme você cresce. Existem momentos em que você estará completamente perdido, e tudo bem estar perdido. Estar perdido significa que você ainda está explorando, ainda está buscando, ainda está vivo.\n\nSeu propósito pode ser ajudar alguém, criar algo, aprender tudo que puder, amar profundamente - ou tudo isso ao mesmo tempo. Não existe um único propósito correto. Existe apenas o seu.",
    locked: false,
    preview: true
  }
];

export const DAILY_REFLECTIONS = [
  { id: 1, text: "A solidão não é um quarto vazio, é um espaço de encontro.", fromBook: true },
  { id: 2, text: "Você não é o que faz, nem o que possui. Você é o silêncio que resta quando todas as expectativas externas se calam.", fromBook: true },
  { id: 3, text: "A incerteza não é o inimigo, é o terreno onde a coragem é cultivada.", fromBook: true },
  { id: 4, text: "Se alguém quer estar na sua vida, essa pessoa estará.", fromBook: true },
  { id: 5, text: "O propósito é algo que você constrói, que evolui, que muda conforme você cresce.", fromBook: true },
  { id: 6, text: "Estar perdido significa que você ainda está explorando, ainda está buscando, ainda está vivo.", fromBook: true },
  { id: 7, text: "Sua identidade não é um destino, é um processo contínuo de descoberta e aceitação.", fromBook: true },
  { id: 8, text: "Os relacionamentos verdadeiros não são sobre perfeição, mas sobre aceitação.", fromBook: true },
  { id: 9, text: "A vida não oferece garantias, mas oferece possibilidades infinitas para quem tem coragem de enfrentar o desconhecido.", fromBook: true },
  { id: 10, text: "Cada pessoa que entra na nossa vida nos ensina algo sobre nós mesmos, seja através do amor ou da dor.", fromBook: true },
  { id: 11, text: "Algumas pessoas estão destinadas a serem amadas apenas por um curto período de tempo. É normal se perder em alguém e ainda lutar para encontrar o seu caminho de volta.", fromBook: true },
  { id: 12, text: "A verdadeira solidão não é um estado de abandono, mas um convite para redescobrir quem você é quando ninguém mais está olhando.", fromBook: true },
  { id: 13, text: "Aqueles que nunca experimentaram a incerteza nunca realmente viveram.", fromBook: true },
  { id: 14, text: "Confie no esforço que você está disposto a colocar, pois é ele que transforma a incerteza em oportunidade.", fromBook: true },
  { id: 15, text: "Abraçar a incerteza é fundamental para o sucesso - é um convite para transformar as pessoas ao seu redor em colaboradores valiosos.", fromBook: true },
  { id: 16, text: "Quando você finalmente para de tentar ser o que os outros esperam, você descobre quem você realmente é.", fromBook: true },
  { id: 17, text: "Os relacionamentos são o espelho onde nos vemos refletidos.", fromBook: true },
  { id: 18, text: "Espero que você tenha a coragem de continuar amando profundamente em um mundo que às vezes falha em fazer isso.", fromBook: true },
  { id: 19, text: "Se você não precisasse provar nada a ninguém, o que estaria fazendo da sua vida agora?", fromBook: false },
  { id: 20, text: "O que você tem evitado sentir ultimamente?", fromBook: false },
  { id: 21, text: "Como você definiria 'sucesso' se o dinheiro não existisse?", fromBook: false },
  { id: 22, text: "Qual foi a última vez que você se sentiu verdadeiramente em paz consigo mesmo?", fromBook: false },
  { id: 23, text: "Você está vivendo a vida que escolheu ou a vida que esperam de você?", fromBook: false },
  { id: 24, text: "O que o seu 'eu' de 10 anos atrás pensaria de quem você é hoje?", fromBook: false },
  { id: 25, text: "Qual a diferença entre a solidão que dói e a solitude que cura?", fromBook: false },
  { id: 26, text: "Se você soubesse que vai dar certo, o que tentaria fazer hoje?", fromBook: false },
  { id: 27, text: "Em que relacionamentos você sente que pode ser 100% você mesmo?", fromBook: false },
  { id: 28, text: "O que você precisa perdoar em si mesmo para conseguir avançar?", fromBook: false },
  { id: 29, text: "Como você define 'fracasso' na sua vida neste momento?", fromBook: false },
  { id: 30, text: "Qual é o medo que mais o paralisa e por quê?", fromBook: false },
  { id: 31, text: "Quando foi a última vez que você fez algo apenas porque desejava, sem pressão externa?", fromBook: false },
  { id: 32, text: "O que você gostaria que as pessoas soubessem sobre você, mas nunca contou?", fromBook: false },
  { id: 33, text: "Como seria sua vida se você confiasse totalmente em si mesmo?", fromBook: false },
  { id: 34, text: "Qual é a mudança que você mais deseja fazer em si mesmo?", fromBook: false },
  { id: 35, text: "Se tivesse que escolher entre segurança e autenticidade, qual escolheria?", fromBook: false },
  { id: 36, text: "O que você aprendeu sobre si mesmo através de um relacionamento que terminou?", fromBook: false },
  { id: 37, text: "Como você gostaria de ser lembrado pelas pessoas que ama?", fromBook: false },
  { id: 38, text: "Qual é o seu maior arrependimento e o que ele te ensinou?", fromBook: false },
  { id: 39, text: "Você se aceita como você realmente é?", fromBook: false },
  { id: 40, text: "O que significa 'estar bem' para você neste exato momento?", fromBook: false },
];

function ChapterModal({ chapter, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-3xl max-h-[90vh] overflow-y-auto w-full max-w-lg animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-background flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-serif text-2xl text-foreground">{chapter.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">{chapter.tag}</p>
            <p className="font-serif text-lg italic text-foreground/80">"{chapter.excerpt}"</p>
          </div>
          
          <div className="border-t border-border pt-6">
            <p className="font-serif text-base leading-relaxed text-foreground/80">
              {chapter.fullText}
            </p>
          </div>
          
          <button
            onClick={() => window.open('https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/', '_blank')}
            className="w-full p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl font-bold text-sm hover:shadow-lg transition-all active:scale-95"
          >
            📖 Ler Mais na Amazon
          </button>
          
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              Este é um trecho do livro "A Casa dos 20" por Quinzinho Oliveira. Clique acima para comprar o livro completo na Amazon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Book() {
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

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
            onClick={() => window.open('https://www.instagram.com/quinzinhooliveiraa_/', '_blank')}
          >
            <Instagram size={20} />
            <span className="font-medium">@quinzinhooliveiraa_</span>
          </Button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-serif text-xl text-foreground">Reflexões do Livro</h3>
            <BookOpen size={16} className="text-primary/50" />
          </div>

          <div className="grid gap-6">
            {CHAPTERS.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapter(chapter)}
                className={`glass-card rounded-3xl overflow-hidden group transition-all duration-500 text-left hover:shadow-lg ${chapter.locked ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
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
                        <span className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-xs font-bold shadow-md">
                          Desbloquear com Premium
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {!chapter.locked && (
                    <div className="mt-6 flex items-center space-x-2 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                      <span>LER REFLEXÃO</span>
                      <ChevronRight size={14} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedChapter && (
        <ChapterModal chapter={selectedChapter} onClose={() => setSelectedChapter(null)} />
      )}
    </div>
  );
}

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
  // Reflections from book (70+)
  { id: 1, text: "A solidão não é um quarto vazio, é um espaço de encontro.", type: "reflection", fromBook: true },
  { id: 2, text: "Você não é o que faz, nem o que possui. Você é o silêncio que resta.", type: "reflection", fromBook: true },
  { id: 3, text: "A incerteza não é o inimigo, é o terreno onde a coragem é cultivada.", type: "reflection", fromBook: true },
  { id: 4, text: "Se alguém quer estar na sua vida, essa pessoa estará.", type: "reflection", fromBook: true },
  { id: 5, text: "O propósito é algo que você constrói, que evolui conforme cresce.", type: "reflection", fromBook: true },
  { id: 6, text: "Estar perdido significa que você ainda está explorando e buscando.", type: "reflection", fromBook: true },
  { id: 7, text: "Sua identidade é um processo contínuo de descoberta e aceitação.", type: "reflection", fromBook: true },
  { id: 8, text: "Os relacionamentos verdadeiros não são sobre perfeição, mas aceitação.", type: "reflection", fromBook: true },
  { id: 9, text: "A vida oferece possibilidades infinitas para quem enfrenta o desconhecido.", type: "reflection", fromBook: true },
  { id: 10, text: "Cada pessoa que entra em sua vida ensina algo através do amor ou da dor.", type: "reflection", fromBook: true },
  { id: 11, text: "Aprender a estar consigo mesmo é o primeiro passo para não depender de validação.", type: "reflection", fromBook: true },
  { id: 12, text: "A verdadeira solidão é um convite para redescobrir quem você é.", type: "reflection", fromBook: true },
  { id: 13, text: "Aqueles que nunca experimentaram incerteza nunca realmente viveram.", type: "reflection", fromBook: true },
  { id: 14, text: "Confie no esforço que transforma incerteza em oportunidade.", type: "reflection", fromBook: true },
  { id: 15, text: "Abraçar a incerteza é fundamental - é um convite para colaboradores valiosos.", type: "reflection", fromBook: true },
  { id: 16, text: "Quando para de tentar ser o que esperam, descobre quem realmente é.", type: "reflection", fromBook: true },
  { id: 17, text: "Os relacionamentos são o espelho onde nos vemos refletidos.", type: "reflection", fromBook: true },
  { id: 18, text: "Tenha coragem de continuar amando profundamente neste mundo.", type: "reflection", fromBook: true },
  { id: 19, text: "Não importa o que aconteça, você será resiliente - já sobreviveu a tudo.", type: "reflection", fromBook: true },
  { id: 20, text: "Pequenas ações alinhadas com valores valem mais que grandes metas vazias.", type: "reflection", fromBook: true },
  { id: 21, text: "Confie no processo. Suas buscas estão te levando exatamente aonde precisa.", type: "reflection", fromBook: true },
  { id: 22, text: "Crescer dói, mas estagnar dói muito mais. Orgulhe-se do seu progresso.", type: "reflection", fromBook: true },
  { id: 23, text: "Cada desafio é um degrau na construção da sua melhor versão.", type: "reflection", fromBook: true },
  { id: 24, text: "O amadurecimento é lento. Seja gentil com seu tempo.", type: "reflection", fromBook: true },
  { id: 25, text: "Respire. O futuro não chegou e você não precisa resolver tudo hoje.", type: "reflection", fromBook: true },
  { id: 26, text: "Sua ansiedade mostra que se importa, mas não é uma previsão do futuro.", type: "reflection", fromBook: true },
  { id: 27, text: "Está tudo bem não estar bem o tempo todo. Acolha seus sentimentos.", type: "reflection", fromBook: true },
  { id: 28, text: "Você é mais do que suas conquistas. Sua essência é única.", type: "reflection", fromBook: true },
  { id: 29, text: "A solitude é encontro consigo mesmo. Aproveite esse espaço.", type: "reflection", fromBook: true },
  { id: 30, text: "O propósito não é destino, é como você caminha todos os dias.", type: "reflection", fromBook: true },
  { id: 31, text: "A aceitação é o começo de toda transformação.", type: "reflection", fromBook: true },
  { id: 32, text: "Crescer é deixar morrer quem era para ser quem pode ser.", type: "reflection", fromBook: true },
  { id: 33, text: "Felicidade não é destino, é como você caminha todos os dias.", type: "reflection", fromBook: true },
  { id: 34, text: "Sua vida não precisa fazer sentido para ninguém, apenas para você.", type: "reflection", fromBook: true },
  { id: 35, text: "O medo é apenas um convite para descobrir sua coragem.", type: "reflection", fromBook: true },
  { id: 36, text: "Você merece dedicar tanta atenção a si mesmo quanto aos outros.", type: "reflection", fromBook: true },
  { id: 37, text: "Não se compare. Sua jornada tem seu próprio ritmo.", type: "reflection", fromBook: true },
  { id: 38, text: "A pessoa que está se tornando importa mais que a que era.", type: "reflection", fromBook: true },
  { id: 39, text: "Estar sozinho não é desamparado. É momento de recarregar.", type: "reflection", fromBook: true },
  { id: 40, text: "Sua companhia é preciosa. Cultive amor por si no silêncio.", type: "reflection", fromBook: true },
  { id: 41, text: "Você está com pressa para lugar que talvez não exista.", type: "reflection", fromBook: true },
  { id: 42, text: "Aprender a estar consigo sem se sentir vazio é lição de vida.", type: "reflection", fromBook: true },
  { id: 43, text: "Você não controla pensamentos alheios, mas controla quem é.", type: "reflection", fromBook: true },
  { id: 44, text: "Vida não é encontrar respostas, é fazer paz com perguntas.", type: "reflection", fromBook: true },
  { id: 45, text: "Você é o único que pode dar permissão para ser feliz.", type: "reflection", fromBook: true },
  { id: 46, text: "O que precisa ser feito foi criado por pessoas como você.", type: "reflection", fromBook: true },
  { id: 47, text: "Sua história é completa em si, não metade de outra.", type: "reflection", fromBook: true },
  { id: 48, text: "Você não é versão incompleta de ninguém.", type: "reflection", fromBook: true },
  { id: 49, text: "Personas do dia a dia podem te afastar de quem realmente é.", type: "reflection", fromBook: true },
  { id: 50, text: "Estar bem é escolha que você faz todos os dias.", type: "reflection", fromBook: true },
  { id: 51, text: "O mundo não precisa de Instagram. Precisa de você, de verdade.", type: "reflection", fromBook: true },
  { id: 52, text: "Você está investindo vida em coisas que realmente importam?", type: "reflection", fromBook: true },
  { id: 53, text: "Às vezes, quem você precisa perdoar é você mesmo.", type: "reflection", fromBook: true },
  { id: 54, text: "Você é trabalho em progresso. Tudo bem estar incompleto.", type: "reflection", fromBook: true },
  { id: 55, text: "Seu medo é proporcional ao tamanho do seu potencial.", type: "reflection", fromBook: true },
  { id: 56, text: "Você merece oportunidades, não apenas o que sobra.", type: "reflection", fromBook: true },
  { id: 57, text: "Sua história é livro, não postagem de rede social.", type: "reflection", fromBook: true },
  { id: 58, text: "Você não é carga. Sua presença é presente.", type: "reflection", fromBook: true },
  { id: 59, text: "Vida é muito mais que trabalho, status e possessões.", type: "reflection", fromBook: true },
  { id: 60, text: "Você tem permissão para mudar de ideia, sonho, direção.", type: "reflection", fromBook: true },
  { id: 61, text: "Transformar-se exige derrubar paredes que construiu.", type: "reflection", fromBook: true },
  { id: 62, text: "Jornada é sempre mais importante que destino.", type: "reflection", fromBook: true },
  { id: 63, text: "Você não é responsável por sentimentos alheios, mas pelos seus.", type: "reflection", fromBook: true },
  { id: 64, text: "Liberdade verdadeira começa quando para de depender de aprovação.", type: "reflection", fromBook: true },
  { id: 65, text: "Você merece estar com pessoas que escolhem estar com você.", type: "reflection", fromBook: true },
  { id: 66, text: "Tempo consigo mesmo é tão importante quanto com outros.", type: "reflection", fromBook: true },
  { id: 67, text: "Seu valor não diminui porque outros não conseguem enxergá-lo.", type: "reflection", fromBook: true },
  { id: 68, text: "Vida oferece lições em forma de desafios, não castigos.", type: "reflection", fromBook: true },
  { id: 69, text: "Você está sempre a um passo de nova versão de si.", type: "reflection", fromBook: true },
  { id: 70, text: "Ser autêntico é assustador, mas viver mentira é pior.", type: "reflection", fromBook: true },
  
  // Tips (Dicas)
  { id: 101, text: "Comece seu dia com 5 minutos de respiração consciente para clareza mental.", type: "tip" },
  { id: 102, text: "Escreva 3 coisas que aprecia de si mesmo antes de dormir.", type: "tip" },
  { id: 103, text: "Tire um tempo de 1 hora longe de telas pelo menos uma vez por dia.", type: "tip" },
  { id: 104, text: "Quando sentir ansiedade, diga seu nome três vezes e respire profundamente.", type: "tip" },
  { id: 105, text: "Converse com alguém que você confia sobre o que sente.", type: "tip" },
  { id: 106, text: "Caminhe pela natureza quando se sentir preso ou confuso.", type: "tip" },
  { id: 107, text: "Mantenha um diário onde escreve sem julgar o que pensa.", type: "tip" },
  { id: 108, text: "Pratique dizer 'não' sem dar explicações ou sentir culpa.", type: "tip" },
  { id: 109, text: "Faça uma coisa que o assusta um pouco cada semana.", type: "tip" },
  { id: 110, text: "Ouça música que faz seu corpo dançar livremente.", type: "tip" },
  { id: 111, text: "Reserve tempo para fazer absolutamente nada sem culpa.", type: "tip" },
  { id: 112, text: "Aprenda a dizer 'me sinto melhor sozinho agora' sem explicações.", type: "tip" },
  { id: 113, text: "Crie uma música ou playlist que represente seu estado emocional.", type: "tip" },
  { id: 114, text: "Escreva uma carta para si mesmo do seu eu futuro.", type: "tip" },
  { id: 115, text: "Medite mesmo que seja apenas por 2 minutos ao acordar.", type: "tip" },
  { id: 116, text: "Telefone para alguém em vez de enviar mensagem.", type: "tip" },
  { id: 117, text: "Durma mais. Seu corpo e mente precisam disso.", type: "tip" },
  { id: 118, text: "Faça algo que pequeno todos os dias que é só para você.", type: "tip" },
  { id: 119, text: "Aprenda a identificar o que realmente quer versus o que esperam.", type: "tip" },
  { id: 120, text: "Estabeleça limites claros sem se sentir egoísta.", type: "tip" },
  { id: 121, text: "Escute seu corpo quando diz que precisa desacelerar.", type: "tip" },
  { id: 122, text: "Pratique gratidão por uma coisa pequena todo dia.", type: "tip" },
  { id: 123, text: "Procure ajuda profissional se ansiedade se torna avassaladora.", type: "tip" },
  { id: 124, text: "Crie um espaço só seu onde se sinta seguro e calmo.", type: "tip" },
  { id: 125, text: "Tire foto de coisas que te fazem feliz como recordação.", type: "tip" },
  { id: 126, text: "Leia poesia ou prosa que ressoa com sua alma.", type: "tip" },
  { id: 127, text: "Dance como se ninguém estivesse olhando (porque não estão).", type: "tip" },
  { id: 128, text: "Fale a verdade mesmo quando custa. Liberdade vale a pena.", type: "tip" },
  { id: 129, text: "Perdoe seu corpo pelos 'erros' e abusos que sofreu.", type: "tip" },
  { id: 130, text: "Desenvolva uma rotina que faz você se sentir cuidado.", type: "tip" },
  
  // Reminders (Lembretes)
  { id: 201, text: "Lembre-se: você já sobreviveu a 100% dos seus piores dias.", type: "reminder" },
  { id: 202, text: "Lembre-se: o que os outros pensam é problema deles, não seu.", type: "reminder" },
  { id: 203, text: "Lembre-se: seus sentimentos são válidos, todos eles.", type: "reminder" },
  { id: 204, text: "Lembre-se: você é mais forte do que qualquer coisa enfrentou.", type: "reminder" },
  { id: 205, text: "Lembre-se: está tudo bem não saber todas as respostas.", type: "reminder" },
  { id: 206, text: "Lembre-se: cada cicatriz conta uma história de sobrevivência.", type: "reminder" },
  { id: 207, text: "Lembre-se: você não é menos por estar tendo dificuldades.", type: "reminder" },
  { id: 208, text: "Lembre-se: sua vida importa e faz diferença no mundo.", type: "reminder" },
  { id: 209, text: "Lembre-se: dizer 'não' é ato de amor próprio.", type: "reminder" },
  { id: 210, text: "Lembre-se: mudança não precisa ser rápida para ser real.", type: "reminder" },
  { id: 211, text: "Lembre-se: você merece as mesmas chances que dá aos outros.", type: "reminder" },
  { id: 212, text: "Lembre-se: está tudo bem pedir ajuda quando precisa.", type: "reminder" },
  { id: 213, text: "Lembre-se: seus 'fracassos' são apenas preparação para sucesso.", type: "reminder" },
  { id: 214, text: "Lembre-se: você não é definido por seu passado.", type: "reminder" },
  { id: 215, text: "Lembre-se: ser gentil consigo é ato revolucionário.", type: "reminder" },
  { id: 216, text: "Lembre-se: você está fazendo muito melhor do que pensa.", type: "reminder" },
  { id: 217, text: "Lembre-se: sua sanidade mental é prioridade número um.", type: "reminder" },
  { id: 218, text: "Lembre-se: estar sozinho não é ser rejeitado.", type: "reminder" },
  { id: 219, text: "Lembre-se: você merece amor e carinho do seu próprio coração.", type: "reminder" },
  { id: 220, text: "Lembre-se: pequenos passos ainda são progresso.", type: "reminder" },
  { id: 221, text: "Lembre-se: você está crescendo mesmo quando duvida.", type: "reminder" },
  { id: 222, text: "Lembre-se: sua presença é suficiente, você não precisa 'fazer'.", type: "reminder" },
  { id: 223, text: "Lembre-se: é ok mudar de ideia e escolher novo caminho.", type: "reminder" },
  { id: 224, text: "Lembre-se: você é merecedor de boas coisas.", type: "reminder" },
  { id: 225, text: "Lembre-se: desculpe-se, mas não leve culpa que não é sua.", type: "reminder" },
  { id: 226, text: "Lembre-se: você é suficiente exatamente como é.", type: "reminder" },
  { id: 227, text: "Lembre-se: este momento difícil também vai passar.", type: "reminder" },
  { id: 228, text: "Lembre-se: você não precisa ganhar amor - já o merece.", type: "reminder" },
  { id: 229, text: "Lembre-se: sua história ainda está sendo escrita.", type: "reminder" },
  { id: 230, text: "Lembre-se: você é amado exatamente como é.", type: "reminder" },
  
  // Questions (Perguntas)
  { id: 301, text: "Se você não precisasse provar nada a ninguém, o que faria?", type: "question" },
  { id: 302, text: "O que tem evitado sentir ultimamente?", type: "question" },
  { id: 303, text: "Como definiria 'sucesso' sem dinheiro?", type: "question" },
  { id: 304, text: "Quando foi a última vez que se sentiu verdadeiramente em paz?", type: "question" },
  { id: 305, text: "Vive a vida que escolheu ou que esperam de você?", type: "question" },
  { id: 306, text: "O que seu 'eu' de 10 anos pensaria de quem é hoje?", type: "question" },
  { id: 307, text: "Qual a diferença entre solidão que dói e solitude que cura?", type: "question" },
  { id: 308, text: "Se soubesse que vai dar certo, o que tentaria fazer?", type: "question" },
  { id: 309, text: "Em que relacionamentos você é 100% você mesmo?", type: "question" },
  { id: 310, text: "O que precisa perdoar em si para avançar?", type: "question" },
  { id: 311, text: "Como define 'fracasso' em sua vida neste momento?", type: "question" },
  { id: 312, text: "Qual é o medo que mais o paralisa?", type: "question" },
  { id: 313, text: "Quando fez algo apenas porque desejava, sem pressão?", type: "question" },
  { id: 314, text: "O que gostaria que soubessem mas nunca contou?", type: "question" },
  { id: 315, text: "Como seria a vida confiando totalmente em si?", type: "question" },
  { id: 316, text: "Qual mudança mais deseja fazer em si mesmo?", type: "question" },
  { id: 317, text: "Escolheria segurança ou autenticidade?", type: "question" },
  { id: 318, text: "O que aprendeu sobre si através de relacionamento que terminou?", type: "question" },
  { id: 319, text: "Como gostaria de ser lembrado pelas pessoas que ama?", type: "question" },
  { id: 320, text: "Qual seu maior arrependimento e o que ensinou?", type: "question" },
  { id: 321, text: "Se aceita como você realmente é?", type: "question" },
  { id: 322, text: "O que significa 'estar bem' neste exato momento?", type: "question" },
  { id: 323, text: "Qual memória da infância ainda te define?", type: "question" },
  { id: 324, text: "Se pudesse aconselhar seu 'eu' de 20 anos, qual seria?", type: "question" },
  { id: 325, text: "O que valoriza mais: ser amado ou compreendido?", type: "question" },
  { id: 326, text: "Qual crença sobre si gostaria de deixar para trás?", type: "question" },
  { id: 327, text: "Quando se sente mais vivo?", type: "question" },
  { id: 328, text: "O que faria diferente sem medo das consequências?", type: "question" },
  { id: 329, text: "Qual sua maior força, segundo você?", type: "question" },
  { id: 330, text: "Como saberia que finalmente se ama?", type: "question" },
  { id: 331, text: "O que significa vulnerabilidade para você?", type: "question" },
  { id: 332, text: "Qual a lição de vida mais importante aprendeu?", type: "question" },
  { id: 333, text: "Qual som mais te acalma?", type: "question" },
  { id: 334, text: "Permitiria que alguém fosse o que você é?", type: "question" },
  { id: 335, text: "O que pensaria sem voz interna crítica?", type: "question" },
  { id: 336, text: "Qual coisa mais bonita já viu em outra pessoa?", type: "question" },
  { id: 337, text: "Se pudesse esquecer algo, o que seria?", type: "question" },
  { id: 338, text: "Como quer que as pessoas se lembrem de você?", type: "question" },
  { id: 339, text: "Qual parte de você ninguém vê?", type: "question" },
  { id: 340, text: "O que diria a si nos momentos difíceis?", type: "question" },
  { id: 341, text: "Se houvesse segunda chance, você a tomaria?", type: "question" },
  { id: 342, text: "Qual verdade mais doce que conhece?", type: "question" },
  { id: 343, text: "Está no lugar onde quer estar?", type: "question" },
  { id: 344, text: "O que significa estar em casa para você?", type: "question" },
  { id: 345, text: "Qual coisa menos espera que descubram sobre você?", type: "question" },
  { id: 346, text: "Se medo não existisse, quem seria?", type: "question" },
  { id: 347, text: "O que está guardando para 'depois'?", type: "question" },
  { id: 348, text: "Qual é o maior amor de sua vida?", type: "question" },
  { id: 349, text: "Como escolhe entre o que quer e precisa?", type: "question" },
  { id: 350, text: "O que deixou de lado que deveria retomar?", type: "question" },
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

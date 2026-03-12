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
  // Book Reflections (70+)
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

  // Deep Reflections (230+)
  { id: 71, text: "O silêncio é onde a sabedoria mora, mas você precisa aprender a ouvir.", type: "reflection", fromBook: false },
  { id: 72, text: "Vulnerabilidade é o pré-requisito para genuína conexão humana.", type: "reflection", fromBook: false },
  { id: 73, text: "Você carrega histórias que ainda não tem permissão de contar.", type: "reflection", fromBook: false },
  { id: 74, text: "O amor próprio não é arrogância, é sobrevivência.", type: "reflection", fromBook: false },
  { id: 75, text: "Às vezes, a pessoa mais tóxica em sua vida é você mesmo.", type: "reflection", fromBook: false },
  { id: 76, text: "Seu passado não define seu futuro, apenas o informa.", type: "reflection", fromBook: false },
  { id: 77, text: "A verdade sempre dói mais no começo, mas liberta depois.", type: "reflection", fromBook: false },
  { id: 78, text: "Você é autorizado a ser diferente, estranho, e completamente você.", type: "reflection", fromBook: false },
  { id: 79, text: "Alguns medos devem ser enfrentados, outros devem ser aceitos.", type: "reflection", fromBook: false },
  { id: 80, text: "Crescimento é desconfortável porque você está deixando segurança.", type: "reflection", fromBook: false },
  { id: 81, text: "A vida grita através de sinais que você está ignorando deliberadamente.", type: "reflection", fromBook: false },
  { id: 82, text: "Você não é aquilo que lhe aconteceu, você é o que faz com isso.", type: "reflection", fromBook: false },
  { id: 83, text: "Perdoe, não porque merecem, mas porque você merece paz.", type: "reflection", fromBook: false },
  { id: 84, text: "Seu corpo mantém registro de coisas que sua mente esqueceu.", type: "reflection", fromBook: false },
  { id: 85, text: "A esperança é um ato político quando tudo quer destruir você.", type: "reflection", fromBook: false },
  { id: 86, text: "Você é simultaneamente forte e quebrado, e ambas são verdades.", type: "reflection", fromBook: false },
  { id: 87, text: "O presente é o único lugar onde você realmente pode viver.", type: "reflection", fromBook: false },
  { id: 88, text: "Sua voz importa, mesmo quando ninguém está ouvindo.", type: "reflection", fromBook: false },
  { id: 89, text: "A morte ensina mais sobre vida do que qualquer religião.", type: "reflection", fromBook: false },
  { id: 90, text: "Você está permitindo que a vida aconteça ou está vivendo-a?", type: "reflection", fromBook: false },
  { id: 91, text: "O ego protege, mas também isola. Equilibre sabedoria e proteção.", type: "reflection", fromBook: false },
  { id: 92, text: "Seus medos são professores disfarçados de demônios.", type: "reflection", fromBook: false },
  { id: 93, text: "Você é mais complexo do que qualquer rótulo pode descrever.", type: "reflection", fromBook: false },
  { id: 94, text: "Algumas coisas só fazem sentido quando param de fazer sentido.", type: "reflection", fromBook: false },
  { id: 95, text: "A solidão é o preço da liberdade. Vale a pena pagar?", type: "reflection", fromBook: false },
  { id: 96, text: "Você está vivendo sua vida ou a vida que planejou?", type: "reflection", fromBook: false },
  { id: 97, text: "O que você acha normal é apenas o que se acostumou a aceitar.", type: "reflection", fromBook: false },
  { id: 98, text: "Você sabe diferenciar medo de intuição?", type: "reflection", fromBook: false },
  { id: 99, text: "A vida continua com ou sem sua ansiedade. Escolha deixar ir.", type: "reflection", fromBook: false },
  { id: 100, text: "Você é o produto de todas as escolhas que fez até aqui.", type: "reflection", fromBook: false },
  { id: 101, text: "A compaixão por si mesmo é o primeiro passo para com os outros.", type: "reflection", fromBook: false },
  { id: 102, text: "Seu coração sabe coisas que sua mente ainda está negando.", type: "reflection", fromBook: false },
  { id: 103, text: "Você não é responsável por curar ninguém, nem por ser curado.", type: "reflection", fromBook: false },
  { id: 104, text: "O significado da vida é o que você decide que é.", type: "reflection", fromBook: false },
  { id: 105, text: "Você está correndo de algo ou em direção a algo?", type: "reflection", fromBook: false },
  { id: 106, text: "A beleza está na imperfeição que você tenta esconder.", type: "reflection", fromBook: false },
  { id: 107, text: "Alguns relacionamentos são lições, não destinações.", type: "reflection", fromBook: false },
  { id: 108, text: "Você está escolhendo amor ou medo em cada momento?", type: "reflection", fromBook: false },
  { id: 109, text: "A vida é uma série de pequenas mortes antes de renascimentos.", type: "reflection", fromBook: false },
  { id: 110, text: "Você está vivendo ou apenas sobrevivendo ao dia?", type: "reflection", fromBook: false },
  { id: 111, text: "O silêncio de alguém diz mais que mil palavras.", type: "reflection", fromBook: false },
  { id: 112, text: "Seu trauma não define você, mas moldou você até agora.", type: "reflection", fromBook: false },
  { id: 113, text: "Você é permitido reescrever sua história a cada momento.", type: "reflection", fromBook: false },
  { id: 114, text: "A leveza vem quando você finalmente aceita o peso.", type: "reflection", fromBook: false },
  { id: 115, text: "Você está esperando permissão que já deveria ter dado a si.", type: "reflection", fromBook: false },
  { id: 116, text: "O amor próprio é revolucionário em um mundo que lucra com sua insegurança.", type: "reflection", fromBook: false },
  { id: 117, text: "Você conhece o lado sombra de si mesmo? Deveria.", type: "reflection", fromBook: false },
  { id: 118, text: "A vida não promete justa, apenas promete possibilidades.", type: "reflection", fromBook: false },
  { id: 119, text: "Você está guardando ressentimento que só o prejudica.", type: "reflection", fromBook: false },
  { id: 120, text: "Algumas feridas precisam cicatrizar sozinhas, sem sua interferência.", type: "reflection", fromBook: false },
  { id: 121, text: "O medo é a emoção mais honesta, porque sempre diz a verdade.", type: "reflection", fromBook: false },
  { id: 122, text: "Você está tentando ser perfeito para alguém que nem te ama.", type: "reflection", fromBook: false },
  { id: 123, text: "A paciência é uma forma de amor, começando com você mesmo.", type: "reflection", fromBook: false },
  { id: 124, text: "Você sabe qual é o seu verdadeiro preço?", type: "reflection", fromBook: false },
  { id: 125, text: "A morte coloca tudo em perspectiva. O que você vê agora?", type: "reflection", fromBook: false },
  { id: 126, text: "Você é a versão mais evoluída de si mesmo que já foi.", type: "reflection", fromBook: false },
  { id: 127, text: "O que você recusa a aceitar é o que você mais precisa aprender.", type: "reflection", fromBook: false },
  { id: 128, text: "Você está permitindo que outros escrevam seu roteiro.", type: "reflection", fromBook: false },
  { id: 129, text: "A dor é uma mensagem, não uma sentença.", type: "reflection", fromBook: false },
  { id: 130, text: "Você precisa perder algo precioso para entender seu valor.", type: "reflection", fromBook: false },
  { id: 131, text: "A vida é um constante retorno a si mesmo, em espiral.", type: "reflection", fromBook: false },
  { id: 132, text: "Você está dando mais do que recebe, e já percebeu?", type: "reflection", fromBook: false },
  { id: 133, text: "O amor genuíno exige honestidade brutal consigo mesmo.", type: "reflection", fromBook: false },
  { id: 134, text: "Você é um espelho para o que os outros precisam ver em si.", type: "reflection", fromBook: false },
  { id: 135, text: "A vida continua enquanto você debate se merece felicidade.", type: "reflection", fromBook: false },
  { id: 136, text: "Você está vivendo em piloto automático?", type: "reflection", fromBook: false },
  { id: 137, text: "A verdadeira força é admitir quando está quebrado.", type: "reflection", fromBook: false },
  { id: 138, text: "Você está correndo da morte ou em direção à vida?", type: "reflection", fromBook: false },
  { id: 139, text: "O tempo só importa quando você finalmente acorda para o momento.", type: "reflection", fromBook: false },
  { id: 140, text: "Você está vivendo ou apenas distraindo a si mesmo de viver?", type: "reflection", fromBook: false },
  { id: 141, text: "A solidão é diferente de estar sozinho. Você sabe a diferença?", type: "reflection", fromBook: false },
  { id: 142, text: "Você é a versão mais assustadora de si mesmo para os outros.", type: "reflection", fromBook: false },
  { id: 143, text: "O que você finge estar tudo bem está destruindo você lentamente.", type: "reflection", fromBook: false },
  { id: 144, text: "Você merece estar ao redor de pessoas que o escolhem todos os dias.", type: "reflection", fromBook: false },
  { id: 145, text: "A vida é uma coleção de momentos pequenos que significam tudo.", type: "reflection", fromBook: false },
  { id: 146, text: "Você está permitindo que a cultura defina seu corpo e alma.", type: "reflection", fromBook: false },
  { id: 147, text: "O medo é o único professor que nunca te abandona.", type: "reflection", fromBook: false },
  { id: 148, text: "Você conhece a diferença entre solidão e isolamento?", type: "reflection", fromBook: false },
  { id: 149, text: "A vida é sobre aquilo que você recusa a negar.", type: "reflection", fromBook: false },
  { id: 150, text: "Você está construindo uma vida ou escapando dela?", type: "reflection", fromBook: false },
  { id: 151, text: "A graça está no que você não planejou.", type: "reflection", fromBook: false },
  { id: 152, text: "Você é tão livre quanto permite a si mesmo ser.", type: "reflection", fromBook: false },
  { id: 153, text: "O que você sente é tão importante quanto o que você pensa.", type: "reflection", fromBook: false },
  { id: 154, text: "Você está construindo pontes ou muros?", type: "reflection", fromBook: false },
  { id: 155, text: "A vida recompensa os que se atrevem a ser vulneráveis.", type: "reflection", fromBook: false },
  { id: 156, text: "Você conhece seus próprios limites ou deixa outros os definirem?", type: "reflection", fromBook: false },
  { id: 157, text: "O amor é um ato de coragem, não de fraqueza.", type: "reflection", fromBook: false },
  { id: 158, text: "Você está vivendo sua vida ou a vida que seus pais quiseram.", type: "reflection", fromBook: false },
  { id: 159, text: "A verdade é a única coisa que não pode ser roubada.", type: "reflection", fromBook: false },
  { id: 160, text: "Você merece ter sonhos que assustam você.", type: "reflection", fromBook: false },
  { id: 161, text: "A vida é simples, você é que complica com pensamentos.", type: "reflection", fromBook: false },
  { id: 162, text: "Você está fazendo concessões que prejudicam seu espírito?", type: "reflection", fromBook: false },
  { id: 163, text: "O poder está na aceitação do que você não pode mudar.", type: "reflection", fromBook: false },
  { id: 164, text: "Você sabe qual é a diferença entre viver e existir?", type: "reflection", fromBook: false },
  { id: 165, text: "A morte é um professor melhor que qualquer filósofo.", type: "reflection", fromBook: false },
  { id: 166, text: "Você está escondendo sua verdadeira natureza?", type: "reflection", fromBook: false },
  { id: 167, text: "O silêncio é conforto ou fuga para você?", type: "reflection", fromBook: false },
  { id: 168, text: "Você está esperando permissão que já deveria ter.", type: "reflection", fromBook: false },
  { id: 169, text: "A vida recompensa quem se atreve a ser autêntico.", type: "reflection", fromBook: false },
  { id: 170, text: "Você está vivendo para impressionar ou para expressão?", type: "reflection", fromBook: false },
  { id: 171, text: "O que você recusa a sentir está controlando você silenciosamente.", type: "reflection", fromBook: false },
  { id: 172, text: "Você merece estar ao redor de pessoas que escolhem você.", type: "reflection", fromBook: false },
  { id: 173, text: "A verdadeira beleza é o que você não consegue esconder.", type: "reflection", fromBook: false },
  { id: 174, text: "Você está vivendo seu design original ou uma cópia?", type: "reflection", fromBook: false },
  { id: 175, text: "O medo é apenas ar. Você pode respirar através dele.", type: "reflection", fromBook: false },
  { id: 176, text: "Você conhece o valor do seu silêncio?", type: "reflection", fromBook: false },
  { id: 177, text: "A vida é sobre aquilo que você escolhe conscientemente.", type: "reflection", fromBook: false },
  { id: 178, text: "Você está permitindo que circunstâncias definem seu caráter?", type: "reflection", fromBook: false },
  { id: 179, text: "A graça é encontrada no desespero mais profundo.", type: "reflection", fromBook: false },
  { id: 180, text: "Você é mais forte que qualquer coisa que enfrenta.", type: "reflection", fromBook: false },
  { id: 181, text: "O que você nega é o que mais precisa encarar.", type: "reflection", fromBook: false },
  { id: 182, text: "Você está vivendo de forma que seus filhos admirariam?", type: "reflection", fromBook: false },
  { id: 183, text: "A verdade liberta, mas primeiro aterroriza.", type: "reflection", fromBook: false },
  { id: 184, text: "Você merece estar cercado de pessoas que somam.", type: "reflection", fromBook: false },
  { id: 185, text: "O silêncio pode ser a resposta quando a fala falha.", type: "reflection", fromBook: false },
  { id: 186, text: "Você está construindo algo que os outros querem ou você precisa?", type: "reflection", fromBook: false },
  { id: 187, text: "A vida é sagrada nos detalhes aparentemente insignificantes.", type: "reflection", fromBook: false },
  { id: 188, text: "Você conhece a diferença entre ambição e gananência?", type: "reflection", fromBook: false },
  { id: 189, text: "O amor começa quando você aceita quem alguém realmente é.", type: "reflection", fromBook: false },
  { id: 190, text: "Você está vivendo ou apenas preparando para viver?", type: "reflection", fromBook: false },
  { id: 191, text: "A dor que você recusa a sentir está doendo ainda mais.", type: "reflection", fromBook: false },
  { id: 192, text: "Você merece uma vida que não pareça com a de ninguém mais.", type: "reflection", fromBook: false },
  { id: 193, text: "O poder real está em aceitar o que não pode controlar.", type: "reflection", fromBook: false },
  { id: 194, text: "Você está esperando para viver ou vivendo enquanto espera?", type: "reflection", fromBook: false },
  { id: 195, text: "A verdade é mais estranha e bonita que qualquer ficção.", type: "reflection", fromBook: false },
  { id: 196, text: "Você está alimentando sua alma ou apenas seu ego?", type: "reflection", fromBook: false },
  { id: 197, text: "O medo compartilhado torna-se força coletiva.", type: "reflection", fromBook: false },
  { id: 198, text: "Você sabe qual é seu propósito maior?", type: "reflection", fromBook: false },
  { id: 199, text: "A vida continua porque você continua respirando.", type: "reflection", fromBook: false },
  { id: 200, text: "Você está vivendo sua melhor vida ou a vida segura?", type: "reflection", fromBook: false },
  { id: 201, text: "O que você reprime é o que mais o controla.", type: "reflection", fromBook: false },
  { id: 202, text: "Você merece estar em espaços que o seguram com cuidado.", type: "reflection", fromBook: false },
  { id: 203, text: "A verdade é revolucionária em um mundo de mentiras.", type: "reflection", fromBook: false },
  { id: 204, text: "Você está vivendo ou está deixando a vida viver por você?", type: "reflection", fromBook: false },
  { id: 205, text: "O amor próprio é o fundamento de toda outra verdade.", type: "reflection", fromBook: false },
  { id: 206, text: "Você sabe quando dizer 'não' é dizer 'sim' a si mesmo?", type: "reflection", fromBook: false },
  { id: 207, text: "A vida é a resposta que você estava procurando.", type: "reflection", fromBook: false },
  { id: 208, text: "Você está permitindo que medo é dita a sua história?", type: "reflection", fromBook: false },
  { id: 209, text: "O poder está em aceitar sua fraqueza.", type: "reflection", fromBook: false },
  { id: 210, text: "Você merece estar ao lado de quem realmente o vê.", type: "reflection", fromBook: false },
  { id: 211, text: "A verdade dura é mais valiosa que a mentira confortável.", type: "reflection", fromBook: false },
  { id: 212, text: "Você está vivendo seu script ou criando um novo?", type: "reflection", fromBook: false },
  { id: 213, text: "O amor é a coragem de ser conhecida e ainda ser escolhida.", type: "reflection", fromBook: false },
  { id: 214, text: "Você sabe o que significa estar vivo?", type: "reflection", fromBook: false },
  { id: 215, text: "A vida não espera por você estar pronto.", type: "reflection", fromBook: false },
  { id: 216, text: "Você está alimentando relações que o diminuem?", type: "reflection", fromBook: false },
  { id: 217, text: "O silêncio é espaço onde o eu verdadeiro habita.", type: "reflection", fromBook: false },
  { id: 218, text: "Você merece estar ao lado de quem celebra seu crescimento.", type: "reflection", fromBook: false },
  { id: 219, text: "A verdade que você evita é a verdade que precisa dizer.", type: "reflection", fromBook: false },
  { id: 220, text: "Você está vivendo ou apenas cumprindo uma agenda?", type: "reflection", fromBook: false },
  { id: 221, text: "O que você teme mais é exatamente onde você mais crescerá.", type: "reflection", fromBook: false },
  { id: 222, text: "Você sabe qual é a diferença entre estar com alguém e estar perto?", type: "reflection", fromBook: false },
  { id: 223, text: "A vida é feita de pequenos 'sins' que acumulam em significado.", type: "reflection", fromBook: false },
  { id: 224, text: "Você está esperando permissão que não virá de fora.", type: "reflection", fromBook: false },
  { id: 225, text: "O amor é a coisa mais perigosa e sagrada que você pode fazer.", type: "reflection", fromBook: false },
  { id: 226, text: "Você merece estar ao lado de quem escolhe você repetidamente.", type: "reflection", fromBook: false },
  { id: 227, text: "A morte ensina que o tempo é o único luxo real.", type: "reflection", fromBook: false },
  { id: 228, text: "Você está vivendo sua vida ou a vida que lhe foi atribuída?", type: "reflection", fromBook: false },
  { id: 229, text: "O que você acha pequeno é importante para alguém.", type: "reflection", fromBook: false },
  { id: 230, text: "Você está rodeado de pessoas que o levantam ou o pesam?", type: "reflection", fromBook: false },
  { id: 231, text: "A verdade é mais bonita quando te liberta.", type: "reflection", fromBook: false },
  { id: 232, text: "Você sabe qual é sua maior fraqueza transformada em força?", type: "reflection", fromBook: false },
  { id: 233, text: "A vida é a pergunta e você é a resposta.", type: "reflection", fromBook: false },
  { id: 234, text: "Você está vivendo em harmonia com seus valores?", type: "reflection", fromBook: false },
  { id: 235, text: "O que você defende quando está sozinho define quem você é.", type: "reflection", fromBook: false },
  { id: 236, text: "Você merece estar ao lado de pessoas que conhecem seu valor.", type: "reflection", fromBook: false },
  { id: 237, text: "A verdade cura, mesmo quando dói inicialmente.", type: "reflection", fromBook: false },
  { id: 238, text: "Você está vivendo de forma corajosa ou de forma segura?", type: "reflection", fromBook: false },
  { id: 239, text: "O amor é a única moeda que vale em qualquer economia.", type: "reflection", fromBook: false },
  { id: 240, text: "Você sabe quando sua ferida se tornou sua sabedoria?", type: "reflection", fromBook: false },
  { id: 241, text: "A vida é encontrada na aceitação do que não pode mudar.", type: "reflection", fromBook: false },
  { id: 242, text: "Você está criando ou apenas consumindo?", type: "reflection", fromBook: false },
  { id: 243, text: "O que você cultiva em privado floresce em público.", type: "reflection", fromBook: false },
  { id: 244, text: "Você merece estar ao lado de quem nunca desiste de você.", type: "reflection", fromBook: false },
  { id: 245, text: "A verdade é o único caminho para a paz interior.", type: "reflection", fromBook: false },
  { id: 246, text: "Você está vivendo sua melhor versão ou sua versão segura?", type: "reflection", fromBook: false },
  { id: 247, text: "O medo é apenas o chamado da vida para você despertar.", type: "reflection", fromBook: false },
  { id: 248, text: "Você sabe qual é a diferença entre estar cansado e estar esgotado?", type: "reflection", fromBook: false },
  { id: 249, text: "A vida é a aventura que você estava esperando viver.", type: "reflection", fromBook: false },
  { id: 250, text: "Você está alimentando sua alma ou sufocando?", type: "reflection", fromBook: false },

  // Tips (150+)
  { id: 301, text: "Comece seu dia com 5 minutos de respiração consciente.", type: "tip" },
  { id: 302, text: "Escreva 3 coisas que aprecia de si mesmo antes de dormir.", type: "tip" },
  { id: 303, text: "Tire 1 hora longe de telas todos os dias.", type: "tip" },
  { id: 304, text: "Quando sentir ansiedade, diga seu nome 3 vezes e respire.", type: "tip" },
  { id: 305, text: "Converse com alguém de confiança sobre seus sentimentos.", type: "tip" },
  { id: 306, text: "Caminhe pela natureza quando sentir preso.", type: "tip" },
  { id: 307, text: "Mantenha um diário onde escreve sem julgar.", type: "tip" },
  { id: 308, text: "Pratique dizer 'não' sem explicações.", type: "tip" },
  { id: 309, text: "Faça uma coisa que o assusta um pouco cada semana.", type: "tip" },
  { id: 310, text: "Ouça música que faz seu corpo dançar.", type: "tip" },
  { id: 311, text: "Reserve tempo para fazer absolutamente nada.", type: "tip" },
  { id: 312, text: "Aprenda a dizer 'me sinto melhor sozinho agora'.", type: "tip" },
  { id: 313, text: "Crie uma playlist que representa seu estado emocional.", type: "tip" },
  { id: 314, text: "Escreva uma carta para seu eu do futuro.", type: "tip" },
  { id: 315, text: "Medite mesmo que seja apenas 2 minutos.", type: "tip" },
  { id: 316, text: "Telefone para alguém em vez de enviar mensagem.", type: "tip" },
  { id: 317, text: "Durma mais. Seu corpo precisa disso.", type: "tip" },
  { id: 318, text: "Faça algo pequeno todo dia que é só para você.", type: "tip" },
  { id: 319, text: "Aprenda a identificar o que realmente quer versus expectativas.", type: "tip" },
  { id: 320, text: "Estabeleça limites claros sem se sentir egoísta.", type: "tip" },
  { id: 321, text: "Escute seu corpo quando diz que precisa desacelerar.", type: "tip" },
  { id: 322, text: "Pratique gratidão por uma coisa pequena todo dia.", type: "tip" },
  { id: 323, text: "Procure ajuda profissional se ansiedade é avassaladora.", type: "tip" },
  { id: 324, text: "Crie um espaço só seu onde se sinta seguro.", type: "tip" },
  { id: 325, text: "Tire foto de coisas que te fazem feliz.", type: "tip" },
  { id: 326, text: "Leia poesia que ressoa com sua alma.", type: "tip" },
  { id: 327, text: "Dance como se ninguém estivesse olhando.", type: "tip" },
  { id: 328, text: "Fale a verdade mesmo quando custa.", type: "tip" },
  { id: 329, text: "Perdoe seu corpo pelos erros e abusos.", type: "tip" },
  { id: 330, text: "Desenvolva uma rotina que faz você se sentir cuidado.", type: "tip" },
  { id: 331, text: "Toque na água fria quando se sentir desconectado.", type: "tip" },
  { id: 332, text: "Crie um ritual de manhã que te centraliza.", type: "tip" },
  { id: 333, text: "Fale com seu corpo como fala com um amigo.", type: "tip" },
  { id: 334, text: "Observ e a respiração sem a controlar.", type: "tip" },
  { id: 335, text: "Coma alimentos que alimentam sua alma, não apenas seu corpo.", type: "tip" },
  { id: 336, text: "Mude sua postura quando se sentir deprimido.", type: "tip" },
  { id: 337, text: "Crie uma lista de motivos pelos quais vale a pena viver.", type: "tip" },
  { id: 338, text: "Converse com pessoas diferentes de você.", type: "tip" },
  { id: 339, text: "Pratique a empatia mesmo que seja difícil.", type: "tip" },
  { id: 340, text: "Encontre uma comunidade que compartilha seus valores.", type: "tip" },
  { id: 341, text: "Passe tempo com crianças ou animais regularmente.", type: "tip" },
  { id: 342, text: "Crie algo com suas mãos, não importa o resultado.", type: "tip" },
  { id: 343, text: "Leia sobre pessoas que admira.", type: "tip" },
  { id: 344, text: "Escute mais do que fala em conversas importantes.", type: "tip" },
  { id: 345, text: "Assista ao pôr do sol conscientemente uma vez por semana.", type: "tip" },
  { id: 346, text: "Escreva cartas que nunca vai enviar.", type: "tip" },
  { id: 347, text: "Faça algo gentil anonimamente.", type: "tip" },
  { id: 348, text: "Tome um banho quente e mude sua perspectiva.", type: "tip" },
  { id: 349, text: "Celebre pequenas vitórias como se fossem grandes.", type: "tip" },
  { id: 350, text: "Crie espaço em sua vida para surpresas agradáveis.", type: "tip" },
  { id: 351, text: "Aprenda a técnica de respiração 4-7-8 para ansiedade.", type: "tip" },
  { id: 352, text: "Observe nuvens e deixe sua mente vagar.", type: "tip" },
  { id: 353, text: "Faça uma lista de pessoas que você ama e por quê.", type: "tip" },
  { id: 354, text: "Crie um espaço para coisas que o trazem alegria.", type: "tip" },
  { id: 355, text: "Pratique aceitação ao invés de julgamento.", type: "tip" },
  { id: 356, text: "Comece um novo hobby sem expectativas.", type: "tip" },
  { id: 357, text: "Fale gentilezas em voz alta para você.", type: "tip" },
  { id: 358, text: "Crie uma canção que represente sua resistência.", type: "tip" },
  { id: 359, text: "Assista a documentários que ampliam sua visão.", type: "tip" },
  { id: 360, text: "Pratique yoga ou alongamentos suaves.", type: "tip" },
  { id: 361, text: "Mantenha uma planta e cuide dela.", type: "tip" },
  { id: 362, text: "Escreva as coisas que você quer deixar para trás.", type: "tip" },
  { id: 363, text: "Crie uma cápsula do tempo com seus sentimentos atuais.", type: "tip" },
  { id: 364, text: "Faça uma lista de seus superpoderes.", type: "tip" },
  { id: 365, text: "Desenhe ou pinte seus emoções.", type: "tip" },
  { id: 366, text: "Crie um espaço onde você se sente realmente você.", type: "tip" },
  { id: 367, text: "Pratique a gratidão radical por coisas negadas.", type: "tip" },
  { id: 368, text: "Escute seus pulmões respirando.", type: "tip" },
  { id: 369, text: "Faça perguntas ao invés de dar respostas.", type: "tip" },
  { id: 370, text: "Crie um ritual de despedida para o que o feriu.", type: "tip" },
  { id: 371, text: "Aprenda a dizer 'estou cansado' sem explicar por quê.", type: "tip" },
  { id: 372, text: "Coma com atenção plena, provando cada bocado.", type: "tip" },
  { id: 373, text: "Mantenha um diário de sonhos.", type: "tip" },
  { id: 374, text: "Crie uma lista de pessoas que você perdoou.", type: "tip" },
  { id: 375, text: "Observe como você trata as pessoas quando ninguém vê.", type: "tip" },
  { id: 376, text: "Faça uma meditação guiada quando estiver perdido.", type: "tip" },
  { id: 377, text: "Crie um mantra pessoal para dias difíceis.", type: "tip" },
  { id: 378, text: "Observe a natureza sem tentar entender.", type: "tip" },
  { id: 379, text: "Escreva uma carta de perdão para si mesmo.", type: "tip" },
  { id: 380, text: "Crie um playlist de canções que curam.", type: "tip" },
  { id: 381, text: "Pratique a escuta ativa com alguém de confiança.", type: "tip" },
  { id: 382, text: "Faça uma lista de coisas que o assustam e confronte uma.", type: "tip" },
  { id: 383, text: "Crie um espaço sagrado em sua casa.", type: "tip" },
  { id: 384, text: "Aprenda o nome de uma pessoa que conhece superficialmente.", type: "tip" },
  { id: 385, text: "Faça um banho de sal que represente a cura.", type: "tip" },
  { id: 386, text: "Crie uma lista de pessoas que o inspiram.", type: "tip" },
  { id: 387, text: "Observe o padrão de suas reações e entenda.", type: "tip" },
  { id: 388, text: "Pratique a compaixão pelo seu 'eu' de 10 anos atrás.", type: "tip" },
  { id: 389, text: "Crie um ritual de aceitação para sua vida atual.", type: "tip" },
  { id: 390, text: "Faça uma lista de coisas que custam caro e resista.", type: "tip" },
  { id: 391, text: "Observe a beleza em coisas aparentemente feias.", type: "tip" },
  { id: 392, text: "Crie um quadro de visão para quem quer ser.", type: "tip" },
  { id: 393, text: "Aprenda a verdadeira diferença entre cuidado e controle.", type: "tip" },
  { id: 394, text: "Faça uma lista de seus maiores arrependimentos e liberte.", type: "tip" },
  { id: 395, text: "Crie uma letra de cura para si mesmo.", type: "tip" },
  { id: 396, text: "Observe seus hábitos sem julgamento.", type: "tip" },
  { id: 397, text: "Pratique o silêncio consciente durante 10 minutos.", type: "tip" },
  { id: 398, text: "Crie uma lista de pessoas que o prejudicaram e perdoe.", type: "tip" },
  { id: 399, text: "Faça uma lista de coisas que você gostaria que dissessem.", type: "tip" },
  { id: 400, text: "Crie um ritual de celebração para cada dia que sobrevive.", type: "tip" },

  // Reminders (350+)
  { id: 451, text: "Lembre-se: você já sobreviveu a 100% dos seus piores dias.", type: "reminder" },
  { id: 452, text: "Lembre-se: o que os outros pensam é problema deles.", type: "reminder" },
  { id: 453, text: "Lembre-se: seus sentimentos são válidos, todos eles.", type: "reminder" },
  { id: 454, text: "Lembre-se: você é mais forte que qualquer coisa enfrentou.", type: "reminder" },
  { id: 455, text: "Lembre-se: está tudo bem não saber todas as respostas.", type: "reminder" },
  { id: 456, text: "Lembre-se: cada cicatriz conta uma história de sobrevivência.", type: "reminder" },
  { id: 457, text: "Lembre-se: você não é menos por ter dificuldades.", type: "reminder" },
  { id: 458, text: "Lembre-se: sua vida importa e faz diferença.", type: "reminder" },
  { id: 459, text: "Lembre-se: dizer 'não' é ato de amor próprio.", type: "reminder" },
  { id: 460, text: "Lembre-se: mudança não precisa ser rápida para ser real.", type: "reminder" },
  { id: 461, text: "Lembre-se: você merece as mesmas chances que dá aos outros.", type: "reminder" },
  { id: 462, text: "Lembre-se: está tudo bem pedir ajuda.", type: "reminder" },
  { id: 463, text: "Lembre-se: seus 'fracassos' preparam para sucesso.", type: "reminder" },
  { id: 464, text: "Lembre-se: você não é definido por seu passado.", type: "reminder" },
  { id: 465, text: "Lembre-se: ser gentil consigo é revolucionário.", type: "reminder" },
  { id: 466, text: "Lembre-se: você está fazendo muito melhor do que pensa.", type: "reminder" },
  { id: 467, text: "Lembre-se: sua sanidade mental é prioridade.", type: "reminder" },
  { id: 468, text: "Lembre-se: estar sozinho não é rejeição.", type: "reminder" },
  { id: 469, text: "Lembre-se: você merece amor do seu próprio coração.", type: "reminder" },
  { id: 470, text: "Lembre-se: pequenos passos são progresso.", type: "reminder" },
  { id: 471, text: "Lembre-se: você está crescendo mesmo duvidando.", type: "reminder" },
  { id: 472, text: "Lembre-se: sua presença é suficiente.", type: "reminder" },
  { id: 473, text: "Lembre-se: é ok mudar de ideia.", type: "reminder" },
  { id: 474, text: "Lembre-se: você é merecedor de boas coisas.", type: "reminder" },
  { id: 475, text: "Lembre-se: desculpe-se, mas não leve culpa que não é sua.", type: "reminder" },
  { id: 476, text: "Lembre-se: você é suficiente exatamente como é.", type: "reminder" },
  { id: 477, text: "Lembre-se: este momento difícil também vai passar.", type: "reminder" },
  { id: 478, text: "Lembre-se: você não precisa ganhar amor - merece já.", type: "reminder" },
  { id: 479, text: "Lembre-se: sua história ainda está sendo escrita.", type: "reminder" },
  { id: 480, text: "Lembre-se: você é amado exatamente como é.", type: "reminder" },
  { id: 481, text: "Lembre-se: o medo é apenas um sentimento, não um fato.", type: "reminder" },
  { id: 482, text: "Lembre-se: você é mais resiliente que parece.", type: "reminder" },
  { id: 483, text: "Lembre-se: dizer verdade é sempre mais importante.", type: "reminder" },
  { id: 484, text: "Lembre-se: você não precisa ser tudo para ninguém.", type: "reminder" },
  { id: 485, text: "Lembre-se: seu passado não define seu futuro.", type: "reminder" },
  { id: 486, text: "Lembre-se: você é merecedor de descanso.", type: "reminder" },
  { id: 487, text: "Lembre-se: silêncio suas vezes é sua resposta mais forte.", type: "reminder" },
  { id: 488, text: "Lembre-se: você está permitido falhar e tentar novamente.", type: "reminder" },
  { id: 489, text: "Lembre-se: ninguém merece seu tempo se drena sua energia.", type: "reminder" },
  { id: 490, text: "Lembre-se: você tem o direito de mudar de opinião.", type: "reminder" },
  { id: 491, text: "Lembre-se: sua voz importa, mesmo se ninguém ouve.", type: "reminder" },
  { id: 492, text: "Lembre-se: você é autorizado a priorizar a si mesmo.", type: "reminder" },
  { id: 493, text: "Lembre-se: o amor próprio não é egoísmo.", type: "reminder" },
  { id: 494, text: "Lembre-se: você está fazendo o melhor que pode agora.", type: "reminder" },
  { id: 495, text: "Lembre-se: é ok estar incompleto.", type: "reminder" },
  { id: 496, text: "Lembre-se: você é mais do que seus pensamentos.", type: "reminder" },
  { id: 497, text: "Lembre-se: repouso é parte do progresso.", type: "reminder" },
  { id: 498, text: "Lembre-se: você é permitido mudar.", type: "reminder" },
  { id: 499, text: "Lembre-se: sua ferida não define seu futuro.", type: "reminder" },
  { id: 500, text: "Lembre-se: você é merecedor de alegria.", type: "reminder" },
  { id: 501, text: "Lembre-se: estar com você é suficiente.", type: "reminder" },
  { id: 502, text: "Lembre-se: você pode respirar através do medo.", type: "reminder" },
  { id: 503, text: "Lembre-se: seu valor não é baseado em produtividade.", type: "reminder" },
  { id: 504, text: "Lembre-se: você é permitido sonhar grande.", type: "reminder" },
  { id: 505, text: "Lembre-se: a vida continua porque você continua.", type: "reminder" },
  { id: 506, text: "Lembre-se: você está fazendo tudo certo.", type: "reminder" },
  { id: 507, text: "Lembre-se: sua presença cura.", type: "reminder" },
  { id: 508, text: "Lembre-se: você é merecedor de paz.", type: "reminder" },
  { id: 509, text: "Lembre-se: está tudo bem ser vulnerável.", type: "reminder" },
  { id: 510, text: "Lembre-se: você é mais bonito que acredita.", type: "reminder" },
  { id: 511, text: "Lembre-se: sua história importa.", type: "reminder" },
  { id: 512, text: "Lembre-se: o medo é sinal de coragem.", type: "reminder" },
  { id: 513, text: "Lembre-se: você é permitido ser difícil às vezes.", type: "reminder" },
  { id: 514, text: "Lembre-se: seu corpo o amar é revolucionário.", type: "reminder" },
  { id: 515, text: "Lembre-se: você merece estar ao redor de quem te escolhe.", type: "reminder" },
  { id: 516, text: "Lembre-se: está tudo bem chorar.", type: "reminder" },
  { id: 517, text: "Lembre-se: você é autorizado a se colocar em primeiro.", type: "reminder" },
  { id: 518, text: "Lembre-se: seu passado não é seu futuro.", type: "reminder" },
  { id: 519, text: "Lembre-se: você é merecedor de gentileza.", type: "reminder" },
  { id: 520, text: "Lembre-se: está tudo bem dizer 'ainda não sei'.", type: "reminder" },
  { id: 521, text: "Lembre-se: você está permitido estar confuso.", type: "reminder" },
  { id: 522, text: "Lembre-se: sua voz é importante.", type: "reminder" },
  { id: 523, text: "Lembre-se: o mundo precisa de você como você é.", type: "reminder" },
  { id: 524, text: "Lembre-se: está tudo bem estar perdido.", type: "reminder" },
  { id: 525, text: "Lembre-se: você é merecedor de pertença.", type: "reminder" },
  { id: 526, text: "Lembre-se: sua existência é suficiente.", type: "reminder" },
  { id: 527, text: "Lembre-se: você é autorizado a falhar bonito.", type: "reminder" },
  { id: 528, text: "Lembre-se: o silêncio às vezes é a melhor resposta.", type: "reminder" },
  { id: 529, text: "Lembre-se: você está merecedor de verdade.", type: "reminder" },
  { id: 530, text: "Lembre-se: está tudo bem estar sozinho.", type: "reminder" },
  { id: 531, text: "Lembre-se: você é mais corajoso que acredita.", type: "reminder" },
  { id: 532, text: "Lembre-se: sua paz é prioridade.", type: "reminder" },
  { id: 533, text: "Lembre-se: você é autorizado a cuidar de si.", type: "reminder" },
  { id: 534, text: "Lembre-se: está tudo bem dizer 'não'.", type: "reminder" },
  { id: 535, text: "Lembre-se: você é merecedor de graça.", type: "reminder" },
  { id: 536, text: "Lembre-se: sua autenticidade é seu poder.", type: "reminder" },
  { id: 537, text: "Lembre-se: você está permitido descansar.", type: "reminder" },
  { id: 538, text: "Lembre-se: o que passou foi lição, não derrota.", type: "reminder" },
  { id: 539, text: "Lembre-se: você é merecedor de respeito.", type: "reminder" },
  { id: 540, text: "Lembre-se: está tudo bem estar inseguro às vezes.", type: "reminder" },
  { id: 541, text: "Lembre-se: você é autorizado a ser diferente.", type: "reminder" },
  { id: 542, text: "Lembre-se: sua história é sagrada.", type: "reminder" },
  { id: 543, text: "Lembre-se: você é merecedor de amor real.", type: "reminder" },
  { id: 544, text: "Lembre-se: está tudo bem crescer em seu próprio ritmo.", type: "reminder" },
  { id: 545, text: "Lembre-se: você é autorizado a brilhar.", type: "reminder" },
  { id: 546, text: "Lembre-se: o medo não é o final da história.", type: "reminder" },
  { id: 547, text: "Lembre-se: você é merecedor de poder.", type: "reminder" },
  { id: 548, text: "Lembre-se: sua mente está protegida por você.", type: "reminder" },
  { id: 549, text: "Lembre-se: está tudo bem estar em transição.", type: "reminder" },
  { id: 550, text: "Lembre-se: você é autorizado a existir plenamente.", type: "reminder" },
  { id: 551, text: "Lembre-se: sua vida é sua responsabilidade bonita.", type: "reminder" },
  { id: 552, text: "Lembre-se: você é merecedor de clareza.", type: "reminder" },
  { id: 553, text: "Lembre-se: está tudo bem estar inteiro.", type: "reminder" },
  { id: 554, text: "Lembre-se: você é autorizado a sonhar.", type: "reminder" },
  { id: 555, text: "Lembre-se: o que você semeia você colhe.", type: "reminder" },
  { id: 556, text: "Lembre-se: você é merecedor de encontro.", type: "reminder" },
  { id: 557, text: "Lembre-se: sua presença importa profundamente.", type: "reminder" },
  { id: 558, text: "Lembre-se: está tudo bem estar vivo.", type: "reminder" },
  { id: 559, text: "Lembre-se: você é autorizado a ser feliz.", type: "reminder" },
  { id: 560, text: "Lembre-se: todo dia é chance de começar de novo.", type: "reminder" },
  { id: 561, text: "Lembre-se: você é sempre bem-vindo em seu próprio coração.", type: "reminder" },
  { id: 562, text: "Lembre-se: sua cura está em aceitação.", type: "reminder" },
  { id: 563, text: "Lembre-se: está tudo bem estar em movimento.", type: "reminder" },
  { id: 564, text: "Lembre-se: você é merecedor de verdadeiro amor.", type: "reminder" },
  { id: 565, text: "Lembre-se: sua voz é medicina para alguém.", type: "reminder" },
  { id: 566, text: "Lembre-se: você é autorizado a ser humano.", type: "reminder" },
  { id: 567, text: "Lembre-se: tudo que precisa está dentro de você.", type: "reminder" },
  { id: 568, text: "Lembre-se: você é merecedor de generosidade.", type: "reminder" },
  { id: 569, text: "Lembre-se: está tudo bem estar aqui agora.", type: "reminder" },
  { id: 570, text: "Lembre-se: você é autorizado a se amar completamente.", type: "reminder" },
  { id: 571, text: "Lembre-se: sua luta é sua força.", type: "reminder" },
  { id: 572, text: "Lembre-se: você é merecedor de esperança.", type: "reminder" },
  { id: 573, text: "Lembre-se: está tudo bem estar inteiro novamente.", type: "reminder" },
  { id: 574, text: "Lembre-se: você é autorizado a brilhar sempre.", type: "reminder" },
  { id: 575, text: "Lembre-se: sua existência é graça pura.", type: "reminder" },
  { id: 576, text: "Lembre-se: você é merecedor de milagre.", type: "reminder" },
  { id: 577, text: "Lembre-se: está tudo bem estar completo em si.", type: "reminder" },
  { id: 578, text: "Lembre-se: você é autorizado a vencer.", type: "reminder" },
  { id: 579, text: "Lembre-se: tudo que passa deixa marca de cura.", type: "reminder" },
  { id: 580, text: "Lembre-se: você é merecedor de eternidade.", type: "reminder" },
  { id: 581, text: "Lembre-se: está tudo bem estar finalmente em paz.", type: "reminder" },
  { id: 582, text: "Lembre-se: você é autorizado a ser lendário.", type: "reminder" },
  { id: 583, text: "Lembre-se: sua alma merece descanso sagrado.", type: "reminder" },
  { id: 584, text: "Lembre-se: você é merecedor de tudo o que pede.", type: "reminder" },
  { id: 585, text: "Lembre-se: está tudo bem estar finalmente livre.", type: "reminder" },
  { id: 586, text: "Lembre-se: você é autorizado a ser sua melhor vida.", type: "reminder" },
  { id: 587, text: "Lembre-se: o amor que você dá volta multiplicado.", type: "reminder" },
  { id: 588, text: "Lembre-se: você é merecedor de finais felizes.", type: "reminder" },
  { id: 589, text: "Lembre-se: está tudo bem estar finalizado agora.", type: "reminder" },
  { id: 590, text: "Lembre-se: você é a resposta que estava procurando.", type: "reminder" },
  { id: 591, text: "Lembre-se: sua presença é uma bênção.", type: "reminder" },
  { id: 592, text: "Lembre-se: você é merecedor de para sempre.", type: "reminder" },
  { id: 593, text: "Lembre-se: está tudo bem estar completamente você.", type: "reminder" },
  { id: 594, text: "Lembre-se: você é autorizado a brilhar eternamente.", type: "reminder" },
  { id: 595, text: "Lembre-se: tudo é possível se você acredita.", type: "reminder" },
  { id: 596, text: "Lembre-se: você é merecedor de tudo sempre.", type: "reminder" },
  { id: 597, text: "Lembre-se: está tudo bem estar em casa agora.", type: "reminder" },
  { id: 598, text: "Lembre-se: você é o milagre que estava esperando.", type: "reminder" },
  { id: 599, text: "Lembre-se: sua vida é um presente perfeito.", type: "reminder" },
  { id: 600, text: "Lembre-se: você é autorizado a ser sua própria vida.", type: "reminder" },
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

import authorImg from "../assets/author.webp";

export default function Book() {
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-700">
      <div className="px-6 md:px-10 pt-12 pb-24">
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
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-background shadow-md">
             <img src={authorImg} alt="Quinzinho Oliveira" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
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

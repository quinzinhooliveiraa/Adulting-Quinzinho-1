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
  { id: 41, text: "Qual memória da sua infância ainda te define hoje?", fromBook: false },
  { id: 42, text: "Se pudesse dar um conselho ao seu 'eu' de 20 anos, qual seria?", fromBook: false },
  { id: 43, text: "O que você valoriza mais: ser amado ou ser compreendido?", fromBook: false },
  { id: 44, text: "Qual é a crença sobre si mesmo que você gostaria de deixar para trás?", fromBook: false },
  { id: 45, text: "Quando você se sente mais vivo?", fromBook: false },
  { id: 46, text: "O que faria diferente se não tivesse medo das consequências?", fromBook: false },
  { id: 47, text: "Qual é a sua maior força, segundo você?", fromBook: false },
  { id: 48, text: "Como você saberia que finalmente se ama a si mesmo?", fromBook: false },
  { id: 49, text: "O que significa vulnerabilidade para você?", fromBook: false },
  { id: 50, text: "Qual é a lição de vida mais importante que você aprendeu?", fromBook: false },
  { id: 51, text: "A aceitação é o começo de toda transformação. Você se aceita?", fromBook: true },
  { id: 52, text: "Crescer é deixar morrer quem você era para se tornar quem você pode ser.", fromBook: true },
  { id: 53, text: "A felicidade não é um destino, é a forma como você caminha todos os dias.", fromBook: true },
  { id: 54, text: "Sua vida não precisa fazer sentido para ninguém, apenas para você.", fromBook: true },
  { id: 55, text: "O medo é apenas um convite para você descobrir sua coragem.", fromBook: true },
  { id: 56, text: "Você merece dedicar tanta atenção a si mesmo quanto dedica aos outros.", fromBook: true },
  { id: 57, text: "Não se compare com o palco dos outros. Sua jornada tem seu próprio ritmo.", fromBook: true },
  { id: 58, text: "A pessoa que você está se tornando é mais importante que a que você costumava ser.", fromBook: true },
  { id: 59, text: "Estar sozinho não é estar desamparado. É um momento de recarregar.", fromBook: true },
  { id: 60, text: "Sua própria companhia é preciosa. Cultive o amor por quem você é no silêncio.", fromBook: true },
  { id: 61, text: "Se alguém realmente quer estar na sua vida, nenhuma distância será grande demais.", fromBook: false },
  { id: 62, text: "Como você mudaria se soubesse que ninguém julgaria suas escolhas?", fromBook: false },
  { id: 63, text: "Qual é a primeira coisa que você faria para cuidar melhor de si mesmo?", fromBook: false },
  { id: 64, text: "O que você está ignorando que sabe que é importante?", fromBook: false },
  { id: 65, text: "Qual é a verdade sobre você que você tem medo de dizer em voz alta?", fromBook: false },
  { id: 66, text: "Se você pudesse mudar uma coisa sobre seu passado, mudaria?", fromBook: false },
  { id: 67, text: "O que significa ser 'suficiente' para você?", fromBook: false },
  { id: 68, text: "Qual é a última vez que você sorriu de verdade?", fromBook: false },
  { id: 69, text: "O que você faria se fracassasse e ninguém soubesse?", fromBook: false },
  { id: 70, text: "Como você saberia que está no caminho certo?", fromBook: false },
  { id: 71, text: "Você está vivendo ou apenas existindo?", fromBook: false },
  { id: 72, text: "Qual é a coisa mais importante que alguém nunca te disse?", fromBook: false },
  { id: 73, text: "Se o tempo parasse, em qual momento você gostaria de ficar?", fromBook: false },
  { id: 74, text: "O que você ganha ao manter pessoas à distância?", fromBook: false },
  { id: 75, text: "Qual é a história que você conta sobre si mesmo que não é totalmente verdadeira?", fromBook: false },
  { id: 76, text: "Seu coração quer algo que sua mente teme?", fromBook: false },
  { id: 77, text: "O que significaria realmente se libertar?", fromBook: false },
  { id: 78, text: "Qual é o presente que você gostaria de dar a si mesmo?", fromBook: false },
  { id: 79, text: "Como você se trata quando comete um erro?", fromBook: false },
  { id: 80, text: "O que você descobriu sobre si mesmo este ano?", fromBook: false },
  { id: 81, text: "A vida é feita de momentos pequenos. Qual é o seu favorito?", fromBook: false },
  { id: 82, text: "Se sua vida fosse uma música, qual seria a melodia?", fromBook: false },
  { id: 83, text: "O que você levaria se tivesse que deixar sua vida atual?", fromBook: false },
  { id: 84, text: "Qual é a pessoa que você foi que você sente falta?", fromBook: false },
  { id: 85, text: "Se pudesse conversar com seu 'eu' do futuro, o que perguntaria?", fromBook: false },
  { id: 86, text: "O que você faz que te faz esquecer do tempo?", fromBook: false },
  { id: 87, text: "Qual é o peso que você carrega que não é seu para carregar?", fromBook: false },
  { id: 88, text: "Como você gostaria que as pessoas se sentissem perto de você?", fromBook: false },
  { id: 89, text: "O que você precisa escutar de si mesmo?", fromBook: false },
  { id: 90, text: "Qual é a aventura que você ainda sonha em viver?", fromBook: false },
  { id: 91, text: "Não importa o que a vida traz, você será resiliente porque já sobreviveu a tudo até agora.", fromBook: true },
  { id: 92, text: "Pequenas ações alinhadas com seus valores valem mais do que grandes metas vazias.", fromBook: true },
  { id: 93, text: "Confie no processo. Suas buscas estão te levando exatamente onde você precisa estar.", fromBook: true },
  { id: 94, text: "Crescer dói, mas estagnar dói muito mais. Orgulhe-se de quão longe você chegou.", fromBook: true },
  { id: 95, text: "Cada desafio superado é um degrau na construção da sua melhor versão.", fromBook: true },
  { id: 96, text: "O amadurecimento é um processo lento. Seja gentil com o seu tempo.", fromBook: true },
  { id: 97, text: "Respire. O futuro ainda não chegou e você não precisa resolver tudo hoje.", fromBook: true },
  { id: 98, text: "Sua ansiedade é um sinal de que você se importa, mas ela não é uma previsão.", fromBook: true },
  { id: 99, text: "Está tudo bem não estar bem o tempo todo. Acolha seu sentir.", fromBook: true },
  { id: 100, text: "Você é muito mais do que suas conquistas ou seu cargo. Sua essência é única.", fromBook: true },
  { id: 101, text: "A solitude é o encontro consigo mesmo. Aproveite esse espaço.", fromBook: true },
  { id: 102, text: "O propósito não é um destino, é a forma como você caminha todos os dias.", fromBook: true },
  { id: 103, text: "Qual é o som que mais te acalma?", fromBook: false },
  { id: 104, text: "Você permitiria que alguém fosse o que você é?", fromBook: false },
  { id: 105, text: "O que você pensaria se não tivesse voz interna crítica?", fromBook: false },
  { id: 106, text: "Qual é a coisa mais bonita que você já viu em outra pessoa?", fromBook: false },
  { id: 107, text: "Se você pudesse esquecer algo, o que seria?", fromBook: false },
  { id: 108, text: "Como você quer que as pessoas se lembrem de você?", fromBook: false },
  { id: 109, text: "Qual é a parte de você que ninguém vê?", fromBook: false },
  { id: 110, text: "O que você diria a si mesmo nos momentos difíceis?", fromBook: false },
  { id: 111, text: "Se houvesse uma segunda chance, você a tomaria?", fromBook: false },
  { id: 112, text: "Qual é a verdade mais doce que você conhece?", fromBook: false },
  { id: 113, text: "Você está no lugar onde quer estar?", fromBook: false },
  { id: 114, text: "O que significa ser home para você?", fromBook: false },
  { id: 115, text: "Qual é a coisa que você menos espera que alguém descubra sobre você?", fromBook: false },
  { id: 116, text: "Se o medo não existisse, quem você seria?", fromBook: false },
  { id: 117, text: "O que você está guardando para 'depois'?", fromBook: false },
  { id: 118, text: "Qual é o maior amor da sua vida?", fromBook: false },
  { id: 119, text: "Como você escolhe entre o que quer e o que precisa?", fromBook: false },
  { id: 120, text: "O que você deixou de lado que deveria retomar?", fromBook: false },
  { id: 121, text: "Você consegue identificar quando está apenas fingindo estar bem?", fromBook: false },
  { id: 122, text: "Qual é a primeira imagem que vem à mente quando pensa em 'lar'?", fromBook: false },
  { id: 123, text: "O que você gostaria de dizer a alguém, mas tem medo?", fromBook: false },
  { id: 124, text: "Se pudesse voltar, onde você gostaria de retornar?", fromBook: false },
  { id: 125, text: "Qual é a sua verdade não dita?", fromBook: false },
  { id: 126, text: "Como você se tornaria a pessoa que você quer ser?", fromBook: false },
  { id: 127, text: "O que você cria quando está feliz?", fromBook: false },
  { id: 128, text: "Qual é o legado que você quer deixar?", fromBook: false },
  { id: 129, text: "Você está em paz com suas escolhas?", fromBook: false },
  { id: 130, text: "O que significa sucesso em sua vida pessoal?", fromBook: false },
  { id: 131, text: "Qual é a primeira coisa que você pensa quando acorda?", fromBook: false },
  { id: 132, text: "Se você pudesse ser guiado pela compaixão em vez do medo?", fromBook: false },
  { id: 133, text: "O que você faria de forma diferente se soubesse que seria aceito?", fromBook: false },
  { id: 134, text: "Qual é a sensação de estar realmente em casa?", fromBook: false },
  { id: 135, text: "Como você cuida da sua alma?", fromBook: false },
  { id: 136, text: "A vida tem me ensinado que o tempo é meu bem mais precioso e devo respeitá-lo.", fromBook: true },
  { id: 137, text: "Ninguém pode viver a vida por você. A responsabilidade e a liberdade são suas.", fromBook: true },
  { id: 138, text: "Você não precisa ser perfeito para ser digno de amor e respeito.", fromBook: true },
  { id: 139, text: "As cicatrizes que você carrega são provas de sua força, não de sua fraqueza.", fromBook: true },
  { id: 140, text: "O que os outros pensam de você não define quem você é.", fromBook: true },
  { id: 141, text: "Sua jornada não precisa se parecer com a de ninguém para ser válida.", fromBook: true },
  { id: 142, text: "O silêncio nem sempre é paz, às vezes é o grito de quem perdeu a voz.", fromBook: true },
  { id: 143, text: "Você é permitido mudar. Você é permitido crescer. Você é permitido ser.", fromBook: true },
  { id: 144, text: "A beleza da vida está nos detalhes que você aprende a notar.", fromBook: true },
  { id: 145, text: "Você não está sozinho, mesmo quando se sente isolado.", fromBook: true },
  { id: 146, text: "Qual é o medo que mais vale a pena enfrentar?", fromBook: false },
  { id: 147, text: "Se você não pudesse fracassar, o que faria?", fromBook: false },
  { id: 148, text: "Qual é o conselho que ninguém pediu mas você sabe que precisa dar?", fromBook: false },
  { id: 149, text: "Como você descreve a cor do seu estado emocional agora?", fromBook: false },
  { id: 150, text: "O que você aprendeu que ninguém deveria ter que aprender sozinho?", fromBook: false },
  { id: 151, text: "Qual é a mensagem que sua alma está tentando enviar?", fromBook: false },
  { id: 152, text: "Se pudesse abraçar alguém do seu passado, quem seria?", fromBook: false },
  { id: 153, text: "O que significa estar verdadeiramente vivo para você?", fromBook: false },
  { id: 154, text: "Qual é o número que define você? (idade, anos, meses, dias com alguém, etc)", fromBook: false },
  { id: 155, text: "Como você gostaria de começar de novo?", fromBook: false },
  { id: 156, text: "Qual é a coisa mais importante que alguém já fez por você?", fromBook: false },
  { id: 157, text: "Se você tivesse três palavras para descrever seu ano, quais seriam?", fromBook: false },
  { id: 158, text: "O que você rejeita em si mesmo que deveria aceitar?", fromBook: false },
  { id: 159, text: "Qual é a conversa que você precisa ter?", fromBook: false },
  { id: 160, text: "Como você sabe quando está fora de sintonia consigo mesmo?", fromBook: false },
  { id: 161, text: "Se pudesse mudar o mundo com um único ato, qual seria?", fromBook: false },
  { id: 162, text: "Qual é a cicatriz mais bonita que você carrega?", fromBook: false },
  { id: 163, text: "O que você está permitindo que passe de você?", fromBook: false },
  { id: 164, text: "Qual é a parte de sua história que ainda não consegue contar?", fromBook: false },
  { id: 165, text: "Se a vida fosse uma página em branco, como você começaria?", fromBook: false },
  { id: 166, text: "O que você perdeu que gostaria de ter de volta?", fromBook: false },
  { id: 167, text: "Como você celebra seus pequenos sucessos?", fromBook: false },
  { id: 168, text: "Qual é a única coisa que você pediria para ser diferente?", fromBook: false },
  { id: 169, text: "Se você soubesse que está exatamente onde precisa estar?", fromBook: false },
  { id: 170, text: "O que você gostaria que seu corpo soubesse que você sente?", fromBook: false },
  { id: 171, text: "Transformar-se exige que você derrube as paredes que construiu ao longo dos anos.", fromBook: true },
  { id: 172, text: "A jornada é sempre mais importante que o destino.", fromBook: true },
  { id: 173, text: "Você não é responsável pelos sentimentos de outras pessoas, mas é responsável pelos seus.", fromBook: true },
  { id: 174, text: "A verdadeira liberdade começa quando você para de depender da aprovação alheia.", fromBook: true },
  { id: 175, text: "Você merece estar ao redor de pessoas que escolhem estar com você.", fromBook: true },
  { id: 176, text: "O tempo que você passa consigo mesmo é tão importante quanto o tempo com os outros.", fromBook: true },
  { id: 177, text: "Seu valor não diminui porque outros não conseguem enxergá-lo.", fromBook: true },
  { id: 178, text: "A vida nos oferece lições em forma de desafios, não de castigos.", fromBook: true },
  { id: 179, text: "Você está sempre a um passo de uma nova versão de si mesmo.", fromBook: true },
  { id: 180, text: "Ser autêntico é assustador, mas viver uma mentira é mais assustador ainda.", fromBook: true },
  { id: 181, text: "Qual é a atividade que te faz perder noção do tempo?", fromBook: false },
  { id: 182, text: "Se você pudesse dar um presente a si mesmo, qual seria?", fromBook: false },
  { id: 183, text: "Como você define 'suficiente' em sua vida?", fromBook: false },
  { id: 184, text: "Qual é a primeira vez que você sentiu que era um adulto?", fromBook: false },
  { id: 185, text: "O que você sabe agora que gostaria de saber aos 18?", fromBook: false },
  { id: 186, text: "Se pudesse conversar com seu 'eu' mais jovem, o que diria?", fromBook: false },
  { id: 187, text: "Qual é o seu refúgio quando as coisas ficam difíceis?", fromBook: false },
  { id: 188, text: "O que significa ser corajoso para você?", fromBook: false },
  { id: 189, text: "Como você reconheceria a paz em sua vida?", fromBook: false },
  { id: 190, text: "Qual é a melhor decisão que você já tomou?", fromBook: false },
  { id: 191, text: "Se não tivesse obrigações, como usaria seu tempo?", fromBook: false },
  { id: 192, text: "O que você gostaria que as pessoas compreendessem sobre você?", fromBook: false },
  { id: 193, text: "Qual é a contribuição que você quer deixar no mundo?", fromBook: false },
  { id: 194, text: "Como você saberia que está se amando adequadamente?", fromBook: false },
  { id: 195, text: "Se pudesse voltar e se aconselhar em um momento difícil?", fromBook: false },
  { id: 196, text: "O que significa liberdade para você?", fromBook: false },
  { id: 197, text: "Qual é o sonho que você parou de perseguir?", fromBook: false },
  { id: 198, text: "Como você gostaria de impactar a vida de alguém?", fromBook: false },
  { id: 199, text: "O que você faria se soubesse que seria bem-sucedido?", fromBook: false },
  { id: 200, text: "Qual é a verdade fundamental sobre você que nunca muda?", fromBook: false },
  { id: 201, text: "Você está com pressa para chegar a um lugar que talvez não exista.", fromBook: true },
  { id: 202, text: "Aprender a estar consigo mesmo sem se sentir vazio é uma das maiores lições da vida.", fromBook: true },
  { id: 203, text: "Você não pode controlar o que os outros pensam, mas pode controlar quem você é.", fromBook: true },
  { id: 204, text: "A vida não é sobre encontrar respostas, é sobre aprender a fazer paz com as perguntas.", fromBook: true },
  { id: 205, text: "Você é o único que pode dar permissão para ser feliz.", fromBook: true },
  { id: 206, text: "O que você acha que precisa ser feito foi criado por pessoas como você.", fromBook: true },
  { id: 207, text: "Sua história não é metade de uma história de amor, é uma história completa em si.", fromBook: true },
  { id: 208, text: "Você não é uma versão incompleta de ninguém.", fromBook: true },
  { id: 209, text: "As personas que você usa no dia a dia podem te afastar de quem você realmente é.", fromBook: true },
  { id: 210, text: "Estar bem é uma escolha que você faz todos os dias.", fromBook: true },
  { id: 211, text: "Qual é a coisa mais encorajadora que alguém já disse para você?", fromBook: false },
  { id: 212, text: "Se você pudesse desaprender algo, o que seria?", fromBook: false },
  { id: 213, text: "O que você deixa de fazer por medo do julgamento?", fromBook: false },
  { id: 214, text: "Qual é a forma mais bonita de amor que você já testemunhou?", fromBook: false },
  { id: 215, text: "Como você gostaria que a vida fosse diferente?", fromBook: false },
  { id: 216, text: "O que você aprecia em si mesmo que outras pessoas não veem?", fromBook: false },
  { id: 217, text: "Se pudesse ter uma conversa honesta com alguém, como seria?", fromBook: false },
  { id: 218, text: "Qual é a sua maior vulnerabilidade?", fromBook: false },
  { id: 219, text: "Como você descreveria sua relação com o silêncio?", fromBook: false },
  { id: 220, text: "O que você gostaria que o mundo soubesse sobre você?", fromBook: false },
  { id: 221, text: "Se você não tivesse medo, como seria seu dia?", fromBook: false },
  { id: 222, text: "Qual é a lição mais dura que você aprendeu?", fromBook: false },
  { id: 223, text: "Como você gostaria de ser tocado pelo mundo?", fromBook: false },
  { id: 224, text: "O que significa lealdade para você?", fromBook: false },
  { id: 225, text: "Se pudesse revistar um momento em seu passado, qual seria?", fromBook: false },
  { id: 226, text: "Qual é a pessoa que você quer ser no próximo ano?", fromBook: false },
  { id: 227, text: "Como você saberia que finalmente superou algo?", fromBook: false },
  { id: 228, text: "O que você entrega de si mesmo aos outros?", fromBook: false },
  { id: 229, text: "Qual é o lado de você que mais ama?", fromBook: false },
  { id: 230, text: "Se a vida fosse uma música, qual seria a próxima nota?", fromBook: false },
  { id: 231, text: "O mundo não precisa de mais uma versão do Instagram. Precisa de você, de verdade.", fromBook: true },
  { id: 232, text: "Você está investindo sua vida em coisas que realmente importam?", fromBook: true },
  { id: 233, text: "Às vezes, a pessoa que você precisa perdoar é você mesmo.", fromBook: true },
  { id: 234, text: "Você é um trabalho em progresso, e está bem estar incompleto.", fromBook: true },
  { id: 235, text: "O medo que você sente é proporcional ao tamanho do seu potencial.", fromBook: true },
  { id: 236, text: "Você merece oportunidades, não apenas o que sobra.", fromBook: true },
  { id: 237, text: "Sua história é um livro, não uma postagem de rede social.", fromBook: true },
  { id: 238, text: "Você não é uma carga. Sua presença é um presente.", fromBook: true },
  { id: 239, text: "A vida é muito mais do que trabalho, status e possessões.", fromBook: true },
  { id: 240, text: "Você tem permissão para mudar de ideia, de sonho, de direção.", fromBook: true },
  { id: 241, text: "Qual é a coisa mais importante que você pode fazer por sua saúde mental?", fromBook: false },
  { id: 242, text: "Se você pudesse voltar à inocência, gostaria?", fromBook: false },
  { id: 243, text: "Como você gostaria de ser surpreendido?", fromBook: false },
  { id: 244, text: "Qual é a verdade que você tem dificuldade em dizer?", fromBook: false },
  { id: 245, text: "O que você criaria se soubesse que não seria criticado?", fromBook: false },
  { id: 246, text: "Qual é a coisa mais gentil que você pode fazer por si mesmo hoje?", fromBook: false },
  { id: 247, text: "Se pudesse se despedir de uma pessoa que não consegue, quem seria?", fromBook: false },
  { id: 248, text: "Como você gostaria de ser conhecido?", fromBook: false },
  { id: 249, text: "O que você está evitando que sabe que precisa enfrentar?", fromBook: false },
  { id: 250, text: "Qual é a sua verdade não contada?", fromBook: false },
  { id: 251, text: "Se você pudesse escrever uma carta para si mesmo daqui um ano, o que diria?", fromBook: false },
  { id: 252, text: "Como você saberia que está vivendo uma vida significativa?", fromBook: false },
  { id: 253, text: "Qual é a coisa que você faria se tivesse certeza de sucesso?", fromBook: false },
  { id: 254, text: "O que significa estar em casa para você?", fromBook: false },
  { id: 255, text: "Como você descreveria seu espírito?", fromBook: false },
  { id: 256, text: "Se você pudesse mudar uma coisa sobre como cresce, qual seria?", fromBook: false },
  { id: 257, text: "Qual é a melhor surpresa que a vida já lhe deu?", fromBook: false },
  { id: 258, text: "Como você gostaria que as pessoas falassem sobre você?", fromBook: false },
  { id: 259, text: "O que você precisa deixar ir para ser feliz?", fromBook: false },
  { id: 260, text: "Se você pudesse ter uma conversa com alguém que admira, o que perguntaria?", fromBook: false },
  { id: 261, text: "Você está vivendo para os outros ou para si mesmo? Essa é a pergunta que realmente importa.", fromBook: true },
  { id: 262, text: "A vida é uma série de escolhas pequenas que criam a pessoa que você se torna.", fromBook: true },
  { id: 263, text: "Você merece estar ao redor de pessoas que elevam você, não diminuem.", fromBook: true },
  { id: 264, text: "O conforto é o inimigo do crescimento. Esteja confortável com o desconforto.", fromBook: true },
  { id: 265, text: "Você é capaz de muito mais do que acredita ser.", fromBook: true },
  { id: 266, text: "A morte coloca tudo em perspectiva. O que você faria se soubesse que morreria amanhã?", fromBook: true },
  { id: 267, text: "Você não precisa de permissão para ser você.", fromBook: true },
  { id: 268, text: "A vida não é uma corrida. Caminhe no seu próprio ritmo.", fromBook: true },
  { id: 269, text: "Você é mais resiliente do que pensa.", fromBook: true },
  { id: 270, text: "Tudo o que você deseja está do outro lado do medo.", fromBook: true },
  { id: 271, text: "Qual é a primeira coisa que você faria se ninguém pudesse julgá-lo?", fromBook: false },
  { id: 272, text: "O que você considera uma vida bem vivida?", fromBook: false },
  { id: 273, text: "Como você cuida do seu corpo?", fromBook: false },
  { id: 274, text: "Se pudesse dizer uma coisa verdadeira sem consequências?", fromBook: false },
  { id: 275, text: "Qual é a coisa que mais o faz se sentir vivo?", fromBook: false },
  { id: 276, text: "Como você gostaria de ser abraçado?", fromBook: false },
  { id: 277, text: "O que você diria a alguém que está onde você estava há um ano?", fromBook: false },
  { id: 278, text: "Qual é a cor da sua melancolia?", fromBook: false },
  { id: 279, text: "Se você pudesse curar algo em si mesmo, o que seria?", fromBook: false },
  { id: 280, text: "Como você sabe quando é hora de mudar?", fromBook: false },
  { id: 281, text: "Qual é o som do seu coração?", fromBook: false },
  { id: 282, text: "O que você deixaria para trás se pudesse começar de novo?", fromBook: false },
  { id: 283, text: "Como você descreveria seu próprio brilho?", fromBook: false },
  { id: 284, text: "Se pudesse bênção alguém, quem seria e por quê?", fromBook: false },
  { id: 285, text: "Qual é a primeira lembrança que define você?", fromBook: false },
  { id: 286, text: "O que você gostaria de aprender sobre si mesmo?", fromBook: false },
  { id: 287, text: "Como você gostaria que as pessoas se sentissem em sua presença?", fromBook: false },
  { id: 288, text: "Se você pudesse pedir um desejo, qual seria?", fromBook: false },
  { id: 289, text: "Qual é a razão real pela qual você se sente preso?", fromBook: false },
  { id: 290, text: "O que significa estar inteiro para você?", fromBook: false },
  { id: 291, text: "Você está permitindo que sua história seja escrita por você ou pelos outros?", fromBook: true },
  { id: 292, text: "Há beleza mesmo nas coisas que parecem quebradas.", fromBook: true },
  { id: 293, text: "Você é suficiente. Sempre foi. Sempre será.", fromBook: true },
  { id: 294, text: "A vida passa rápido. Não passe por ela dormindo.", fromBook: true },
  { id: 295, text: "Você pode ser a pessoa que está esperando por ajuda.", fromBook: true },
  { id: 296, text: "Não importa o que você passou, você está aqui agora. Isso importa.", fromBook: true },
  { id: 297, text: "O que você faria se acreditasse em si mesmo?", fromBook: false },
  { id: 298, text: "Qual é a parte de você que merecia mais cuidado?", fromBook: false },
  { id: 299, text: "Se sua vida fosse um livro, qual seria o próximo capítulo?", fromBook: false },
  { id: 300, text: "Como você quer que as pessoas se lembrem do momento em que te conheceram?", fromBook: false },
  { id: 301, text: "Qual é a verdade que sua alma conhece mas sua mente ainda nega?", fromBook: false },
  { id: 302, text: "Se você pudesse abraçar uma versão passada de você, qual abraçaria?", fromBook: false },
  { id: 303, text: "O que significa ter um coração aberto para você?", fromBook: false },
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

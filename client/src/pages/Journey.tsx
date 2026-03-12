import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ChevronRight,
  LockKeyhole,
  Crown,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Heart,
  Compass,
  Users,
  Brain,
  Sprout,
  Moon,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export interface JourneyDay {
  id: string;
  day: number;
  title: string;
  description: string;
  type: "reflexao" | "acao" | "escrita" | "meditacao" | "desafio" | "leitura";
  duration: string;
}

export interface JourneyData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  totalDays: number;
  days: JourneyDay[];
  unlockAfter?: string;
  season?: string;
}

export const JOURNEYS: JourneyData[] = [
  {
    id: "autoconhecimento",
    title: "Quem Sou Eu?",
    subtitle: "30 dias de autoconhecimento",
    description: "Uma jornada profunda para descobrir quem você realmente é, além das expectativas dos outros.",
    icon: "brain",
    color: "violet",
    gradientFrom: "#7c3aed",
    gradientTo: "#a78bfa",
    totalDays: 30,
    season: "Temporada 1",
    days: [
      { id: "auto-1", day: 1, title: "O Espelho Interno", description: "Escreva 3 qualidades suas que ninguém te ensinou — que você descobriu sozinho(a).", type: "escrita", duration: "10 min" },
      { id: "auto-2", day: 2, title: "Vozes Alheias", description: "Liste 5 coisas que as pessoas dizem sobre você. Quais são verdade? Quais são projeção?", type: "reflexao", duration: "15 min" },
      { id: "auto-3", day: 3, title: "Silêncio de 10 minutos", description: "Sente-se em silêncio total por 10 minutos. Sem celular, sem música. Observe o que surge.", type: "meditacao", duration: "10 min" },
      { id: "auto-4", day: 4, title: "A Criança Interior", description: "O que você amava fazer aos 8 anos? Faça algo relacionado hoje.", type: "acao", duration: "20 min" },
      { id: "auto-5", day: 5, title: "Carta ao Eu Passado", description: "Escreva uma carta para o seu eu de 5 anos atrás. O que diria?", type: "escrita", duration: "15 min" },
      { id: "auto-6", day: 6, title: "Valores Inegociáveis", description: "Identifique 3 valores que você nunca negociaria, por nenhum preço.", type: "reflexao", duration: "10 min" },
      { id: "auto-7", day: 7, title: "Dia Sem Máscara", description: "Hoje, em pelo menos uma conversa, seja 100% honesto(a) sobre como se sente.", type: "desafio", duration: "dia todo" },
      { id: "auto-8", day: 8, title: "Mapa de Influências", description: "Desenhe um mapa das 5 pessoas que mais influenciaram quem você é. O que cada uma plantou?", type: "escrita", duration: "15 min" },
      { id: "auto-9", day: 9, title: "O Que Me Irrita?", description: "Liste o que mais te irrita nos outros. Reflexão: alguma dessas coisas existe em você?", type: "reflexao", duration: "10 min" },
      { id: "auto-10", day: 10, title: "Caminhada Consciente", description: "Faça uma caminhada de 15 minutos sem fone. Preste atenção em cada passo.", type: "acao", duration: "15 min" },
      { id: "auto-11", day: 11, title: "Meus Medos Reais", description: "Escreva seus 5 maiores medos. Para cada um, pergunte: 'Isso é meu ou me ensinaram a ter?'", type: "escrita", duration: "15 min" },
      { id: "auto-12", day: 12, title: "Identidade vs. Rótulo", description: "Que rótulos você carrega? (Tímido, forte, responsável...) Escolha um para questionar hoje.", type: "reflexao", duration: "10 min" },
      { id: "auto-13", day: 13, title: "Respiração 4-7-8", description: "Pratique a respiração 4-7-8 por 5 rodadas. Inspira 4s, segura 7s, expira 8s.", type: "meditacao", duration: "5 min" },
      { id: "auto-14", day: 14, title: "Checkpoint: Semana 2", description: "Releia tudo que escreveu até aqui. O que te surpreendeu sobre si mesmo(a)?", type: "reflexao", duration: "15 min" },
      { id: "auto-15", day: 15, title: "Limites Saudáveis", description: "Diga 'não' para algo hoje — com respeito, mas sem culpa.", type: "desafio", duration: "dia todo" },
      { id: "auto-16", day: 16, title: "Playlist da Alma", description: "Crie uma playlist de 5 músicas que definem quem você é agora. Por que cada uma?", type: "acao", duration: "20 min" },
      { id: "auto-17", day: 17, title: "O Que Me Energiza?", description: "Liste 5 atividades que te dão energia e 5 que drenam. Perceba o padrão.", type: "reflexao", duration: "10 min" },
      { id: "auto-18", day: 18, title: "Diário de Gratidão", description: "Escreva 5 coisas pelas quais é grato(a) que não são óbvias.", type: "escrita", duration: "10 min" },
      { id: "auto-19", day: 19, title: "Body Scan", description: "Deite e faça um scan mental do corpo, dos pés à cabeça. Onde guarda tensão?", type: "meditacao", duration: "10 min" },
      { id: "auto-20", day: 20, title: "Conversa Difícil", description: "Tenha uma conversa que você tem adiado. Não precisa ser perfeita, precisa ser real.", type: "desafio", duration: "variável" },
      { id: "auto-21", day: 21, title: "Meu Legado", description: "Se você morresse amanhã, pelo que gostaria de ser lembrado(a)?", type: "reflexao", duration: "15 min" },
      { id: "auto-22", day: 22, title: "Desconexão Digital", description: "Fique 3 horas sem redes sociais hoje. Registre como se sentiu.", type: "desafio", duration: "3 horas" },
      { id: "auto-23", day: 23, title: "Autossabotagem", description: "Identifique 3 formas pelas quais você se sabota. Para cada uma, escreva uma alternativa.", type: "escrita", duration: "15 min" },
      { id: "auto-24", day: 24, title: "Meditação Guiada", description: "Faça 10 minutos de meditação focada em autocompaixão. Repita: 'Eu sou suficiente.'", type: "meditacao", duration: "10 min" },
      { id: "auto-25", day: 25, title: "Meu Corpo, Minha Casa", description: "Faça algo bom para seu corpo hoje: alongamento, banho longo, cozinhar algo saudável.", type: "acao", duration: "30 min" },
      { id: "auto-26", day: 26, title: "Perdão", description: "Escreva uma carta de perdão — para alguém ou para si mesmo(a). Não precisa enviar.", type: "escrita", duration: "15 min" },
      { id: "auto-27", day: 27, title: "Vulnerabilidade", description: "Compartilhe algo vulnerável com alguém de confiança hoje.", type: "desafio", duration: "variável" },
      { id: "auto-28", day: 28, title: "Visão de Futuro", description: "Descreva com detalhes como você quer estar daqui a 1 ano. Seja específico(a).", type: "escrita", duration: "15 min" },
      { id: "auto-29", day: 29, title: "Ritual Pessoal", description: "Crie um pequeno ritual matinal ou noturno que represente quem você quer ser.", type: "acao", duration: "15 min" },
      { id: "auto-30", day: 30, title: "Carta ao Eu Futuro", description: "Escreva uma carta para o seu eu daqui a 1 ano. Guarde. Releia quando a hora chegar.", type: "escrita", duration: "20 min" },
    ],
  },
  {
    id: "proposito",
    title: "Pra Que Eu Existo?",
    subtitle: "30 dias de propósito",
    description: "Encontre significado nas pequenas coisas e descubra o que te faz levantar da cama.",
    icon: "compass",
    color: "amber",
    gradientFrom: "#d97706",
    gradientTo: "#fbbf24",
    totalDays: 30,
    unlockAfter: "autoconhecimento",
    season: "Temporada 1",
    days: [
      { id: "prop-1", day: 1, title: "O Que Te Move?", description: "Liste 5 coisas que te fazem perder a noção do tempo quando está fazendo.", type: "reflexao", duration: "10 min" },
      { id: "prop-2", day: 2, title: "Propósito vs. Profissão", description: "Seu propósito não precisa ser seu trabalho. Reflita: o que você faria de graça?", type: "reflexao", duration: "15 min" },
      { id: "prop-3", day: 3, title: "Impacto Invisível", description: "Faça algo por alguém hoje sem que ninguém saiba. Registre como se sentiu.", type: "acao", duration: "variável" },
      { id: "prop-4", day: 4, title: "Mentores Invisíveis", description: "Quem te inspira? Escreva 3 pessoas e o que cada uma te ensina sobre viver.", type: "escrita", duration: "10 min" },
      { id: "prop-5", day: 5, title: "Micro-Propósitos", description: "Não precisa salvar o mundo. Qual micro-propósito você pode ter esta semana?", type: "reflexao", duration: "10 min" },
      { id: "prop-6", day: 6, title: "O Que o Mundo Precisa?", description: "Se pudesse resolver 1 problema do mundo, qual seria? Por quê?", type: "escrita", duration: "15 min" },
      { id: "prop-7", day: 7, title: "Dia de Contribuição", description: "Ofereça ajuda a alguém — vizinho, amigo, desconhecido. O propósito nasce no servir.", type: "desafio", duration: "dia todo" },
      { id: "prop-8", day: 8, title: "Ikigai Pessoal", description: "Desenhe seu Ikigai: O que amo + O que faço bem + O que o mundo precisa + O que posso ser pago.", type: "escrita", duration: "20 min" },
      { id: "prop-9", day: 9, title: "Desfazendo Crenças", description: "Qual crença sobre 'sucesso' você herdou e não questionou? Questione agora.", type: "reflexao", duration: "10 min" },
      { id: "prop-10", day: 10, title: "Meditação de Intenção", description: "Medite 10 minutos focando na pergunta: 'O que meu coração quer dizer?'", type: "meditacao", duration: "10 min" },
      { id: "prop-11", day: 11, title: "Minha Definição de Sucesso", description: "Escreva SUA definição de sucesso. Ignore a dos outros.", type: "escrita", duration: "10 min" },
      { id: "prop-12", day: 12, title: "Experimento Novo", description: "Faça algo que nunca fez: cozinhe algo novo, visite um lugar, fale com um estranho.", type: "acao", duration: "30 min" },
      { id: "prop-13", day: 13, title: "Carta à Humanidade", description: "Se pudesse deixar uma mensagem para a humanidade, o que diria?", type: "escrita", duration: "15 min" },
      { id: "prop-14", day: 14, title: "Checkpoint: Semana 2", description: "Releia suas reflexões. Algum padrão emergiu sobre o que te dá sentido?", type: "reflexao", duration: "15 min" },
      { id: "prop-15", day: 15, title: "Voluntariado Relâmpago", description: "Dedique 30 minutos a uma causa, mesmo que seja ouvir alguém com atenção.", type: "desafio", duration: "30 min" },
      { id: "prop-16", day: 16, title: "Ensine Algo", description: "Ensine algo que você sabe a alguém. O propósito se multiplica no compartilhar.", type: "acao", duration: "20 min" },
      { id: "prop-17", day: 17, title: "O Que Me Faz Chorar?", description: "O que te emociona profundamente? Injustiça, beleza, conexão? Isso aponta para seu propósito.", type: "reflexao", duration: "10 min" },
      { id: "prop-18", day: 18, title: "Diário de Impacto", description: "Registre 3 vezes que você fez diferença na vida de alguém, mesmo sem querer.", type: "escrita", duration: "10 min" },
      { id: "prop-19", day: 19, title: "Meditação do Coração", description: "Coloque a mão no peito. Respire fundo 10 vezes. Pergunte: 'O que você precisa de mim?'", type: "meditacao", duration: "10 min" },
      { id: "prop-20", day: 20, title: "Conversa de Propósito", description: "Pergunte a alguém mais velho: 'O que te dá sentido na vida?' Ouça com atenção.", type: "desafio", duration: "variável" },
      { id: "prop-21", day: 21, title: "Mapa de Habilidades", description: "Liste tudo que você sabe fazer — até coisas 'bobas'. Combine 3 de formas inesperadas.", type: "escrita", duration: "15 min" },
      { id: "prop-22", day: 22, title: "Dia Sem Pressa", description: "Faça tudo devagar hoje. Coma devagar, ande devagar. Observe o que surge na calma.", type: "desafio", duration: "dia todo" },
      { id: "prop-23", day: 23, title: "Projeto Semente", description: "Pense num projeto pessoal que te animaria. Dê o primeiro micro-passo hoje.", type: "acao", duration: "20 min" },
      { id: "prop-24", day: 24, title: "A Beleza no Comum", description: "Fotografe ou descreva 3 coisas bonitas que viu hoje que normalmente ignoraria.", type: "acao", duration: "15 min" },
      { id: "prop-25", day: 25, title: "Medo vs. Propósito", description: "O que você faria se não tivesse medo? Escreva sem censura.", type: "escrita", duration: "10 min" },
      { id: "prop-26", day: 26, title: "Rituais de Sentido", description: "Crie um ritual diário de 5 minutos que te conecte com seu propósito.", type: "acao", duration: "15 min" },
      { id: "prop-27", day: 27, title: "Gratidão Ativa", description: "Agradeça 3 pessoas hoje pessoalmente. Diga especificamente pelo quê.", type: "desafio", duration: "variável" },
      { id: "prop-28", day: 28, title: "Meditação de Compaixão", description: "Pratique loving-kindness: deseje felicidade para si, para alguém amado, para um estranho.", type: "meditacao", duration: "10 min" },
      { id: "prop-29", day: 29, title: "Manifesto Pessoal", description: "Escreva seu manifesto de vida em 10 frases. O que você defende?", type: "escrita", duration: "20 min" },
      { id: "prop-30", day: 30, title: "Compromisso Sagrado", description: "Escolha 1 ação alinhada ao seu propósito e comprometa-se a praticá-la semanalmente.", type: "reflexao", duration: "15 min" },
    ],
  },
  {
    id: "relacoes",
    title: "Eu e o Outro",
    subtitle: "30 dias de conexão humana",
    description: "Aprenda a se conectar de verdade, sem máscaras, com coragem e vulnerabilidade.",
    icon: "heart",
    color: "rose",
    gradientFrom: "#e11d48",
    gradientTo: "#fb7185",
    totalDays: 30,
    unlockAfter: "proposito",
    season: "Temporada 1",
    days: [
      { id: "rel-1", day: 1, title: "Escuta Ativa", description: "Hoje, em uma conversa, apenas ouça. Sem interromper, sem preparar resposta. Só ouvir.", type: "desafio", duration: "variável" },
      { id: "rel-2", day: 2, title: "Mapa de Relações", description: "Desenhe seus 3 círculos: íntimos, amigos, conhecidos. Quem está onde? Está satisfeito?", type: "reflexao", duration: "15 min" },
      { id: "rel-3", day: 3, title: "Mensagem Inesperada", description: "Mande uma mensagem de carinho para alguém que não espera ouvir de você.", type: "acao", duration: "5 min" },
      { id: "rel-4", day: 4, title: "Limites com Amor", description: "Reflita: em qual relação você precisa estabelecer um limite? O que te impede?", type: "reflexao", duration: "10 min" },
      { id: "rel-5", day: 5, title: "Linguagem do Amor", description: "Qual é a sua linguagem do amor? (Palavras, toque, tempo, presentes, atos?) E das pessoas próximas?", type: "reflexao", duration: "15 min" },
      { id: "rel-6", day: 6, title: "Presença Total", description: "Na próxima interação social, guarde o celular e esteja 100% presente.", type: "desafio", duration: "variável" },
      { id: "rel-7", day: 7, title: "Carta de Agradecimento", description: "Escreva uma carta de agradecimento real (pode ser digital) para alguém importante.", type: "escrita", duration: "15 min" },
      { id: "rel-8", day: 8, title: "Conflito Saudável", description: "Reflita: como você lida com conflitos? Foge, ataca ou conversa?", type: "reflexao", duration: "10 min" },
      { id: "rel-9", day: 9, title: "Empatia Radical", description: "Escolha alguém que te irrita. Tente imaginar a vida dessa pessoa por 5 minutos.", type: "meditacao", duration: "10 min" },
      { id: "rel-10", day: 10, title: "Elogio Genuíno", description: "Elogie 3 pessoas hoje — de forma específica e sincera. Não genérico.", type: "desafio", duration: "dia todo" },
      { id: "rel-11", day: 11, title: "Perdão em Andamento", description: "Há alguém que você precisa perdoar? Escreva o que sente sem julgamento.", type: "escrita", duration: "15 min" },
      { id: "rel-12", day: 12, title: "Amizade Profunda", description: "O que faz uma amizade profunda? Liste as qualidades. Você oferece essas qualidades?", type: "reflexao", duration: "10 min" },
      { id: "rel-13", day: 13, title: "Meditação de Conexão", description: "Medite enviando amor para as pessoas que você ama. Visualize cada uma.", type: "meditacao", duration: "10 min" },
      { id: "rel-14", day: 14, title: "Checkpoint: Semana 2", description: "Como suas relações mudaram nessas 2 semanas? O que percebeu?", type: "reflexao", duration: "15 min" },
      { id: "rel-15", day: 15, title: "Pedido de Desculpas", description: "Peça desculpas a alguém, mesmo por algo pequeno. A humildade conecta.", type: "desafio", duration: "variável" },
      { id: "rel-16", day: 16, title: "Encontro Real", description: "Marque um encontro presencial com alguém que normalmente só fala por mensagem.", type: "acao", duration: "1 hora" },
      { id: "rel-17", day: 17, title: "Comunicação Não-Violenta", description: "Pratique: Observação + Sentimento + Necessidade + Pedido. Use em uma conversa.", type: "desafio", duration: "variável" },
      { id: "rel-18", day: 18, title: "Herança Emocional", description: "Que padrões relacionais você herdou da sua família? Quais quer manter e quais mudar?", type: "escrita", duration: "15 min" },
      { id: "rel-19", day: 19, title: "Silêncio Compartilhado", description: "Fique em silêncio com alguém por 5 minutos. Sem celular. Apenas presença.", type: "meditacao", duration: "5 min" },
      { id: "rel-20", day: 20, title: "Vulnerabilidade Corajosa", description: "Compartilhe algo vulnerável com alguém de confiança. Algo que normalmente esconderia.", type: "desafio", duration: "variável" },
      { id: "rel-21", day: 21, title: "Generosidade Silenciosa", description: "Faça algo generoso sem contar para ninguém. Pague um café, ajude um estranho.", type: "acao", duration: "variável" },
      { id: "rel-22", day: 22, title: "Tóxido vs. Difícil", description: "Nem toda relação difícil é tóxica. Reflita: qual relação precisa de esforço e qual precisa de distância?", type: "reflexao", duration: "10 min" },
      { id: "rel-23", day: 23, title: "Escuta do Corpo", description: "Quando está perto de alguém, como seu corpo reage? Tensão? Paz? Observe.", type: "meditacao", duration: "dia todo" },
      { id: "rel-24", day: 24, title: "Humor Conectivo", description: "Faça alguém rir hoje. O humor é uma das formas mais poderosas de conexão.", type: "acao", duration: "variável" },
      { id: "rel-25", day: 25, title: "Dependência vs. Parceria", description: "Reflita: em qual relação você depende demais? Em qual você é parceiro(a)?", type: "reflexao", duration: "10 min" },
      { id: "rel-26", day: 26, title: "Carta ao Amigo Distante", description: "Escreva para alguém que se afastou. Não precisa enviar — mas pode.", type: "escrita", duration: "15 min" },
      { id: "rel-27", day: 27, title: "Dia de Sim", description: "Diga 'sim' a um convite social que normalmente recusaria.", type: "desafio", duration: "variável" },
      { id: "rel-28", day: 28, title: "Meditação Metta", description: "Pratique Metta (amor-bondade): 'Que eu seja feliz, que todos sejam felizes.'", type: "meditacao", duration: "10 min" },
      { id: "rel-29", day: 29, title: "O Que Eu Ofereço?", description: "O que você traz para suas relações? Escreva honestamente.", type: "escrita", duration: "10 min" },
      { id: "rel-30", day: 30, title: "Compromisso de Conexão", description: "Escolha 1 relação para nutrir ativamente nas próximas semanas. Faça o primeiro gesto.", type: "acao", duration: "15 min" },
    ],
  },
  {
    id: "incerteza",
    title: "Abraçando o Caos",
    subtitle: "30 dias com a incerteza",
    description: "Aprenda a navegar o desconhecido sem se perder. Transforme ansiedade em confiança.",
    icon: "target",
    color: "blue",
    gradientFrom: "#2563eb",
    gradientTo: "#60a5fa",
    totalDays: 30,
    season: "Temporada 2",
    days: [
      { id: "inc-1", day: 1, title: "O Mapa do Desconhecido", description: "Liste 5 incertezas que você enfrenta hoje. Para cada uma: é controlável ou não?", type: "reflexao", duration: "10 min" },
      { id: "inc-2", day: 2, title: "Diário da Ansiedade", description: "Anote toda vez que sentir ansiedade hoje. O gatilho, a sensação, a duração.", type: "escrita", duration: "dia todo" },
      { id: "inc-3", day: 3, title: "Respiração de Ancoragem", description: "Quando a ansiedade vier, respire: 4s inspirar, 4s segurar, 4s expirar, 4s esperar. 5 rodadas.", type: "meditacao", duration: "5 min" },
      { id: "inc-4", day: 4, title: "O Pior Cenário", description: "Escreva seu pior cenário para uma decisão. Depois: 'E se acontecesse, eu sobreviveria?'", type: "reflexao", duration: "10 min" },
      { id: "inc-5", day: 5, title: "Decisão Imperfeita", description: "Tome uma decisão que tem adiado. Qualquer uma. A perfeição é inimiga da ação.", type: "desafio", duration: "variável" },
      { id: "inc-6", day: 6, title: "Conforto no Desconforto", description: "Faça algo fora da sua zona de conforto: um caminho novo, um restaurante desconhecido.", type: "acao", duration: "variável" },
      { id: "inc-7", day: 7, title: "Meditação do Presente", description: "5 coisas que vejo, 4 que ouço, 3 que toco, 2 que cheiro, 1 que provo. Agora.", type: "meditacao", duration: "5 min" },
      { id: "inc-8", day: 8, title: "Histórias de Superação", description: "Liste 3 vezes que algo deu 'errado' na sua vida e acabou te levando a algo bom.", type: "escrita", duration: "15 min" },
      { id: "inc-9", day: 9, title: "Controle vs. Aceitação", description: "Para suas 5 incertezas do dia 1: o que você pode controlar? Foque nisso. Solte o resto.", type: "reflexao", duration: "10 min" },
      { id: "inc-10", day: 10, title: "Ato de Coragem", description: "Faça algo que requer coragem hoje, por menor que seja.", type: "desafio", duration: "variável" },
      { id: "inc-11", day: 11, title: "Conversa com o Medo", description: "Escreva um diálogo com seu medo. O que ele diria? E o que você responderia?", type: "escrita", duration: "15 min" },
      { id: "inc-12", day: 12, title: "Planejamento Flexível", description: "Planeje algo com 3 cenários: ideal, bom o suficiente, plano B. Solte a rigidez.", type: "reflexao", duration: "15 min" },
      { id: "inc-13", day: 13, title: "Grounding", description: "Pés no chão (descalço se puder). Sinta a terra. Você está aqui. Isso basta por agora.", type: "meditacao", duration: "5 min" },
      { id: "inc-14", day: 14, title: "Checkpoint: Semana 2", description: "Como sua relação com a incerteza mudou? O que está mais leve?", type: "reflexao", duration: "15 min" },
      { id: "inc-15", day: 15, title: "Erro Intencional", description: "Erre de propósito em algo pequeno hoje. Perceba: o mundo não acabou.", type: "desafio", duration: "variável" },
      { id: "inc-16", day: 16, title: "Gratidão pelo Caos", description: "Liste 3 coisas boas que só existem na sua vida POR CAUSA da incerteza.", type: "escrita", duration: "10 min" },
      { id: "inc-17", day: 17, title: "Impermanência", description: "Observe algo belo que vai acabar: um pôr do sol, uma flor, um momento. Aceite.", type: "meditacao", duration: "15 min" },
      { id: "inc-18", day: 18, title: "Pergunta ao Futuro", description: "Se seu eu de 10 anos pudesse te dizer 1 frase, qual seria?", type: "reflexao", duration: "10 min" },
      { id: "inc-19", day: 19, title: "Corpo e Incerteza", description: "Quando a incerteza aperta, faça 20 flexões, 20 agachamentos, 20 polichinelos. O corpo resolve.", type: "acao", duration: "10 min" },
      { id: "inc-20", day: 20, title: "Fluir", description: "Não planeje nada hoje à noite. Veja o que acontece. Pratique o 'ir com o fluxo'.", type: "desafio", duration: "noite" },
      { id: "inc-21", day: 21, title: "Luto do Controle", description: "Escreva: 'Eu solto o controle sobre ___.' Complete com o que precisa soltar.", type: "escrita", duration: "10 min" },
      { id: "inc-22", day: 22, title: "Curiosidade vs. Medo", description: "Substitua 'E se der errado?' por 'E se der certo?' em 3 situações hoje.", type: "desafio", duration: "dia todo" },
      { id: "inc-23", day: 23, title: "Meditação da Nuvem", description: "Imagine seus pensamentos como nuvens. Observe-os passar sem se apegar.", type: "meditacao", duration: "10 min" },
      { id: "inc-24", day: 24, title: "Pedido de Ajuda", description: "Peça ajuda para algo hoje. A vulnerabilidade de pedir é uma forma de coragem.", type: "desafio", duration: "variável" },
      { id: "inc-25", day: 25, title: "Pequenos Riscos", description: "Tome 3 micro-riscos hoje: fale com um desconhecido, tente algo novo, mude a rotina.", type: "acao", duration: "dia todo" },
      { id: "inc-26", day: 26, title: "Reescrevendo Narrativas", description: "Escolha um fracasso passado. Reescreva a história como aprendizado.", type: "escrita", duration: "15 min" },
      { id: "inc-27", day: 27, title: "Confiança no Processo", description: "Escreva: 'Eu confio que ___.' Complete com o que precisa acreditar.", type: "escrita", duration: "10 min" },
      { id: "inc-28", day: 28, title: "Meditação do Barco", description: "Visualize-se num barco em um rio. A correnteza te leva. Solte os remos por 10 minutos.", type: "meditacao", duration: "10 min" },
      { id: "inc-29", day: 29, title: "Celebrar a Dúvida", description: "A dúvida é sinal de inteligência, não fraqueza. Escreva 3 dúvidas que te fazem crescer.", type: "reflexao", duration: "10 min" },
      { id: "inc-30", day: 30, title: "Mantra do Navegante", description: "Crie seu mantra pessoal para momentos de incerteza. Escreva, memorize, repita.", type: "escrita", duration: "15 min" },
    ],
  },
  {
    id: "crescimento",
    title: "Florescer",
    subtitle: "30 dias de evolução pessoal",
    description: "Saia da estagnação e construa hábitos que transformam quem você é.",
    icon: "sprout",
    color: "emerald",
    gradientFrom: "#059669",
    gradientTo: "#34d399",
    totalDays: 30,
    unlockAfter: "incerteza",
    season: "Temporada 2",
    days: [
      { id: "cresc-1", day: 1, title: "Onde Estou?", description: "Dê uma nota de 1-10 para 5 áreas da vida: saúde, relações, propósito, mente, diversão.", type: "reflexao", duration: "10 min" },
      { id: "cresc-2", day: 2, title: "Hábito Âncora", description: "Escolha 1 micro-hábito (beber água, 5 min de leitura) e conecte a algo que já faz.", type: "acao", duration: "5 min" },
      { id: "cresc-3", day: 3, title: "Zona de Expansão", description: "Faça algo 5% fora do seu conforto hoje. Não 50% — apenas 5%.", type: "desafio", duration: "variável" },
      { id: "cresc-4", day: 4, title: "Aprender Algo Novo", description: "Gaste 20 minutos aprendendo algo totalmente novo: idioma, instrumento, habilidade.", type: "acao", duration: "20 min" },
      { id: "cresc-5", day: 5, title: "Diário de Vitórias", description: "Liste 5 pequenas vitórias da última semana que você não celebrou.", type: "escrita", duration: "10 min" },
      { id: "cresc-6", day: 6, title: "Meditação de Crescimento", description: "Visualize seu eu ideal daqui a 5 anos. O que mudou? Como se sente?", type: "meditacao", duration: "10 min" },
      { id: "cresc-7", day: 7, title: "Feedback Corajoso", description: "Peça feedback honesto a alguém: 'O que posso melhorar?' Ouça sem se defender.", type: "desafio", duration: "variável" },
      { id: "cresc-8", day: 8, title: "Eliminação Consciente", description: "Elimine 1 hábito que não te serve mais. Identifique o gatilho e planeje a substituição.", type: "reflexao", duration: "10 min" },
      { id: "cresc-9", day: 9, title: "Movimento do Corpo", description: "30 minutos de movimento intencional: dança, corrida, yoga, o que te chamar.", type: "acao", duration: "30 min" },
      { id: "cresc-10", day: 10, title: "Livro-Semente", description: "Leia 10 páginas de um livro que te desafie intelectualmente.", type: "leitura", duration: "15 min" },
      { id: "cresc-11", day: 11, title: "Conversa Elevadora", description: "Converse com alguém que pensa diferente de você. Sem debater — aprender.", type: "desafio", duration: "variável" },
      { id: "cresc-12", day: 12, title: "Revisão de Crenças", description: "Que crença limitante você carrega? ('Não sou bom o suficiente', 'Não mereço'). Desafie-a.", type: "reflexao", duration: "10 min" },
      { id: "cresc-13", day: 13, title: "Dieta de Informação", description: "Consuma apenas conteúdo intencional hoje. Nada de scroll automático.", type: "desafio", duration: "dia todo" },
      { id: "cresc-14", day: 14, title: "Checkpoint: Semana 2", description: "Reveja suas notas do dia 1. Algo já mudou? O que precisa de mais atenção?", type: "reflexao", duration: "15 min" },
      { id: "cresc-15", day: 15, title: "Ensinar para Aprender", description: "Ensine algo que aprendeu recentemente a alguém. O ensino solidifica o aprendizado.", type: "acao", duration: "15 min" },
      { id: "cresc-16", day: 16, title: "Fracasso como Dado", description: "Relembre um fracasso. Extraia 3 aprendizados concretos. O fracasso é informação.", type: "escrita", duration: "10 min" },
      { id: "cresc-17", day: 17, title: "Ambiente de Crescimento", description: "Organize um espaço físico (quarto, mesa). Ambientes limpos geram clareza mental.", type: "acao", duration: "30 min" },
      { id: "cresc-18", day: 18, title: "Meditação de Aceitação", description: "Aceite onde você está AGORA. Não onde deveria estar. Repita: 'Aqui está bom. E vou avançar.'", type: "meditacao", duration: "10 min" },
      { id: "cresc-19", day: 19, title: "Desafio de Consistência", description: "Faça seu micro-hábito do dia 2 por 7 dias seguidos a partir de hoje. Marque aqui.", type: "desafio", duration: "5 min/dia" },
      { id: "cresc-20", day: 20, title: "Carta de Admiração", description: "Escreva para alguém que admira (pode ser alguém que não conhece). Expresse o porquê.", type: "escrita", duration: "15 min" },
      { id: "cresc-21", day: 21, title: "Silêncio Produtivo", description: "Trabalhe/estude 1 hora sem nenhuma distração. Modo avião. Foco total.", type: "desafio", duration: "1 hora" },
      { id: "cresc-22", day: 22, title: "Descanso Intencional", description: "Descanse de verdade hoje. Sem culpa. O crescimento acontece no descanso.", type: "acao", duration: "variável" },
      { id: "cresc-23", day: 23, title: "Mapear Progressos", description: "Releia todo seu diário da jornada. Marque as 3 maiores evoluções.", type: "reflexao", duration: "15 min" },
      { id: "cresc-24", day: 24, title: "Criar algo", description: "Crie algo: desenho, poema, música, receita. Não precisa ser bom. Precisa ser seu.", type: "acao", duration: "30 min" },
      { id: "cresc-25", day: 25, title: "Compaixão pelo Processo", description: "Escreva: 'Eu me permito crescer no meu tempo.' O crescimento não é linear.", type: "escrita", duration: "10 min" },
      { id: "cresc-26", day: 26, title: "Mentoria Informal", description: "Ajude alguém mais novo (ou menos experiente) com algo que você já domina.", type: "acao", duration: "variável" },
      { id: "cresc-27", day: 27, title: "Meditação de Intenção", description: "Antes de dormir, defina 1 intenção para amanhã. Visualize-a acontecendo.", type: "meditacao", duration: "5 min" },
      { id: "cresc-28", day: 28, title: "Gratidão pelo Caminho", description: "Agradeça a si mesmo(a) por cada dia completado. Você mostrou compromisso.", type: "escrita", duration: "10 min" },
      { id: "cresc-29", day: 29, title: "Identidade de Crescimento", description: "Quem você está se tornando? Escreva 'Eu sou alguém que ___.' Complete com 5 frases.", type: "escrita", duration: "10 min" },
      { id: "cresc-30", day: 30, title: "Próximo Capítulo", description: "Dê novas notas de 1-10. Compare com o dia 1. Celebre e planeje os próximos 30 dias.", type: "reflexao", duration: "20 min" },
    ],
  },
  {
    id: "solidao",
    title: "Estar Só, Não Sozinho",
    subtitle: "30 dias de solitude",
    description: "Descubra a diferença entre solidão e solitude. Aprenda a ser sua melhor companhia.",
    icon: "moon",
    color: "indigo",
    gradientFrom: "#4f46e5",
    gradientTo: "#818cf8",
    totalDays: 30,
    unlockAfter: "crescimento",
    season: "Temporada 2",
    days: [
      { id: "sol-1", day: 1, title: "Sozinho vs. Solitário", description: "Escreva a diferença entre estar sozinho e estar solitário. Qual você sente mais?", type: "reflexao", duration: "10 min" },
      { id: "sol-2", day: 2, title: "Café Consigo", description: "Tome um café ou chá sozinho(a) hoje, sentado, sem celular. Observe o mundo.", type: "acao", duration: "15 min" },
      { id: "sol-3", day: 3, title: "Silêncio Amigo", description: "Fique 15 minutos em silêncio completo. Sem fazer nada. Apenas ser.", type: "meditacao", duration: "15 min" },
      { id: "sol-4", day: 4, title: "Carta para Mim", description: "Escreva uma carta de amor para si mesmo(a). Sem ironia. Com ternura real.", type: "escrita", duration: "15 min" },
      { id: "sol-5", day: 5, title: "Passeio Solo", description: "Vá a um lugar novo sozinho(a): parque, museu, bairro. Sem pressa.", type: "acao", duration: "1 hora" },
      { id: "sol-6", day: 6, title: "Dependência Social", description: "Reflita: o que você evita fazer sozinho(a)? Restaurante? Cinema? Por quê?", type: "reflexao", duration: "10 min" },
      { id: "sol-7", day: 7, title: "Refeição Consciente", description: "Faça uma refeição sozinho(a) sem tela nenhuma. Sinta cada sabor.", type: "desafio", duration: "30 min" },
      { id: "sol-8", day: 8, title: "Diálogo Interno", description: "Escreva uma conversa entre você e sua voz interior. O que ela quer te dizer?", type: "escrita", duration: "15 min" },
      { id: "sol-9", day: 9, title: "Banho Meditativo", description: "Tome um banho lento e consciente. Sinta a água, a temperatura, o momento.", type: "meditacao", duration: "15 min" },
      { id: "sol-10", day: 10, title: "Arte Solitária", description: "Crie algo sozinho(a): desenhe, pinte, escreva poesia. Sem plateia.", type: "acao", duration: "20 min" },
      { id: "sol-11", day: 11, title: "Medo do Vazio", description: "O que você teme encontrar quando está a sós? Escreva sem filtro.", type: "escrita", duration: "10 min" },
      { id: "sol-12", day: 12, title: "Natureza Solo", description: "Passe tempo na natureza sozinho(a). Árvore, praça, céu. Sem fone.", type: "acao", duration: "20 min" },
      { id: "sol-13", day: 13, title: "Meditação do Abraço", description: "Abraçe a si mesmo(a) fisicamente. Respire fundo. Diga: 'Estou aqui comigo.'", type: "meditacao", duration: "5 min" },
      { id: "sol-14", day: 14, title: "Checkpoint: Semana 2", description: "Como está sua relação com a solitude? O que mudou desde o dia 1?", type: "reflexao", duration: "15 min" },
      { id: "sol-15", day: 15, title: "Cinema Solo", description: "Vá ao cinema ou assista um filme sozinho(a). Sem culpa, sem vergonha.", type: "desafio", duration: "2 horas" },
      { id: "sol-16", day: 16, title: "Hobbies Perdidos", description: "Resgate 1 hobby que você abandonou por achar que 'ninguém faz junto'. Faça.", type: "acao", duration: "30 min" },
      { id: "sol-17", day: 17, title: "Escrita Livre", description: "Escreva por 10 minutos sem parar. Sem tema. Sem filtro. Puro fluxo de consciência.", type: "escrita", duration: "10 min" },
      { id: "sol-18", day: 18, title: "Desconectar para Conectar", description: "4 horas sem redes sociais. Observe o que faz com o tempo livre.", type: "desafio", duration: "4 horas" },
      { id: "sol-19", day: 19, title: "Autocompaixão", description: "Medite repetindo: 'Eu mereço minha própria gentileza. Eu sou digno(a) de amor — inclusive o meu.'", type: "meditacao", duration: "10 min" },
      { id: "sol-20", day: 20, title: "Rotina do Prazer", description: "Faça algo prazeroso só para você: cozinhar, dançar, ler. Sem justificar.", type: "acao", duration: "30 min" },
      { id: "sol-21", day: 21, title: "O Presente da Solidão", description: "Liste 5 coisas que a solidão te ensinou ou te permitiu desenvolver.", type: "escrita", duration: "10 min" },
      { id: "sol-22", day: 22, title: "Jantar Solo", description: "Prepare uma refeição especial para si mesmo(a). Com capricho. Você merece.", type: "acao", duration: "1 hora" },
      { id: "sol-23", day: 23, title: "Observação do Mundo", description: "Sente em um lugar movimentado sozinho(a). Observe as pessoas. Invente histórias.", type: "acao", duration: "20 min" },
      { id: "sol-24", day: 24, title: "Meditação da Lua", description: "À noite, observe a lua (ou o céu). Você está sozinho(a), mas não isolado(a).", type: "meditacao", duration: "10 min" },
      { id: "sol-25", day: 25, title: "Fronteiras Saudáveis", description: "A solitude escolhida é liberdade. Quando você ESCOLHE estar só, como se sente?", type: "reflexao", duration: "10 min" },
      { id: "sol-26", day: 26, title: "Ritual Noturno Solo", description: "Crie um ritual só seu antes de dormir. Chá, leitura, música. Algo sagrado.", type: "acao", duration: "20 min" },
      { id: "sol-27", day: 27, title: "Gratidão por Mim", description: "Escreva 10 coisas que ama em si mesmo(a). Sem modéstia. Com verdade.", type: "escrita", duration: "10 min" },
      { id: "sol-28", day: 28, title: "Caminhada de Despedida", description: "Faça uma caminhada de 20 minutos como ritual de encerramento desta fase.", type: "acao", duration: "20 min" },
      { id: "sol-29", day: 29, title: "Releitura da Jornada", description: "Releia tudo que escreveu nesta jornada. O que o 'você solo' te ensinou?", type: "reflexao", duration: "20 min" },
      { id: "sol-30", day: 30, title: "Promessa a Mim", description: "Escreva 1 compromisso consigo mesmo(a) que vai honrar. Assine embaixo.", type: "escrita", duration: "10 min" },
    ],
  },
];

const ICON_MAP: Record<string, any> = {
  brain: Brain,
  compass: Compass,
  heart: Heart,
  target: Target,
  sprout: Sprout,
  moon: Moon,
};

interface ProgressData {
  journeyId: string;
  completedDays: string[];
}

export default function Journey() {
  const { user } = useAuth();
  const isPremium = user?.hasPremium || user?.role === "admin";
  const [progressMap, setProgressMap] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/journey/progress", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any[]) => {
        const map: Record<string, ProgressData> = {};
        data.forEach((p) => {
          map[p.journeyId] = { journeyId: p.journeyId, completedDays: p.completedDays };
        });
        setProgressMap(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isJourneyUnlocked = (journey: JourneyData): boolean => {
    if (isPremium) return true;
    if (!journey.unlockAfter) return true;
    const prev = progressMap[journey.unlockAfter];
    if (!prev) return false;
    const prevJourney = JOURNEYS.find((j) => j.id === journey.unlockAfter);
    if (!prevJourney) return false;
    return prev.completedDays.length >= prevJourney.totalDays;
  };

  const getProgress = (journeyId: string, totalDays: number) => {
    const p = progressMap[journeyId];
    if (!p) return 0;
    return Math.round((p.completedDays.length / totalDays) * 100);
  };

  const getStatus = (journey: JourneyData): "locked" | "not-started" | "in-progress" | "completed" => {
    if (!isPremium && !isJourneyUnlocked(journey)) return "locked";
    const p = progressMap[journey.id];
    if (!p || p.completedDays.length === 0) return "not-started";
    if (p.completedDays.length >= journey.totalDays) return "completed";
    return "in-progress";
  };

  const seasons = [...new Set(JOURNEYS.map((j) => j.season))];

  return (
    <div className="min-h-screen pb-24 animate-in fade-in duration-700" data-testid="page-journey">
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Flame size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-foreground" data-testid="text-journey-title">Jornadas</h1>
            <p className="text-xs text-muted-foreground">Desafios de 30 dias para evoluir</p>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Recurso Premium</span>
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
            Desbloqueie todas as jornadas com o plano premium por R$9,90/mês.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-6 mt-6 space-y-8">
          {seasons.map((season) => (
            <div key={season}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-primary" />
                <h2 className="text-[11px] uppercase tracking-[0.15em] text-primary font-bold">{season}</h2>
              </div>
              <div className="space-y-3">
                {JOURNEYS.filter((j) => j.season === season).map((journey) => {
                  const Icon = ICON_MAP[journey.icon] || Target;
                  const status = getStatus(journey);
                  const progress = getProgress(journey.id, journey.totalDays);
                  const completedDays = progressMap[journey.id]?.completedDays.length || 0;
                  const isLocked = status === "locked";

                  return (
                    <Link
                      key={journey.id}
                      href={isLocked ? "#" : `/journey/${journey.id}`}
                      onClick={(e) => isLocked && e.preventDefault()}
                    >
                      <div
                        className={`relative overflow-hidden rounded-2xl border transition-all active:scale-[0.98] ${
                          isLocked
                            ? "opacity-50 border-border bg-muted/30 cursor-not-allowed"
                            : status === "completed"
                            ? "border-green-500/30 bg-green-500/5"
                            : status === "in-progress"
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-card hover:border-primary/20"
                        }`}
                        data-testid={`card-journey-${journey.id}`}
                      >
                        <div className="p-4 flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{
                              background: isLocked
                                ? "hsl(var(--muted))"
                                : `linear-gradient(135deg, ${journey.gradientFrom}, ${journey.gradientTo})`,
                            }}
                          >
                            {isLocked ? (
                              <LockKeyhole size={20} className="text-muted-foreground" />
                            ) : status === "completed" ? (
                              <Trophy size={20} className="text-white" />
                            ) : (
                              <Icon size={20} className="text-white" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{journey.title}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{journey.subtitle}</p>
                            {status === "in-progress" && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-medium text-primary">{completedDays}/{journey.totalDays}</span>
                              </div>
                            )}
                            {status === "completed" && (
                              <div className="mt-1 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-green-500" />
                                <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Concluída!</span>
                              </div>
                            )}
                            {isLocked && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Complete "{JOURNEYS.find((j) => j.id === journey.unlockAfter)?.title}" para desbloquear
                              </p>
                            )}
                          </div>

                          {!isLocked && (
                            <ChevronRight size={18} className="text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="p-6 rounded-2xl bg-secondary/30 border border-dashed border-border flex flex-col items-center text-center space-y-3 mt-6">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary shadow-inner">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-base">Novas Jornadas em Breve</h4>
              <p className="text-[11px] text-muted-foreground px-4">
                Temporada 3 com jornadas sobre Amor Próprio, Coragem e Criatividade.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

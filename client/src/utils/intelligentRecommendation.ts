import { DAILY_REFLECTIONS } from "@/pages/Book";

export interface CheckIn {
  date: string;
  mood: string;
  entry: string;
  tags: string[];
  timestamp: number;
}

export interface RecommendedContent {
  reflection: typeof DAILY_REFLECTIONS[0];
  tips: typeof DAILY_REFLECTIONS[0][];
  reminders: typeof DAILY_REFLECTIONS[0][];
}

const MOOD_TO_KEYWORDS: Record<string, string[]> = {
  ansioso: ["ansiedade", "futuro", "medo", "preocupação", "nervoso"],
  triste: ["dor", "perda", "vazio", "saudade", "dificuldade"],
  confuso: ["incerteza", "perdido", "dúvida", "propósito", "direção"],
  vazio: ["sentido", "significado", "vácuo", "solidão", "isolado"],
  grato: ["gratidão", "paz", "aceitação", "força", "resiliente"],
  esperançoso: ["futuro", "possibilidade", "sonho", "coragem", "potencial"],
  cansado: ["repouso", "descanso", "pausa", "gentileza", "compaixão"],
  frustrado: ["aceitação", "paciência", "limite", "permissão", "liberdade"],
  criativo: ["criação", "expressão", "liberdade", "autenticidade", "fluxo"],
  amoroso: ["conexão", "vulnerabilidade", "abertura", "confiança", "presença"],
};

const ENTRY_KEYWORDS = {
  incerteza: ["não sei", "dúvida", "confuso", "perdido", "que faço"],
  relacionamento: ["amor", "namorado", "namorada", "amigo", "família", "pessoa", "relacionamento"],
  propósito: ["objetivo", "carreira", "trabalho", "sentido", "propósito", "fazer da vida"],
  identidade: ["quem sou", "minha essência", "autêntico", "identidade", "eu mesmo"],
  solidão: ["sozinho", "solitário", "solitude", "solidão", "isolado"],
  crescimento: ["aprender", "evoluir", "mudar", "crescer", "melhorar"],
  medo: ["medo", "assustado", "nervoso", "preocupado", "ansiedade"],
  aceitação: ["aceitar", "permissão", "tudo bem", "deixar ir", "soltar"],
  força: ["forte", "consegui", "superei", "venci", "resiliente"],
};

export function analyzeCheckIn(mood: string, entry: string): string[] {
  const detectedTags = new Set<string>();
  const lowerEntry = entry.toLowerCase();

  // Analisar por mood
  const moodKeywords = MOOD_TO_KEYWORDS[mood.toLowerCase()] || [];
  moodKeywords.forEach(keyword => {
    if (lowerEntry.includes(keyword)) {
      detectedTags.add(keyword);
    }
  });

  // Analisar entry por keywords
  Object.entries(ENTRY_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => lowerEntry.includes(keyword))) {
      detectedTags.add(tag);
    }
  });

  // Se nenhuma tag detectada, usar o mood como tag
  if (detectedTags.size === 0) {
    detectedTags.add(mood.toLowerCase());
  }

  return Array.from(detectedTags).slice(0, 5);
}

export function recommendContent(lastCheckIn: CheckIn | null): RecommendedContent {
  if (!lastCheckIn) {
    return getDefaultRecommendations();
  }

  const { mood, tags } = lastCheckIn;
  const reflection = findRelevantReflection(tags, mood);
  const tips = findRelevantTips(tags, mood);
  const reminders = findRelevantReminders(tags, mood);

  return {
    reflection,
    tips: tips.slice(0, 2),
    reminders: reminders.slice(0, 3),
  };
}

function findRelevantReflection(
  tags: string[],
  mood: string
): typeof DAILY_REFLECTIONS[0] {
  const keywords = [
    ...tags,
    mood.toLowerCase(),
    ...(MOOD_TO_KEYWORDS[mood.toLowerCase()] || []),
  ];

  let bestMatch = DAILY_REFLECTIONS[0];
  let bestScore = 0;

  for (const reflection of DAILY_REFLECTIONS) {
    if (reflection.type !== "reflection") continue;

    let score = 0;
    const textLower = reflection.text.toLowerCase();

    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) score += 2;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = reflection;
    }
  }

  return bestMatch;
}

function findRelevantTips(tags: string[], mood: string): typeof DAILY_REFLECTIONS[0][] {
  const keywords = [...tags, mood.toLowerCase()];
  const scored = DAILY_REFLECTIONS.filter((item) => item.type === "tip").map((tip) => {
    let score = 0;
    const textLower = tip.text.toLowerCase();

    keywords.forEach((keyword) => {
      if (textLower.includes(keyword)) score += 2;
    });

    // Bonus para dicas universais que sempre ajudam
    if (
      textLower.includes("respir") ||
      textLower.includes("medit") ||
      textLower.includes("pausa") ||
      textLower.includes("movimento") ||
      textLower.includes("criar")
    ) {
      score += 1;
    }

    return { ...tip, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...rest }) => rest);
}

function findRelevantReminders(
  tags: string[],
  mood: string
): typeof DAILY_REFLECTIONS[0][] {
  const keywords = [...tags, mood.toLowerCase()];
  const scored = DAILY_REFLECTIONS.filter((item) => item.type === "reminder").map(
    (reminder) => {
      let score = 0;
      const textLower = reminder.text.toLowerCase();

      // Match com tags/mood
      keywords.forEach((keyword) => {
        if (textLower.includes(keyword)) score += 2;
      });

      // Bonus para lembretes sobre merecer/permissão
      if (
        textLower.includes("merec") ||
        textLower.includes("permiss") ||
        textLower.includes("autorizado") ||
        textLower.includes("está tudo bem")
      ) {
        score += 1;
      }

      // Bonus para lembretes motivacionais universais
      if (
        textLower.includes("sobreviveu") ||
        textLower.includes("mais forte") ||
        textLower.includes("resistente")
      ) {
        score += 1;
      }

      return { ...reminder, score };
    }
  );

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...rest }) => rest);
}

function getDefaultRecommendations(): RecommendedContent {
  // Fallback para primeira vez
  return {
    reflection:
      DAILY_REFLECTIONS.find((r) => r.type === "reflection" && r.fromBook) ||
      DAILY_REFLECTIONS[0],
    tips: DAILY_REFLECTIONS.filter((r) => r.type === "tip").slice(0, 2),
    reminders: DAILY_REFLECTIONS.filter((r) => r.type === "reminder").slice(0, 3),
  };
}

export function getLastCheckIn(): CheckIn | null {
  const stored = localStorage.getItem("casa-dos-20-last-checkin");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    
    // Se o check-in é de hoje, retorna
    const checkInDate = new Date(parsed.timestamp);
    const today = new Date();
    
    if (
      checkInDate.getFullYear() === today.getFullYear() &&
      checkInDate.getMonth() === today.getMonth() &&
      checkInDate.getDate() === today.getDate()
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function saveCheckIn(mood: string, entry: string): CheckIn {
  const now = new Date();
  const tags = analyzeCheckIn(mood, entry);

  const checkIn: CheckIn = {
    date: now.toLocaleDateString("pt-BR"),
    mood,
    entry,
    tags,
    timestamp: now.getTime(),
  };

  localStorage.setItem("casa-dos-20-last-checkin", JSON.stringify(checkIn));
  return checkIn;
}

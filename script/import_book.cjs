// Import book chapters from PDF text into Neon database
const fs = require('fs');
const { Client } = require('pg');

const DB_URL = process.env.NEON_DATABASE_URL;
if (!DB_URL) { console.error('NEON_DATABASE_URL not set'); process.exit(1); }

// Chapter list from TOC
const TOC = [
  { num: 0, title: 'Introdução', tag: 'introdução', isPreview: true },
  { num: 1, title: 'Abraçando a Incerteza: Uma Jornada para o Sucesso Colaborativo', tag: 'crescimento', isPreview: true },
  { num: 2, title: 'Você já parou para pensar que a incerteza pode ser um presente inesperado em nossas vidas', tag: 'incerteza', isPreview: false },
  { num: 3, title: 'Confie no esforço que você está disposto a colocar, pois é ele que transforma a incerteza em oportunidade', tag: 'motivação', isPreview: false },
  { num: 4, title: 'É na solidão que nos conhecemos, mas é nas interações com os outros que crescemos', tag: 'solidão', isPreview: false },
  { num: 5, title: 'Enfrentando a Solidão para Realizar Sonhos', tag: 'solidão', isPreview: false },
  { num: 6, title: 'Algumas pessoas estão destinadas a serem amadas apenas por um curto período de tempo', tag: 'relacionamentos', isPreview: false },
  { num: 7, title: 'É normal se perder em alguém e ainda lutar para encontrar o seu caminho de volta', tag: 'relacionamentos', isPreview: false },
  { num: 8, title: 'Solidão não é vazio, é uma oportunidade para se encontrar', tag: 'solidão', isPreview: false },
  { num: 9, title: 'Talvez a verdadeira liberdade esteja em escolher com sabedoria o que realmente importa', tag: 'liberdade', isPreview: false },
  { num: 10, title: 'Desvendando a Ansiedade: Entendendo o Que se Passa na Sua Mente', tag: 'saúde mental', isPreview: false },
  { num: 11, title: 'Assumindo Quem Você Realmente É: Encarando o Medo de Não Ser Aceito', tag: 'identidade', isPreview: false },
  { num: 12, title: 'Desafiando Imperfeições: Aceitação, Mudança e Empoderamento', tag: 'aceitação', isPreview: false },
  { num: 13, title: 'Você não pode se sentir confortável consigo mesmo se você não souber quem você é', tag: 'identidade', isPreview: false },
  { num: 14, title: 'A Jornada da Excepcionalidade: Aceitando Sua Singularidade', tag: 'identidade', isPreview: false },
  { num: 15, title: 'Desconectando-se das Ilusões das Redes Sociais', tag: 'redes sociais', isPreview: false },
  { num: 16, title: 'Tornando-se a Pessoa Certa: O Caminho para o Verdadeiro Amor', tag: 'amor', isPreview: false },
  { num: 17, title: 'Desbravando o Oceano do Medo: Um Passo de Cada Vez', tag: 'medo', isPreview: false },
  { num: 18, title: 'Os Capítulos Inevitáveis da Vida', tag: 'vida', isPreview: false },
  { num: 19, title: 'Aqui está o que eles não te contam — você nunca vai realmente entender', tag: 'vida', isPreview: false },
  { num: 20, title: 'Desmascarando o Perfeccionismo: Ação, Não Ilusão', tag: 'crescimento', isPreview: false },
  { num: 21, title: 'A Armadilha do Autodesenvolvimento', tag: 'crescimento', isPreview: false },
  { num: 22, title: 'O Desconforto é na Verdade um Chamado para a Mudança', tag: 'mudança', isPreview: false },
  { num: 23, title: 'Desvendando o Caminho Menos Percorrido', tag: 'propósito', isPreview: false },
  { num: 24, title: 'Vivendo Leve: Aliviando o Sofrimento do Apego e das Expectativas', tag: 'bem-estar', isPreview: false },
  { num: 25, title: 'Coisas para Fazer nos Seus Vinte Anos Além de Correr Atrás do Amor', tag: 'vida', isPreview: false },
  { num: 26, title: 'A última coisa que quer ouvir é encorajamento', tag: 'motivação', isPreview: false },
  { num: 27, title: 'Não tenha medo de pedir ajuda', tag: 'bem-estar', isPreview: false },
  { num: 28, title: 'Razões para relacionamentos acabarem', tag: 'relacionamentos', isPreview: false },
  { num: 29, title: 'Navegando Relacionamentos Unilaterais: Reconhecendo o Valor Próprio', tag: 'relacionamentos', isPreview: false },
  { num: 30, title: 'Se alguém quer estar na sua vida, essa pessoa estará', tag: 'relacionamentos', isPreview: false },
  { num: 31, title: 'Valorizando Amizades Inesquecíveis', tag: 'amizade', isPreview: false },
  { num: 32, title: 'Reconectar-se consigo mesmo é a chave para superar a dependência', tag: 'bem-estar', isPreview: false },
  { num: 33, title: 'Encontrar o verdadeiro sucesso não é apenas alcançar o topo da escada financeira', tag: 'sucesso', isPreview: false },
  { num: 34, title: 'Não minimize nem desvalorize seus sentimentos', tag: 'emoções', isPreview: false },
  { num: 35, title: 'Equilibrando o Presente e o Futuro: O Dilema de Investir e Curtir', tag: 'vida', isPreview: false },
  { num: 36, title: 'Como vou ganhar a vida: Isso tudo depende da sua definição de vida', tag: 'carreira', isPreview: false },
  { num: 37, title: 'Desvendando a Cultura do Esforço: Uma Perspectiva Realista', tag: 'trabalho', isPreview: false },
  { num: 38, title: 'Viver a Vida: Além dos Prazeres Instantâneos', tag: 'vida', isPreview: false },
  { num: 39, title: 'Você não precisa resolver toda a sua vida hoje', tag: 'ansiedade', isPreview: false },
  { num: 40, title: 'Estar rodeado das pessoas certas é clichê', tag: 'relacionamentos', isPreview: false },
  { num: 41, title: 'Lidando com Relações Tóxicas: Priorizando o Seu Bem-Estar', tag: 'bem-estar', isPreview: false },
  { num: 42, title: 'Você está realmente curado ou apenas distraído', tag: 'saúde mental', isPreview: false },
  { num: 43, title: 'Tirando a Máscara: Vencendo a Síndrome de Impostor', tag: 'identidade', isPreview: false },
  { num: 44, title: 'Transformando Insultos em Oportunidades de Crescimento Pessoal', tag: 'crescimento', isPreview: false },
  { num: 45, title: 'Você é Mais do que Suas Comparações', tag: 'autoestima', isPreview: false },
  { num: 46, title: 'Aprendendo e Evoluindo: O Verdadeiro Sentido da Jornada', tag: 'crescimento', isPreview: false },
  { num: 47, title: 'Desacelerando para Apreciar a Jornada', tag: 'vida', isPreview: false },
  { num: 48, title: 'Descobrindo o Essencial em Meio ao Caos', tag: 'bem-estar', isPreview: false },
  { num: 49, title: 'Vivendo Plenamente', tag: 'vida', isPreview: false },
  { num: 50, title: 'Como você passa seus vinte anos pode definir o seu futuro', tag: 'futuro', isPreview: false },
  { num: 51, title: 'Encontrando Seu Próprio Caminho: Navegando Pelas Expectativas na Escolha de uma Carreira', tag: 'carreira', isPreview: false },
  { num: 52, title: 'Sua Criatividade é Única', tag: 'criatividade', isPreview: false },
  { num: 53, title: 'A Solidão do Caminho Excepcional', tag: 'solidão', isPreview: false },
  { num: 54, title: 'As diferentes maneiras de você se abandonar', tag: 'bem-estar', isPreview: false },
  { num: 55, title: 'Você não está perdido. Você está apenas em um estágio desconfortável de sua vida', tag: 'crescimento', isPreview: false },
  { num: 56, title: 'Sem Pressa, Sem Prazos', tag: 'vida', isPreview: false },
  { num: 57, title: 'A pressão esmagadora para alcançar o sucesso de forma rápida', tag: 'sucesso', isPreview: false },
  { num: 58, title: 'Você não está onde quer estar. E está tudo bem', tag: 'aceitação', isPreview: false },
  { num: 59, title: 'Lidando com a Bagunça na Sua Mente', tag: 'saúde mental', isPreview: false },
  { num: 60, title: 'Aqueles que te machucaram, eles mesmos estavam feridos', tag: 'emoções', isPreview: false },
  { num: 61, title: 'As pessoas que o seu coração escolhe, mesmo quando pensa que é na hora errada', tag: 'amor', isPreview: false },
  { num: 62, title: 'As pessoas temporárias em sua vida são suas lições', tag: 'relacionamentos', isPreview: false },
  { num: 63, title: 'Espero que você tenha a coragem de continuar amando profundamente', tag: 'amor', isPreview: false },
  { num: 64, title: 'Só porque alguém já foi uma parte importante da sua vida não significa que você precise se agarrar', tag: 'relacionamentos', isPreview: false },
  { num: 65, title: 'A Coragem de se Distanciar pelo Bem-Estar', tag: 'bem-estar', isPreview: false },
  { num: 66, title: 'Crie espaço para pensar', tag: 'bem-estar', isPreview: false },
  { num: 67, title: 'Desvendando o Vício Invisível: O Estresse Crônico Disfarçado', tag: 'saúde mental', isPreview: false },
  { num: 68, title: 'Entendendo o Mental Breakdown', tag: 'saúde mental', isPreview: false },
  { num: 69, title: 'No nosso próprio tempo', tag: 'vida', isPreview: false },
  { num: 70, title: 'O Poder Transformador dos Fracassos', tag: 'crescimento', isPreview: false },
  { num: 71, title: 'Perdoe-se', tag: 'bem-estar', isPreview: false },
  { num: 72, title: 'Talvez, neste momento, sua jornada não seja sobre amor', tag: 'propósito', isPreview: false },
  { num: 73, title: 'A Arte de Dizer Não — Preservando Compromissos e Prioridades', tag: 'bem-estar', isPreview: false },
  { num: 74, title: 'Aqui vai uma verdade para quem acha que acumular conhecimento é suficiente para mudar a vida', tag: 'crescimento', isPreview: false },
  { num: 75, title: 'Desafiando a Ideia do Equilíbrio — Escolhendo Intencionalmente o Que Deixar de Lado', tag: 'vida', isPreview: false },
  { num: 76, title: 'O Verdadeiro Significado do Empreendedorismo', tag: 'carreira', isPreview: false },
  { num: 77, title: 'Se você não está se envergonhando regularmente, não está se esforçando o suficiente', tag: 'motivação', isPreview: false },
  { num: 78, title: 'O Valor de Manter Altos Padrões em um Mundo de Conformidade', tag: 'identidade', isPreview: false },
  { num: 79, title: 'Assumindo o Controle — Protegendo-se de Manipulações', tag: 'bem-estar', isPreview: false },
  { num: 80, title: 'O Impacto da Solidão nas Escolhas de Relacionamentos', tag: 'relacionamentos', isPreview: false },
  { num: 81, title: 'Você não deve afeto à sua família se eles estiverem sendo abusivos', tag: 'bem-estar', isPreview: false },
  { num: 82, title: 'Cuidando da sua Saúde Mental em um Mundo de Padrões Irreais', tag: 'saúde mental', isPreview: false },
  { num: 83, title: 'Cumprir suas promessas é o primeiro passo para elevar sua autoestima', tag: 'autoestima', isPreview: false },
  { num: 84, title: 'Acredite na sua jornada, confie no seu tempo, você é o bastante', tag: 'motivação', isPreview: false },
  { num: 85, title: 'Mensagem ao Leitor', tag: 'encerramento', isPreview: false },
];

function normalizeText(s) {
  return s.toLowerCase()
    .replace(/[àáâãä]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const fullText = fs.readFileSync('/tmp/book_full.txt', 'utf8');
  // Split by form feed (page breaks)
  const pages = fullText.split('\f');
  
  // Find chapter boundaries - look for number patterns followed by content
  // Build a list of (chapter_num, start_page_index) pairs
  
  // First, find the intro start - it comes after the TOC
  // The TOC ends and INTRODUÇÃO starts
  let introPageIdx = -1;
  for (let i = 0; i < pages.length; i++) {
    const pg = pages[i];
    if (pg.includes('INTRODUÇÃO') || pg.includes('INTRODUCAO') || pg.includes('Introdução')) {
      // Make sure this is the actual content page not the TOC
      if (pg.includes('filmes') || pg.includes('realidade') || pg.includes('Os filmes')) {
        introPageIdx = i;
        break;
      }
    }
  }
  
  if (introPageIdx === -1) {
    // Try to find it by looking for "9\n\n" pattern after TOC
    for (let i = 3; i < pages.length; i++) {
      const pg = pages[i];
      if (/INTRODU/i.test(pg)) {
        introPageIdx = i;
        break;
      }
    }
  }
  
  console.log(`Intro found at page index: ${introPageIdx}`);
  console.log('Total pages:', pages.length);
  
  // Build chapter-to-page-index map
  // Strategy: for each chapter number N, find the first page after introPageIdx
  // that has a line with just the number N alone
  const chapterPageMap = {}; // chapter num -> page index
  
  // Mark intro
  chapterPageMap[0] = introPageIdx;
  
  // For chapters 1-84, look for the page that starts with the number
  for (let i = introPageIdx + 1; i < pages.length; i++) {
    const pg = pages[i].trim();
    const lines = pg.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) continue;
    
    const firstLine = lines[0];
    // Match lines that are just a number (chapter number)
    const numMatch = firstLine.match(/^(\d+)$/);
    if (numMatch) {
      const chapNum = parseInt(numMatch[1]);
      if (chapNum >= 1 && chapNum <= 85 && !chapterPageMap[chapNum]) {
        chapterPageMap[chapNum] = i;
      }
    }
  }
  
  console.log('Chapter page map:', JSON.stringify(chapterPageMap));
  
  // Extract content for each chapter
  const chapters = [];
  
  for (let idx = 0; idx < TOC.length; idx++) {
    const chap = TOC[idx];
    const startPage = chapterPageMap[chap.num];
    
    if (startPage === undefined) {
      console.log(`Warning: Chapter ${chap.num} (${chap.title}) not found in text`);
      chapters.push({ ...chap, content: chap.title, excerpt: chap.title.slice(0, 150) });
      continue;
    }
    
    // Find end page (start of next chapter)
    let endPage = pages.length;
    for (let nextIdx = idx + 1; nextIdx < TOC.length; nextIdx++) {
      const nextChapPage = chapterPageMap[TOC[nextIdx].num];
      if (nextChapPage !== undefined) {
        endPage = nextChapPage;
        break;
      }
    }
    
    // Collect all page text from startPage to endPage
    const contentPages = pages.slice(startPage, endPage);
    let rawContent = contentPages.join('\n').trim();
    
    // Clean up: remove page numbers (standalone numbers at end of lines)
    rawContent = rawContent
      .replace(/^\d+\n/gm, '') // remove leading page numbers
      .replace(/\n\d+\n/g, '\n') // remove inline page numbers
      .replace(/\n\d+$/gm, '') // remove trailing page numbers
      .replace(/\n{3,}/g, '\n\n') // max 2 consecutive newlines
      .trim();
    
    // Remove the chapter number at the start if present
    rawContent = rawContent.replace(/^\d+\s*\n\s*/, '');
    
    // Get excerpt (first 200 chars of actual content, skip the title lines)
    const lines = rawContent.split('\n').filter(l => l.trim().length > 0);
    let excerptStart = 0;
    // Skip lines that look like the title
    while (excerptStart < lines.length && lines[excerptStart].length < 100 && excerptStart < 4) {
      excerptStart++;
    }
    const excerptText = lines.slice(excerptStart, excerptStart + 3).join(' ').slice(0, 250);
    
    chapters.push({
      ...chap,
      content: rawContent,
      excerpt: excerptText || chap.title,
    });
  }
  
  // Connect to DB and insert
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  // Clear existing chapters
  await client.query('DELETE FROM book_chapters');
  console.log('Cleared existing chapters');
  
  // Insert chapters
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    await client.query(
      `INSERT INTO book_chapters ("order", title, tag, excerpt, content, is_preview, page_type, pdf_page)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        i + 1,
        ch.title,
        ch.tag,
        ch.excerpt,
        ch.content,
        ch.isPreview,
        ch.num === 0 ? 'intro' : ch.num === 85 ? 'mensagem' : 'chapter',
        chapterPageMap[ch.num] || null,
      ]
    );
    console.log(`Inserted chapter ${ch.num}: ${ch.title.slice(0, 60)}`);
  }
  
  await client.end();
  console.log('\nDone! Inserted', chapters.length, 'chapters.');
}

main().catch(e => { console.error(e); process.exit(1); });

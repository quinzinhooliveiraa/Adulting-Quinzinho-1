/**
 * Restaurar capítulos do livro a partir do seed guardado.
 * Uso: node script/restore_chapters.cjs
 *
 * Este script limpa a tabela book_chapters e re-importa todos os 86 capítulos
 * com formatação, capítulos gratuitos e subtítulos preservados.
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  await client.connect();

  const seedPath = path.join(__dirname, "book_chapters_seed.json");
  if (!fs.existsSync(seedPath)) {
    console.error("Ficheiro seed não encontrado:", seedPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  console.log(`Restaurando ${data.length} capítulos...`);

  await client.query("DELETE FROM book_chapters");

  let ok = 0;
  for (const ch of data) {
    await client.query(
      `INSERT INTO book_chapters
         (id, "order", title, tag, excerpt, content, is_preview, page_type, pdf_page)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        ch.id,
        ch.order,
        ch.title,
        ch.tag || "",
        ch.excerpt || "",
        ch.content || "",
        ch.isPreview ?? false,
        ch.pageType || "chapter",
        ch.pdfPage || null,
      ]
    );
    ok++;
    if (ok % 10 === 0) console.log(`  ${ok}/${data.length}...`);
  }

  await client.query(
    "SELECT setval('book_chapters_id_seq', (SELECT MAX(id) FROM book_chapters))"
  );

  console.log(`\nRestauração completa: ${ok} capítulos.`);
  console.log(`  - Gratuitos: ${data.filter(c => c.isPreview).length}`);
  console.log(`  - Com subtítulo: ${data.filter(c => c.excerpt && c.excerpt.trim()).length}`);
  await client.end();
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});

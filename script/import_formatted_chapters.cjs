const { Client } = require("pg");
const fs = require("fs");

async function main() {
  const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
  await client.connect();

  const data = JSON.parse(
    fs.readFileSync("attached_assets/chapters_export_1775105000430.json", "utf8")
  );

  console.log(`Importando ${data.length} capítulos com formatação...`);

  // Clear existing chapters
  await client.query("DELETE FROM book_chapters");
  console.log("Tabela limpa.");

  let success = 0;
  for (const ch of data) {
    await client.query(
      `INSERT INTO book_chapters
         (id, "order", title, tag, excerpt, content, is_preview, page_type, pdf_page, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
        ch.createdAt || new Date().toISOString(),
      ]
    );
    console.log(`  ✓ [${ch.order}] ${ch.title.substring(0, 60)}`);
    success++;
  }

  // Reset sequence so future inserts don't conflict
  await client.query(
    "SELECT setval('book_chapters_id_seq', (SELECT MAX(id) FROM book_chapters))"
  );

  console.log(`\nImportação completa: ${success}/${data.length} capítulos.`);
  await client.end();
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});

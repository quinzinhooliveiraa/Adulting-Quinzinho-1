import { execSync } from "child_process";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

const PDF = "./attached_assets/EBOOK_-_CASA_DOS_20_Refletindo_sobre_os_Desafios_da_Transição__1774559232117.pdf";

function cleanPage(text: string): string {
  return text.split("\n").filter(line => {
    const t = line.trim();
    if (!t) return true;
    if (/^\d{1,3}$/.test(t)) return false;
    if (/^\d(\s\d)+$/.test(t)) return false;
    if (/^([AÁÂÃBCÇDEÉÊFGHIÍJKLMNOÓÔÕPQRSTUÚVWXYZ]\s){4,}/.test(t)) return false;
    if (/^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇÜ\s]+$/.test(t) && t.replace(/\s/g, "").length <= 20 && / [A-ZÁÉÍÓÚÀÂÊÔÃÕÇÜ]/.test(t)) return false;
    return true;
  }).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function run() {
  const pages: string[] = [];
  for (let p = 171; p <= 175; p++) {
    try {
      const raw = execSync(`pdftotext -f ${p} -l ${p} -raw "${PDF}" -`, { encoding: "utf8" });
      const cleaned = cleanPage(raw);
      if (cleaned.trim()) pages.push(cleaned);
    } catch (_) {}
  }
  const content = pages.join("\f");
  await db.execute(sql`UPDATE book_chapters SET content = ${content} WHERE "order" = 84`);
  console.log(`Updated chapter 84: ${pages.length} pages, ${content.length} chars`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

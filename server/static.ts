import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  app.use("/{*path}", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = await fs.promises.readFile(indexPath, "utf-8");

    const sharedMatch = req.originalUrl.match(/^\/shared\/([a-zA-Z0-9_-]+)/);
    if (sharedMatch) {
      try {
        const entry = await storage.getEntryBySlug(sharedMatch[1]);
        if (entry) {
          const title = `Reflexão de ${entry.authorName} — Casa dos 20`;
          const desc = entry.text.replace(/[#*>\[\]!()]/g, "").replace(/\s+/g, " ").slice(0, 155).trim() + "…";
          const pageUrl = `https://acasados20.com.br/shared/${sharedMatch[1]}`;
          const safeTitle = title.replace(/"/g, "&quot;");
          const safeDesc = desc.replace(/"/g, "&quot;");
          const safeUrl = pageUrl.replace(/"/g, "&quot;");

          html = html
            .replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`)
            .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${safeUrl}">`)
            .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${safeTitle}">`)
            .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${safeDesc}">`)
            .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${safeUrl}">`)
            .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article">`)
            .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${safeTitle}">`)
            .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${safeDesc}">`);
        }
      } catch {}
    }

    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });
}

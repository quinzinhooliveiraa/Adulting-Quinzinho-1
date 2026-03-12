export type ShareImageTheme = "dark" | "light";
export type ShareImageType = "reflection" | "question" | "reminder";

interface ShareImageOptions {
  text: string;
  theme?: ShareImageTheme;
  type?: ShareImageType;
}

export function generateShareImage({ text, theme = "dark", type = "reflection" }: ShareImageOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isDark = theme === "dark";
  const bg = isDark ? "#1a1410" : "#f5f0e8";
  const textColor = isDark ? "#f0ebe3" : "#1a1410";
  const accent = isDark ? "rgba(196, 164, 120, 0.5)" : "rgba(120, 90, 50, 0.4)";
  const accentStrong = isDark ? "rgba(196, 164, 120, 0.9)" : "rgba(100, 70, 30, 0.85)";
  const accentSoft = isDark ? "rgba(196, 164, 120, 0.5)" : "rgba(120, 90, 50, 0.5)";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.textAlign = "center";

  const cx = 540;
  ctx.fillStyle = accent;
  const starY = 180;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx, starY);
    ctx.lineTo(cx + Math.cos(angle) * 28, starY + Math.sin(angle) * 28);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = accent;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx + 20, starY - 20, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = "italic 46px Georgia, serif";
  const maxWidth = 820;
  const lineHeight = 66;
  const quoteText = type === "question" ? text : `"${text}"`;
  const words = quoteText.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim()) lines.push(line.trim());

  const totalH = lines.length * lineHeight;
  let y = (1080 - totalH) / 2 + 40;
  for (const l of lines) {
    ctx.fillText(l, cx, y);
    y += lineHeight;
  }

  const brandY = 1080 - 150;
  ctx.fillStyle = accentSoft;
  ctx.fillRect(cx - 40, brandY - 30, 80, 1);

  ctx.fillStyle = accentStrong;
  ctx.font = "600 18px sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("CASA DOS 20", cx, brandY);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = accentSoft;
  ctx.font = "italic 16px Georgia, serif";
  const subtitle = type === "question"
    ? "Pergunta do App"
    : "Reflexões para a Vida Adulta";
  ctx.fillText(subtitle, cx, brandY + 30);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `casa-dos-20-${new Date().toISOString().split("T")[0]}.png`;
  link.click();
}

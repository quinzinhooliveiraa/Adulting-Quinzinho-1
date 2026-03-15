import { useState, useEffect } from "react";
import { X, Plus, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export function PwaInstallPrompt() {
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => {
    const ts = localStorage.getItem("casa-pwa-prompt-dismissed");
    if (!ts) return false;
    const diff = Date.now() - parseInt(ts, 10);
    return diff < 24 * 60 * 60 * 1000;
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (canInstall && !dismissed && !installed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [canInstall, dismissed, installed]);

  if (!visible) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    localStorage.setItem("casa-pwa-prompt-dismissed", String(Date.now()));
  };

  const handleInstall = async () => {
    await promptInstall();
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-[90] animate-in slide-in-from-bottom-4 fade-in duration-500"
      data-testid="pwa-install-prompt"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-md mx-auto">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Smartphone size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Instalar App</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Adicione à tela inicial para acesso rápido
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all"
          data-testid="button-pwa-install"
        >
          <Plus size={14} />
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-testid="button-pwa-dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

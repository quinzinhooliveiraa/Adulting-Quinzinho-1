import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralData {
  code: string;
  link: string;
  invited: number;
  converted: number;
}

interface ReferralCardProps {
  hasEngaged?: boolean;
}

export default function ReferralCard({ hasEngaged = false }: ReferralCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referral/me"],
    enabled: !!user && hasEngaged,
  });

  const handleCopy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!data?.link) return;
    const shareData = {
      title: "Casa dos 20",
      text: "estou usando o Casa dos 20 e está me ajudando muito. acho que você ia gostar.",
      url: data.link,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (!user || !hasEngaged || isLoading || !data) return null;

  return (
    <div
      data-testid="card-referral"
      className="rounded-2xl px-4 py-4 flex flex-col gap-3 bg-muted/50 border border-border"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground leading-snug">
          tem alguém que você pensou enquanto escrevia isso?
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          chama essa pessoa pra viver isso com você
        </p>
      </div>

      <Button
        variant="outline"
        className="w-full font-medium"
        onClick={handleShare}
        data-testid="button-share-referral"
      >
        {copied
          ? <><Check className="h-4 w-4 mr-2" />link copiado</>
          : <><Share2 className="h-4 w-4 mr-2" />continuar com alguém</>
        }
      </Button>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground/70">
          quando alguém entrar, você ganha 1 mês
        </p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="button-copy-referral"
          aria-label="Copiar link"
        >
          {copied
            ? <Check className="h-3 w-3" />
            : <Copy className="h-3 w-3" />
          }
          <span>{copied ? "copiado" : "copiar link"}</span>
        </button>
      </div>
    </div>
  );
}

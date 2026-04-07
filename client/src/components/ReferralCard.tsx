import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Copy, Share2, Check, Users, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferralData {
  code: string;
  link: string;
  invited: number;
  converted: number;
}

export default function ReferralCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referral/me"],
    enabled: !!user,
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
      text: "Estou a usar o Casa dos 20 e está a mudar a minha vida! Experimenta, é uma aplicação de crescimento pessoal baseada no livro.",
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

  if (!user || isLoading || !data) return null;

  return (
    <div
      data-testid="card-referral"
      className="rounded-md overflow-hidden bg-primary text-primary-foreground"
    >
      {/* Header — always visible */}
      <button
        className="w-full text-left px-4 pt-4 pb-3 flex items-start gap-3"
        onClick={() => setExpanded(v => !v)}
        data-testid="button-referral-toggle"
        aria-expanded={expanded}
      >
        <div className="bg-primary-foreground/20 rounded-md p-1.5 shrink-0 mt-0.5">
          <Gift className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm leading-tight">
              Convida amigos e ganha 1 mês grátis por cada um
            </p>
            {expanded
              ? <ChevronUp className="h-4 w-4 shrink-0 opacity-70" />
              : <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            }
          </div>
          {/* Stats pill — always visible */}
          {(data.invited > 0 || data.converted > 0) && (
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-xs opacity-80">
                <Users className="h-3 w-3" />
                <span data-testid="stat-invited">{data.invited} convidado{data.invited !== 1 ? "s" : ""}</span>
              </span>
              {data.converted > 0 && (
                <span className="flex items-center gap-1 text-xs opacity-80">
                  <Star className="h-3 w-3" />
                  <span data-testid="stat-converted">{data.converted} {data.converted === 1 ? "prémio ganho" : "prémios ganhos"}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-primary-foreground/20 pt-3">
          <p className="text-sm opacity-85 leading-snug">
            Partilha o teu link. Por cada amigo que criar conta e subscrever, recebes <strong>30 dias de premium</strong> automaticamente, sem limite de convites!
          </p>

          {/* Link row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-md bg-primary-foreground/15 px-3 py-2">
              <p
                className="text-xs font-mono truncate opacity-90 select-all"
                data-testid="text-referral-link"
              >
                {data.link}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopy}
              data-testid="button-copy-referral"
              aria-label="Copiar link"
              className="text-primary-foreground shrink-0"
            >
              {copied
                ? <Check className="h-4 w-4" />
                : <Copy className="h-4 w-4" />
              }
            </Button>
          </div>

          {/* Share CTA */}
          <Button
            variant="secondary"
            className="w-full font-semibold"
            onClick={handleShare}
            data-testid="button-share-referral"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {copied ? "Link copiado!" : "Partilhar convite agora"}
          </Button>
        </div>
      )}
    </div>
  );
}

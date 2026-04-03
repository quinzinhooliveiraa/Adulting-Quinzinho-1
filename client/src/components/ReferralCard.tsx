import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Copy, Share2, Check, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReferralData {
  code: string;
  link: string;
  invited: number;
  converted: number;
}

export default function ReferralCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referral/me"],
    enabled: !!user,
  });

  const handleCopy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!data?.link) return;
    const shareData = {
      title: "Casa dos 20",
      text: "Estou a usar o Casa dos 20 e adoro! Experimenta comigo — é uma aplicação de crescimento pessoal baseada no livro.",
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

  if (!user || isLoading) return null;
  if (!data) return null;

  return (
    <Card data-testid="card-referral" className="mx-4 mb-4">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 shrink-0">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm mb-0.5">Convida e ganha premium</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Por cada amigo que convidares e subscrever, ganhas <strong>30 dias de premium</strong> — acumuláveis!
            </p>

            {/* Link + copy */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 min-w-0 rounded-md border border-border bg-muted/50 px-3 py-1.5">
                <p
                  className="text-xs text-muted-foreground truncate font-mono select-all"
                  data-testid="text-referral-link"
                >
                  {data.link}
                </p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                data-testid="button-copy-referral"
                aria-label="Copiar link"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            {/* Share button */}
            <Button
              className="w-full"
              onClick={handleShare}
              data-testid="button-share-referral"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partilhar convite
            </Button>

            {/* Stats */}
            {(data.invited > 0 || data.converted > 0) && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="stat-invited">
                  <Users className="h-3.5 w-3.5" />
                  <span><strong className="text-foreground">{data.invited}</strong> convidados</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="stat-converted">
                  <Gift className="h-3.5 w-3.5" />
                  <span><strong className="text-foreground">{data.converted}</strong> {data.converted === 1 ? "prémio ganho" : "prémios ganhos"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

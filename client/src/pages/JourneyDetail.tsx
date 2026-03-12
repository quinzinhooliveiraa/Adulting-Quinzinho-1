import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  BookOpen,
  PenLine,
  Brain,
  Target,
  Eye,
  Flame,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Crown,
  ArrowUpRight,
  Smartphone,
  Calendar,
  Play,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { JOURNEYS, type JourneyData, type JourneyDay } from "./Journey";

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  reflexao: { icon: Brain, label: "Reflexão", color: "text-violet-500 bg-violet-500/10" },
  acao: { icon: Target, label: "Prática", color: "text-blue-500 bg-blue-500/10" },
  escrita: { icon: PenLine, label: "Escrita", color: "text-amber-500 bg-amber-500/10" },
  meditacao: { icon: Eye, label: "Meditação", color: "text-emerald-500 bg-emerald-500/10" },
  desafio: { icon: Flame, label: "Desafio", color: "text-red-500 bg-red-500/10" },
  leitura: { icon: BookOpen, label: "Leitura", color: "text-cyan-500 bg-cyan-500/10" },
  app: { icon: Smartphone, label: "No App", color: "text-primary bg-primary/10" },
};

function JourneyStartConfirm({ journey, onStart }: { journey: JourneyData; onStart: () => void }) {
  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500" data-testid="journey-start-confirm">
      <div
        className="relative pt-14 pb-8 px-6"
        style={{
          background: `linear-gradient(135deg, ${journey.gradientFrom}20, ${journey.gradientTo}10)`,
        }}
      >
        <Link href="/journey" className="inline-block p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors" data-testid="button-back-start">
          <ChevronLeft size={24} className="text-foreground" />
        </Link>
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: journey.gradientFrom }}>
            {journey.subtitle}
          </p>
          <h1 className="text-2xl font-serif text-foreground">{journey.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{journey.description}</p>
        </div>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${journey.gradientFrom}, ${journey.gradientTo})` }}
            >
              <Calendar size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{journey.totalDays} dias de transformação</p>
              <p className="text-[11px] text-muted-foreground">5-20 min por dia</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Reflexão", "Escrita", "Meditação", "Desafios", "Prática"].map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          Pronto para começar? Cada dia traz uma nova atividade pensada para te ajudar a crescer.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={onStart}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${journey.gradientFrom}, ${journey.gradientTo})` }}
          data-testid="button-start-journey"
        >
          <Play size={16} />
          Começar Jornada
        </button>
      </div>
    </div>
  );
}

export default function JourneyDetail() {
  const [, params] = useRoute("/journey/:id");
  const journeyId = params?.id || "";
  const journey = JOURNEYS.find((j) => j.id === journeyId);
  const { user } = useAuth();
  const isPremium = user?.hasPremium || user?.role === "admin";
  const [, navigate] = useLocation();

  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [animatingDay, setAnimatingDay] = useState<string | null>(null);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  useEffect(() => {
    if (!journeyId) return;
    fetch("/api/journey/progress", { credentials: "include" })
      .then((r) => r.json())
      .then((data: any[]) => {
        const p = data.find((d) => d.journeyId === journeyId);
        if (p) {
          setCompletedDays(p.completedDays);
        } else {
          setShowStartConfirm(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [journeyId]);

  useEffect(() => {
    if (!journey || loading) return;
    const firstIncomplete = journey.days.findIndex((d) => !completedDays.includes(d.id));
    if (firstIncomplete >= 0) {
      setExpandedWeek(Math.floor(firstIncomplete / 7));
    } else {
      setExpandedWeek(Math.floor((journey.days.length - 1) / 7));
    }
  }, [journey, loading, completedDays.length === 0]);

  if (!journey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Jornada não encontrada</p>
          <Link href="/journey" className="text-primary text-sm font-medium">
            Voltar às jornadas
          </Link>
        </div>
      </div>
    );
  }

  const handleStartJourney = async () => {
    try {
      await fetch("/api/journey/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ journeyId }),
      });
      setShowStartConfirm(false);
      setCompletedDays([]);
    } catch {}
  };

  if (showStartConfirm && !loading) {
    return <JourneyStartConfirm journey={journey} onStart={handleStartJourney} />;
  }

  const progress = Math.round((completedDays.length / journey.totalDays) * 100);
  const isCompleted = completedDays.length >= journey.totalDays;

  const toggleDay = async (dayId: string) => {
    if (!isPremium) return;
    const isCompleting = !completedDays.includes(dayId);
    setAnimatingDay(dayId);

    try {
      const endpoint = isCompleting ? "/api/journey/complete-day" : "/api/journey/uncomplete-day";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ journeyId, dayId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedDays(data.completedDays);
      }
    } catch {}
    setTimeout(() => setAnimatingDay(null), 300);
  };

  const weeks: JourneyDay[][] = [];
  for (let i = 0; i < journey.days.length; i += 7) {
    weeks.push(journey.days.slice(i, i + 7));
  }

  const streakCount = (() => {
    let streak = 0;
    for (let i = journey.days.length - 1; i >= 0; i--) {
      if (completedDays.includes(journey.days[i].id)) streak++;
      else break;
    }
    return streak;
  })();

  return (
    <div className="min-h-screen bg-background pb-24 animate-in slide-in-from-right duration-500" data-testid="page-journey-detail">
      <div
        className="relative pt-14 pb-6 px-6"
        style={{
          background: `linear-gradient(135deg, ${journey.gradientFrom}15, ${journey.gradientTo}08)`,
        }}
      >
        <Link href="/journey" className="inline-block p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors" data-testid="button-back-journey">
          <ChevronLeft size={24} className="text-foreground" />
        </Link>

        <div className="mt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: journey.gradientFrom }}>
                {journey.subtitle}
              </p>
              <h1 className="text-2xl font-serif text-foreground" data-testid="text-journey-detail-title">
                {journey.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">{journey.description}</p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${journey.gradientFrom}, ${journey.gradientTo})` }}
            >
              {isCompleted ? (
                <Trophy size={24} className="text-white" />
              ) : (
                <span className="text-white text-lg font-bold">{progress}%</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-muted-foreground font-medium">{completedDays.length} de {journey.totalDays} dias</span>
            {streakCount > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Flame size={12} />
                <span className="font-semibold">{streakCount} dias seguidos</span>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {!isPremium && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Conteúdo Premium</span>
          </div>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
            Assine o plano premium (R$9,90/mês) para completar desafios e acompanhar seu progresso.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-6 mt-6 space-y-3">
          {!isCompleted && isPremium && (() => {
            const nextDay = journey.days.find((d) => !completedDays.includes(d.id));
            if (!nextDay) return null;
            const config = TYPE_CONFIG[nextDay.type] || TYPE_CONFIG.reflexao;
            const TypeIcon = config.icon;
            return (
              <div
                className="p-4 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-3 mb-2"
                data-testid="today-activity"
              >
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-primary" />
                  <span className="text-[11px] uppercase tracking-[0.12em] font-bold text-primary">Atividade de Hoje</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                    <TypeIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground">DIA {nextDay.day}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{nextDay.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{nextDay.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => toggleDay(nextDay.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold active:scale-95 transition-all"
                        data-testid="button-complete-today"
                      >
                        <CheckCircle2 size={12} />
                        Marcar como feito
                      </button>
                      {nextDay.appLink && (
                        <button
                          onClick={() => navigate(nextDay.appLink!)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-primary/30 text-primary text-[11px] font-semibold hover:bg-primary/10 transition-colors"
                          data-testid="button-today-applink"
                        >
                          <ArrowUpRight size={11} />
                          Ir para o app
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {isCompleted && (
            <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/20 text-center space-y-2 mb-4 animate-in fade-in duration-500">
              <Trophy size={32} className="text-green-500 mx-auto" />
              <h3 className="font-serif text-lg text-green-700 dark:text-green-400">Jornada Concluída!</h3>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
                Parabéns! Você completou todos os {journey.totalDays} dias. Sua evolução é real.
              </p>
            </div>
          )}

          {weeks.map((week, weekIndex) => {
            const weekCompleted = week.filter((d) => completedDays.includes(d.id)).length;
            const isExpanded = expandedWeek === weekIndex;
            const weekLabel = weekIndex < 4 ? `Semana ${weekIndex + 1}` : `Dias ${weekIndex * 7 + 1}-${Math.min((weekIndex + 1) * 7, journey.totalDays)}`;

            return (
              <div key={weekIndex} className="rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : weekIndex)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  data-testid={`button-week-${weekIndex}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      weekCompleted === week.length
                        ? "bg-green-500/10 text-green-600"
                        : weekCompleted > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {weekCompleted === week.length ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        `${weekCompleted}/${week.length}`
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-foreground">{weekLabel}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {weekCompleted === week.length ? "Completa" : `${weekCompleted} de ${week.length} completos`}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border/50 animate-in slide-in-from-top-2 duration-200">
                    {week.map((day) => {
                      const isDone = completedDays.includes(day.id);
                      const config = TYPE_CONFIG[day.type] || TYPE_CONFIG.reflexao;
                      const TypeIcon = config.icon;
                      const isAnimating = animatingDay === day.id;

                      return (
                        <div
                          key={day.id}
                          className={`p-4 flex items-start gap-3 transition-all ${isAnimating ? "scale-[0.98] opacity-70" : ""}`}
                          data-testid={`day-${day.id}`}
                        >
                          <button
                            onClick={() => toggleDay(day.id)}
                            disabled={!isPremium}
                            className={`mt-0.5 shrink-0 transition-all ${isPremium ? "active:scale-90" : "opacity-50"}`}
                            data-testid={`button-toggle-day-${day.id}`}
                          >
                            {isDone ? (
                              <CheckCircle2 size={22} className="text-green-500" />
                            ) : (
                              <Circle size={22} className="text-muted-foreground/30" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-muted-foreground">DIA {day.day}</span>
                              <div className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center gap-0.5 ${config.color}`}>
                                <TypeIcon size={9} />
                                {config.label}
                              </div>
                            </div>
                            <h4 className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {day.title}
                            </h4>
                            <p className={`text-[11px] mt-0.5 ${isDone ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                              {day.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1">
                                <Clock size={10} className="text-muted-foreground/50" />
                                <span className="text-[10px] text-muted-foreground/50">{day.duration}</span>
                              </div>
                              {day.appLink && !isDone && isPremium && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(day.appLink!);
                                  }}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors"
                                  data-testid={`button-applink-${day.id}`}
                                >
                                  <ArrowUpRight size={10} />
                                  Abrir no app
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

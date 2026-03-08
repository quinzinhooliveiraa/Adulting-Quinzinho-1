import { useState } from "react";
import { Heart, Meh, Frown, Smile, Zap, Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveCheckIn, analyzeCheckIn } from "@/utils/intelligentRecommendation";

interface DailyCheckInProps {
  onComplete?: (mood: string, entry: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const MOODS = [
  { value: "ansioso", label: "Ansioso", icon: Zap, color: "from-yellow-400 to-orange-400" },
  { value: "triste", label: "Triste", icon: Frown, color: "from-blue-400 to-indigo-400" },
  { value: "confuso", label: "Confuso", icon: Meh, color: "from-purple-400 to-pink-400" },
  { value: "vazio", label: "Vazio", icon: Moon, color: "from-gray-400 to-slate-500" },
  { value: "grato", label: "Grato", icon: Heart, color: "from-red-400 to-pink-400" },
  { value: "esperançoso", label: "Esperançoso", icon: Smile, color: "from-green-400 to-emerald-400" },
];

export default function DailyCheckIn({ onComplete, isOpen = true, onClose }: DailyCheckInProps) {
  const [step, setStep] = useState<"mood" | "entry" | "complete">("mood");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [entry, setEntry] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setStep("entry");
  };

  const handleComplete = () => {
    if (selectedMood) {
      const detectedTags = analyzeCheckIn(selectedMood, entry);
      setTags(detectedTags);
      saveCheckIn(selectedMood, entry);
      setStep("complete");
      
      setTimeout(() => {
        onComplete?.(selectedMood, entry);
        onClose?.();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-3xl max-h-[90vh] overflow-y-auto w-full max-w-md animate-in slide-in-from-bottom duration-300">
        {step !== "complete" && (
          <div className="sticky top-0 bg-background flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-serif text-2xl text-foreground">Check-in Diário</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="p-6 space-y-6">
          {step === "mood" && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  Como você está se sentindo hoje?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {MOODS.map((mood) => {
                    const IconComponent = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        onClick={() => handleMoodSelect(mood.value)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                          selectedMood === mood.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={`bg-gradient-to-br ${mood.color} p-3 rounded-xl`}>
                          <IconComponent size={24} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {mood.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {step === "entry" && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  Qual é o contexto? (opcional)
                </p>
                <Textarea
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="O que aconteceu hoje? Qual é a situação?..."
                  className="min-h-32 rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("mood")}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold"
                >
                  Completar Check-in
                </Button>
              </div>
            </>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <Heart size={32} className="text-green-500" />
                </div>
              </div>
              <div>
                <h3 className="font-serif text-2xl text-foreground mb-2">
                  Check-in Registrado!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estou preparando recomendações personalizadas para você...
                </p>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

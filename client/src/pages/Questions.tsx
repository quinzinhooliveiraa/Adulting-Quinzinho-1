import { useState } from "react";
import { Users, LockKeyhole, Sparkles, ArrowRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = [
  { id: 'identity', title: 'Identidade', count: 24, icon: '🎭', color: 'bg-orange-50' },
  { id: 'purpose', title: 'Propósito', count: 18, icon: '🧭', color: 'bg-blue-50' },
  { id: 'relationships', title: 'Relações', count: 32, icon: '🤍', color: 'bg-rose-50' },
  { id: 'uncertainty', title: 'Incerteza', count: 15, icon: '🌫️', color: 'bg-slate-100' },
];

export default function Questions() {
  const [isConversationMode, setIsConversationMode] = useState(false);

  return (
    <div className="px-6 pt-12 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <header className="space-y-4">
        <h1 className="text-3xl font-serif text-foreground">Perguntas Profundas</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Explore questionamentos que te ajudam a se entender melhor e a navegar a transição para a vida adulta.
        </p>
      </header>

      <div className="p-5 rounded-2xl bg-secondary/50 border border-secondary flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">Modo Conversa</h3>
            <p className="text-[11px] text-muted-foreground">Para responder a dois</p>
          </div>
        </div>
        <Switch 
          checked={isConversationMode}
          onCheckedChange={setIsConversationMode}
          data-testid="toggle-conversation-mode"
        />
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">Coleções</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <div 
              key={cat.id} 
              className={`p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer hover:border-primary/30 transition-all group`}
            >
              <div className="text-2xl">{cat.icon}</div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{cat.count} perguntas</p>
              </div>
            </div>
          ))}

          {/* Premium Lock example */}
          <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <LockKeyhole size={24} className="text-muted-foreground" />
            </div>
            <div className="text-2xl opacity-50">💼</div>
            <div className="opacity-50">
              <h3 className="font-medium text-foreground text-sm">Carreira</h3>
              <p className="text-xs text-muted-foreground mt-1">Premium</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-primary text-primary-foreground rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={100} />
        </div>
        <div className="relative z-10">
          <h3 className="font-serif text-xl mb-2">Pergunta Aleatória</h3>
          <p className="text-sm opacity-80 mb-6 max-w-[80%]">
            Deixe o acaso guiar sua próxima reflexão.
          </p>
          <button className="flex items-center space-x-2 text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all">
            <span>Sortear agora</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}

import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, BookOpen, PenLine, Sparkles, Map, LogOut, Sun, Moon, Monitor, Camera, Shield, MessageSquare, X, Send, PanelLeftClose, PanelLeftOpen, Bell, BellOff, Pencil, Check, Crown, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isPushSupported, subscribeToPush, unsubscribeFromPush, isSubscribed as isPushSubscribed } from "@/utils/pushNotifications";

interface MobileLayoutProps {
  children: ReactNode;
}

function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendMutation = useMutation({
    mutationFn: async (data: { type: string; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/feedback", data);
      return res.json();
    },
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-background rounded-2xl p-6 w-full max-w-sm border border-border shadow-2xl text-center animate-in zoom-in-95 duration-300">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-lg font-serif text-foreground mb-1">Enviado!</h3>
          <p className="text-sm text-muted-foreground mb-4">Seu chamado foi recebido. Vamos analisar e responder o mais rápido possível.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm" data-testid="button-close-feedback-sent">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-md border-t sm:border border-border shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-sm font-medium text-foreground">Enviar Feedback</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="flex gap-1.5">
            {[
              { id: "feedback", label: "Feedback" },
              { id: "idea", label: "Ideia" },
              { id: "bug", label: "Bug" },
              { id: "support", label: "Suporte" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                  type === t.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/50 text-muted-foreground border-border"
                }`}
                data-testid={`button-feedback-type-${t.id}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Assunto"
            className="w-full p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="input-feedback-subject"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Descreva sua ideia, problema ou feedback..."
            className="w-full min-h-[120px] p-3 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="textarea-feedback-message"
          />
          {sendMutation.isError && (
            <p className="text-xs text-red-500">Erro ao enviar. Tente novamente.</p>
          )}
        </div>
        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={() => sendMutation.mutate({ type, subject, message })}
            disabled={!subject.trim() || !message.trim() || sendMutation.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="button-send-feedback"
          >
            <Send size={16} />
            {sendMutation.isPending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout, user, refetch } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => isPushSubscribed());
  const [pushLoading, setPushLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("casa-dos-20-sidebar-collapsed") === "true";
  });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleTogglePush = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
      } else {
        const ok = await subscribeToPush();
        setPushEnabled(ok);
      }
    } finally {
      setPushLoading(false);
    }
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("casa-dos-20-sidebar-collapsed", String(next));
  };

  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem("casa-dos-20-profile-photo");
  });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) return;
    setNameSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      if (res.ok) {
        await refetch();
        setEditingName(false);
      }
    } catch {}
    setNameSaving(false);
  };

  const navItems = [
    { href: "/", icon: Home, label: "Hoje" },
    { href: "/journal", icon: PenLine, label: "Diário" },
    { href: "/questions", icon: Sparkles, label: "Perguntas" },
    { href: "/journey", icon: Map, label: "Jornada" },
    { href: "/book", icon: BookOpen, label: "Livro" },
  ];

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("casa-dos-20-user-name");
    localStorage.removeItem("casa-dos-20-needs-onboarding");
    localStorage.removeItem("casa-dos-20-profile-photo");
    window.location.reload();
  };

  const handleManagePlan = async () => {
    setShowMenu(false);
    if (user?.premiumReason === "paid" || user?.premiumReason === "granted") {
      try {
        const portalRes = await fetch("/api/stripe/portal", {
          method: "POST",
          credentials: "include",
        });
        if (portalRes.ok) {
          const portalData = await portalRes.json();
          if (portalData.url) {
            window.location.href = portalData.url;
            return;
          }
        }
      } catch {}
    }
    setLocation("/premium");
  };

  const getPlanLabel = () => {
    if (!user) return "";
    switch (user.premiumReason) {
      case "admin": return "Admin";
      case "paid": return "Premium";
      case "granted": return "Premium";
      case "trial": return "Período de teste";
      case "expired": return "Plano gratuito";
      case "blocked": return "Bloqueado";
      default: return "Plano gratuito";
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo = event.target?.result as string;
        setProfilePhoto(photo);
        localStorage.setItem("casa-dos-20-profile-photo", photo);
      };
      reader.readAsDataURL(file);
    }
  };

  const themeOptions = [
    { id: "light", icon: Sun },
    { id: "dark", icon: Moon },
    { id: "system", icon: Monitor },
  ] as const;

  const userMenuContent = (
    <>
      <div className="p-4 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border border-border bg-muted">
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-foreground/60">{user?.name?.charAt(0).toUpperCase() || "?"}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow border-2 border-background"
            data-testid="button-change-photo"
          >
            <Camera size={9} className="text-primary-foreground" />
          </button>
        </div>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                autoFocus
                className="flex-1 text-sm font-medium text-foreground bg-muted/50 border border-border rounded-lg px-2 py-1 min-w-0"
                placeholder="Seu nome"
                data-testid="input-edit-name"
              />
              <button
                onClick={handleSaveName}
                disabled={nameSaving || nameInput.trim().length < 2}
                className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 disabled:opacity-40"
                data-testid="button-save-name"
              >
                <Check size={14} className="text-primary-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <button
                onClick={() => { setNameInput(user?.name || ""); setEditingName(true); }}
                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-testid="button-edit-name"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      <div className="mx-3 mb-3 p-1 bg-muted rounded-lg flex gap-0.5">
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={cn(
                "flex-1 flex items-center justify-center py-1.5 rounded-md transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`button-theme-${opt.id}`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      <div className="border-t border-border">
        <button
          onClick={handleManagePlan}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-testid="button-manage-plan"
        >
          {user?.hasPremium ? <Crown size={15} className="text-amber-500" /> : <CreditCard size={15} />}
          <span className="flex-1 text-left">Gerenciar Plano</span>
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-full font-medium",
            user?.premiumReason === "paid" || user?.premiumReason === "granted" || user?.premiumReason === "admin"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              : user?.premiumReason === "trial"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                : "bg-muted text-muted-foreground"
          )}>
            {getPlanLabel()}
          </span>
        </button>
        {isPushSupported() && (
          <button
            onClick={handleTogglePush}
            disabled={pushLoading}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            data-testid="button-toggle-push"
          >
            {pushEnabled ? <BellOff size={15} /> : <Bell size={15} />}
            {pushLoading ? "Processando..." : pushEnabled ? "Desativar Notificações" : "Ativar Notificações"}
          </button>
        )}
        <button
          onClick={() => { setShowMenu(false); setShowFeedback(true); }}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          data-testid="button-feedback"
        >
          <MessageSquare size={15} />
          Feedback / Suporte
        </button>
        {user?.role === "admin" && (
          <Link
            href="/admin"
            onClick={() => setShowMenu(false)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-purple-500 hover:bg-muted/50 transition-colors"
            data-testid="link-admin"
          >
            <Shield size={15} />
            Painel Admin
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-red-500 hover:bg-muted/50 transition-colors"
          data-testid="button-logout"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground bg-noise flex">
      {isDesktop && (
        <aside
          className={cn(
            "hidden md:flex flex-col h-screen sticky top-0 bg-background border-r border-border z-50 transition-all duration-300 shrink-0",
            sidebarCollapsed ? "w-[68px]" : "w-[220px]"
          )}
        >
          <div className={cn("flex items-center gap-2 px-4 h-16 border-b border-border", sidebarCollapsed ? "justify-center" : "justify-between")}>
            {!sidebarCollapsed && <span className="font-serif text-lg text-foreground truncate">Casa dos 20</span>}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
              data-testid="button-toggle-sidebar"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <nav className="flex-1 py-4 space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl transition-all duration-200",
                    sidebarCollapsed ? "justify-center p-3" : "px-4 py-3",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  data-testid={`sidebar-link-${item.label.toLowerCase()}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border px-2 py-3 space-y-1">
            <div className="flex items-center gap-2 px-2">
              <NotificationCenter />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all hover:bg-muted",
                  sidebarCollapsed ? "justify-center p-3" : "px-4 py-3"
                )}
                data-testid="button-user-menu"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden border border-border bg-muted shrink-0">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground/70">{user?.name?.charAt(0).toUpperCase() || "?"}</span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-sm text-foreground truncate">{user?.name}</span>
                )}
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute left-full bottom-0 ml-2 bg-background border border-border rounded-xl shadow-lg z-50 w-56 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                    {userMenuContent}
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      )}

      <div className="flex-1 flex justify-center min-h-screen">
        <div className="w-full max-w-md md:max-w-none bg-background min-h-screen relative overflow-hidden flex flex-col transition-all">
          
          {!isDesktop && (
            <div className="absolute top-4 right-4 z-50 flex gap-1.5 items-center">
              <NotificationCenter />
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-primary text-xs font-bold overflow-hidden border border-border/40 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                  data-testid="button-user-menu"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground/70">{user?.name?.charAt(0).toUpperCase() || "?"}</span>
                  )}
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-11 bg-background border border-border rounded-xl shadow-lg z-50 w-56 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {userMenuContent}
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {showFeedback && <FeedbackDialog onClose={() => setShowFeedback(false)} />}

          <main className={cn("flex-1 overflow-y-auto", isDesktop ? "pb-6" : "pb-24")}>
            {children}
          </main>
          
          {!isDesktop && (
            <nav className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border pb-safe z-50">
              <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center w-16 h-full space-y-1">
                      <Icon 
                        size={24} 
                        strokeWidth={isActive ? 2 : 1.5}
                        className={cn(
                          "transition-all duration-300",
                          isActive ? "text-primary scale-110" : "text-muted-foreground"
                        )} 
                      />
                      <span className={cn(
                        "text-[10px] transition-colors",
                        isActive ? "text-primary font-medium" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

import { ReactNode, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Home, BookOpen, PenLine, Sparkles, Map, LogOut, Sun, Moon, Monitor, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem("casa-dos-20-profile-photo");
  });

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
    { id: "light", label: "Claro", icon: Sun },
    { id: "dark", label: "Escuro", icon: Moon },
    { id: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground bg-noise flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        <div className="absolute top-4 right-4 z-50 flex gap-2 items-center">
          <NotificationCenter />
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold hover:bg-primary/20 transition-colors overflow-hidden border border-border/30"
              data-testid="button-user-menu"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "?"
              )}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-11 bg-background border border-border rounded-xl shadow-lg z-50 w-52 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold overflow-hidden border border-border/30">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.charAt(0).toUpperCase() || "?"
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm"
                        data-testid="button-change-photo"
                      >
                        <Camera size={10} className="text-primary-foreground" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Aparência</p>
                    <div className="flex gap-1">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = theme === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setTheme(opt.id)}
                            className={cn(
                              "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted"
                            )}
                            data-testid={`button-theme-${opt.id}`}
                          >
                            <Icon size={14} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    data-testid="button-logout"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
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

        <main className="flex-1 overflow-y-auto pb-24">
          {children}
        </main>
        
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
      </div>
    </div>
  );
}

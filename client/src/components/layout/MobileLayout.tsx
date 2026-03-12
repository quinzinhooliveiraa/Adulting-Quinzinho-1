import { ReactNode, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Home, BookOpen, PenLine, Sparkles, Map, LogOut, Sun, Moon, Monitor, Camera, Shield } from "lucide-react";
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
    { id: "light", icon: Sun },
    { id: "dark", icon: Moon },
    { id: "system", icon: Monitor },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground bg-noise flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
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
                      <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
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

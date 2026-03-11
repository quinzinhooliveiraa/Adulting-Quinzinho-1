import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, BookOpen, PenLine, Sparkles, Map, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

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
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-noise flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        <div className="absolute top-4 right-4 z-50 flex gap-2 items-center">
          <NotificationCenter />
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
              data-testid="button-user-menu"
            >
              {user?.name?.charAt(0).toUpperCase() || "?"}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 bg-background border border-border rounded-xl shadow-lg z-50 w-48 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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

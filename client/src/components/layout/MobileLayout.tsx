import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, BookOpen, PenLine, Sparkles, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Hoje" },
    { href: "/journal", icon: PenLine, label: "Diário" },
    { href: "/questions", icon: Sparkles, label: "Perguntas" },
    { href: "/journey", icon: Map, label: "Jornada" },
    { href: "/book", icon: BookOpen, label: "Livro" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground bg-noise flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
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
                <Link key={item.href} href={item.href}>
                  <a className="flex flex-col items-center justify-center w-16 h-full space-y-1">
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
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

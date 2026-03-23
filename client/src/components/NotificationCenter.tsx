import { useState, useEffect, useRef } from "react";
import { Bell, X, Trash2 } from "lucide-react";
import { getUnreadNotifications, dismissNotification, clearNotifications, Notification } from "@/utils/notificationService";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function pruneOldNotifications() {
  const stored = getUnreadNotifications();
  const now = Date.now();
  const fresh = stored.filter(n => now - n.timestamp < SEVEN_DAYS_MS);
  if (fresh.length !== stored.length) {
    clearNotifications();
    fresh.forEach(n => {
      const all = JSON.parse(localStorage.getItem("casa-dos-20-notifications") || "[]");
      all.push(n);
      localStorage.setItem("casa-dos-20-notifications", JSON.stringify(all));
    });
  }
  return fresh;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setNotifications(pruneOldNotifications());
    const interval = setInterval(() => {
      setNotifications(getUnreadNotifications());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const dropW = 288;
      const dropH = 320;

      let left = rect.left;
      let top = rect.bottom + 8;

      if (left + dropW > viewW - 8) {
        left = viewW - dropW - 8;
      }
      if (left < 8) left = 8;

      if (top + dropH > viewH - 8) {
        top = rect.top - dropH - 8;
      }

      setDropdownStyle({ position: 'fixed', left, top, width: dropW });
    }
  }, [isOpen]);

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    clearNotifications();
    setNotifications([]);
  };

  const unreadCount = notifications.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-muted transition-colors shadow-sm"
        data-testid="button-notifications"
      >
        <Bell size={16} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div
            className="z-[9999] max-h-80 bg-background border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={dropdownStyle}
          >
            <div className="px-4 py-3 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-medium text-foreground">Notificações</h3>
              {unreadCount > 0 ? (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-clear-notifications"
                >
                  <Trash2 size={10} />
                  Limpar tudo
                </button>
              ) : null}
            </div>
            <div className="overflow-y-auto max-h-60">
              {notifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        </div>
                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          data-testid={`button-dismiss-notif-${notif.id}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

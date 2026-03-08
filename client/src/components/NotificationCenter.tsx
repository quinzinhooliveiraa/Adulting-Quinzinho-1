import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { getUnreadNotifications, dismissNotification, clearNotifications, Notification } from "@/utils/notificationService";
import { Button } from "@/components/ui/button";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setNotifications(getUnreadNotifications());
    const interval = setInterval(() => {
      setNotifications(getUnreadNotifications());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 hover:bg-secondary rounded-full transition-colors border border-border"
        title="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-16 w-96 max-h-96 bg-background rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-serif text-lg">Notificações</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 p-4">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <p className="font-bold">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                      </div>
                      <button onClick={() => handleDismiss(notif.id)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Sem notificações</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

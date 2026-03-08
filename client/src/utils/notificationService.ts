export type NotificationType = "checkin" | "journal" | "reminder" | "reflection";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  actionUrl?: string;
  dismissed?: boolean;
}

const NOTIFICATION_STORAGE_KEY = "casa-dos-20-notifications";
const NOTIFICATION_TIMES = {
  checkin: "09:00", // 9 da manhã
  journal: "20:00", // 8 da noite
  reminder: "14:00", // 2 da tarde
};

export function getStoredNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addNotification(notification: Omit<Notification, "id" | "timestamp">): Notification {
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: Date.now(),
  };

  const notifications = getStoredNotifications();
  notifications.push(newNotification);
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
  
  return newNotification;
}

export function dismissNotification(id: string): void {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => 
    n.id === id ? { ...n, dismissed: true } : n
  );
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
}

export function getUnreadNotifications(): Notification[] {
  return getStoredNotifications().filter(n => !n.dismissed);
}

export function clearNotifications(): void {
  localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
}

// Check if should show daily notification
export function shouldShowDailyNotification(type: NotificationType): boolean {
  const key = `casa-dos-20-${type}-shown-today`;
  const shown = localStorage.getItem(key);
  
  if (!shown) {
    localStorage.setItem(key, new Date().toDateString());
    return true;
  }

  return shown !== new Date().toDateString();
}

// Notification messages
export const NOTIFICATION_MESSAGES = {
  checkin: {
    title: "🧠 Como você está?",
    message: "Que tal fazer um check-in rápido do seu dia?",
  },
  journal: {
    title: "✍️ Momento de Reflexão",
    message: "Escrever no diário pode trazer clareza. O que você sente agora?",
  },
  reminder: {
    title: "💪 Lembrete do Dia",
    message: "Você é mais forte do que pensa. Continue assim!",
  },
  reflection: {
    title: "🌟 Reflexão para Hoje",
    message: "Uma mensagem especial baseada em como você está...",
  },
};

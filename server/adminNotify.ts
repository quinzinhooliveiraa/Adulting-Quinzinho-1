import { storage } from "./storage";

async function getWebPush() {
  const m = await import("web-push");
  return m.default || m;
}

async function sendToAdmin(adminId: string, title: string, body: string, url: string = "/admin") {
  try {
    const webpush = await getWebPush();
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || ""
    );

    const subs = await storage.getPushSubscriptions(adminId);
    const payload = JSON.stringify({ title, body, url });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch {
        await storage.deletePushSubscription(adminId, sub.endpoint);
      }
    }
  } catch (err) {
    console.error("[admin-notify] Error:", err);
  }
}

export async function notifyAdminNewUser(userName: string, userEmail: string) {
  try {
    const admins = await storage.getAllUsers();
    for (const admin of admins) {
      if (admin.role === "admin" && admin.adminNotifyNewUser) {
        await sendToAdmin(
          admin.id,
          "Novo Usuário 🎉",
          `${userName} (${userEmail}) acabou de entrar no app`,
          "/admin"
        );
      }
    }
  } catch (err) {
    console.error("[admin-notify] notifyAdminNewUser error:", err);
  }
}

export async function notifyAdminNewSubscription(userName: string, userEmail: string) {
  try {
    const webpush = await getWebPush();
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@example.com",
      process.env.VAPID_PUBLIC_KEY || "",
      process.env.VAPID_PRIVATE_KEY || ""
    );

    const admins = await storage.getAllUsers();
    const payload = JSON.stringify({
      title: "Nova Assinatura 💰",
      body: `${userName} (${userEmail}) assinou o plano premium!`,
      url: "/admin",
      tag: "admin-new-sub",
      sound: "/sounds/cash.wav",
    });

    for (const admin of admins) {
      if (admin.role === "admin" && admin.adminNotifyNewSub) {
        const subs = await storage.getPushSubscriptions(admin.id);
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch {
            await storage.deletePushSubscription(admin.id, sub.endpoint);
          }
        }
      }
    }
  } catch (err) {
    console.error("[admin-notify] notifyAdminNewSubscription error:", err);
  }
}

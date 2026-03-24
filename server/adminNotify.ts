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
    if (subs.length === 0) {
      console.warn(`[admin-notify] No push subscriptions found for admin ${adminId}`);
      return;
    }

    const payload = JSON.stringify({ title, body, url });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        console.log(`[admin-notify] Notification sent to admin ${adminId}`);
      } catch (err: any) {
        const status = err?.statusCode || err?.status;
        console.error(`[admin-notify] Failed to send to admin ${adminId}, status: ${status}`, err?.message);
        if (status === 410 || status === 404) {
          console.log(`[admin-notify] Removing expired subscription for admin ${adminId}`);
          await storage.deletePushSubscription(adminId, sub.endpoint);
        }
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
        if (subs.length === 0) {
          console.warn(`[admin-notify] No push subscriptions for admin ${admin.id} to notify about new subscription`);
        }
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            console.log(`[admin-notify] New subscription notification sent to admin ${admin.id}`);
          } catch (err: any) {
            const status = err?.statusCode || err?.status;
            console.error(`[admin-notify] Failed to send to admin ${admin.id}, status: ${status}`, err?.message);
            if (status === 410 || status === 404) {
              console.log(`[admin-notify] Removing expired subscription for admin ${admin.id}`);
              await storage.deletePushSubscription(admin.id, sub.endpoint);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[admin-notify] notifyAdminNewSubscription error:", err);
  }
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, seedAutoNotifications, processAutoNotifications } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { WebhookHandlers } from "./webhookHandlers";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe-signature" });
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error("STRIPE WEBHOOK ERROR: req.body is not a Buffer");
        return res.status(500).json({ error: "Webhook processing error" });
      }
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(
  express.json({
    limit: "100mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "100mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  (async () => {
    try {
      const { runMigrations } = await import("stripe-replit-sync");
      const { getStripeSync } = await import("./stripeClient");
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        log("Initializing Stripe schema...", "stripe");
        await runMigrations({ databaseUrl, schema: "stripe" });
        log("Stripe schema ready", "stripe");

        const stripeSync = await getStripeSync();
        const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
        await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
        log("Stripe webhook configured", "stripe");

        stripeSync.syncBackfill()
          .then(() => log("Stripe data synced", "stripe"))
          .catch((err: any) => log(`Stripe sync error: ${err.message}`, "stripe"));
      }
    } catch (err: any) {
      log(`Stripe init error (non-fatal): ${err.message}`, "stripe");
    }
  })();

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      seedAutoNotifications()
        .then(() => log("Auto notifications seeded"))
        .catch((err) => log(`Auto notification seed error: ${err}`));

      const runNotificationCycle = async () => {
        try {
          const dueNotifs = await storage.getDueNotifications();
          if (dueNotifs.length > 0) {
            const webpushModule = await import("web-push");
            const webpush = webpushModule.default || webpushModule;
            webpush.setVapidDetails(
              process.env.VAPID_SUBJECT || "mailto:admin@example.com",
              process.env.VAPID_PUBLIC_KEY || "",
              process.env.VAPID_PRIVATE_KEY || ""
            );

            const allSubs = await storage.getAllPushSubscriptions();
            if (allSubs.length > 0) {
              for (const notif of dueNotifs) {
                const payload = JSON.stringify({
                  title: notif.title,
                  body: notif.body,
                  url: notif.url,
                });
                for (const sub of allSubs) {
                  try {
                    await webpush.sendNotification(
                      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                      payload
                    );
                  } catch {
                    await storage.deletePushSubscription(sub.userId, sub.endpoint);
                  }
                }
                await storage.markNotificationSent(notif.id);
              }
              log(`Sent ${dueNotifs.length} scheduled notification(s) to ${allSubs.length} device(s)`);
            }
          }
        } catch (err) {
          log(`Notification scheduler error: ${err}`);
        }

        try {
          await processAutoNotifications();
        } catch (err) {
          log(`Auto notification error: ${err}`);
        }
      };

      setTimeout(runNotificationCycle, 10 * 1000);
      setInterval(runNotificationCycle, 60 * 1000);
    },
  );
})();

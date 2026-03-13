import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { storage } from "./storage";
import Stripe from "stripe";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
        "Received type: " + typeof payload + ". " +
        "This usually means express.json() parsed the body before reaching this handler. " +
        "FIX: Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const stripe = await getUncachableStripeClient();
    const event = JSON.parse(payload.toString()) as Stripe.Event;

    try {
      await WebhookHandlers.handleSubscriptionEvent(event, stripe);
    } catch (err: any) {
      console.error(`[stripe webhook] Error handling event ${event.type}:`, err.message);
    }
  }

  static async handleSubscriptionEvent(event: Stripe.Event, stripe: Stripe): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") return;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) {
          console.log(`[stripe] No user found for customer ${customerId}`);
          return;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const periodEnd = new Date(subscription.current_period_end * 1000);

        await storage.updateUser(user.id, {
          stripeSubscriptionId: subscriptionId,
          isPremium: true,
          premiumUntil: periodEnd,
        });
        console.log(`[stripe] User ${user.email} activated premium until ${periodEnd.toISOString()}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) return;

        const status = subscription.status;
        const periodEnd = new Date(subscription.current_period_end * 1000);

        if (status === "active" || status === "trialing") {
          await storage.updateUser(user.id, {
            stripeSubscriptionId: subscription.id,
            isPremium: true,
            premiumUntil: periodEnd,
          });
          console.log(`[stripe] User ${user.email} subscription ${status}, premium until ${periodEnd.toISOString()}`);
        } else if (status === "past_due" || status === "unpaid") {
          await storage.updateUser(user.id, {
            isPremium: false,
            premiumUntil: null,
          });
          console.log(`[stripe] User ${user.email} subscription ${status}, premium revoked`);
        } else if (status === "canceled") {
          await storage.updateUser(user.id, {
            isPremium: false,
            premiumUntil: periodEnd,
            stripeSubscriptionId: null,
          });
          console.log(`[stripe] User ${user.email} subscription canceled, access until ${periodEnd.toISOString()}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) return;

        await storage.updateUser(user.id, {
          isPremium: false,
          premiumUntil: null,
          stripeSubscriptionId: null,
        });
        console.log(`[stripe] User ${user.email} subscription deleted, premium revoked`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) return;
        const customerId = invoice.customer as string;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) return;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const periodEnd = new Date(subscription.current_period_end * 1000);

        await storage.updateUser(user.id, {
          isPremium: true,
          premiumUntil: periodEnd,
        });
        console.log(`[stripe] User ${user.email} invoice paid, premium renewed until ${periodEnd.toISOString()}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await storage.getUserByStripeCustomerId(customerId);
        if (!user) return;

        console.log(`[stripe] User ${user.email} payment failed`);
        break;
      }
    }
  }
}

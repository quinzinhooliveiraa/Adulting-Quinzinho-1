import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe/config", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.publishableKey) throw new Error("Stripe não configurado.");
        return loadStripe(d.publishableKey);
      })
      .catch((err) => {
        stripePromise = null;
        throw err;
      });
  }
  return stripePromise;
}

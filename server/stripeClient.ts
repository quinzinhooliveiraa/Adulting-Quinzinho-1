import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

async function getStripeCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found");
  }

  const res = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=stripe",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  );
  const data = await res.json();
  const connection = data.items?.[0];

  const apiKey = connection?.settings?.stripe_api_key || connection?.settings?.secret;

  if (!apiKey) {
    throw new Error("Stripe not connected");
  }

  return { apiKey };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { apiKey } = await getStripeCredentials();
  return new Stripe(apiKey, { apiVersion: "2025-04-30.basil" as any });
}

export async function getStripeSync(): Promise<StripeSync> {
  const { apiKey } = await getStripeCredentials();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  return new StripeSync({ stripeSecretKey: apiKey, databaseUrl });
}

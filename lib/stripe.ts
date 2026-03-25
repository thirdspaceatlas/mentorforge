import Stripe from "stripe";

const API_VERSION = "2026-02-25.clover" as const;

let stripeInstance: Stripe | null = null;

/**
 * Lazily creates the Stripe client when first needed so missing env at import
 * time does not crash the module. Throws if STRIPE_SECRET_KEY is unset.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  stripeInstance ??= new Stripe(key, { apiVersion: API_VERSION });
  return stripeInstance;
}

/** Map Stripe / config errors to HTTP status + message for JSON API responses. */
export function stripeCheckoutErrorResponse(err: unknown): { status: number; error: string } {
  if (err instanceof Error && err.message === "STRIPE_SECRET_KEY is not set") {
    return {
      status: 400,
      error: "Payment is not configured (STRIPE_SECRET_KEY is missing)."
    };
  }

  if (err instanceof Stripe.errors.StripeError) {
    const message = err.message || "Stripe request failed";
    switch (err.type) {
      case "StripeAuthenticationError":
      case "StripePermissionError":
        return { status: 401, error: message };
      case "StripeRateLimitError":
        return { status: 429, error: message };
      case "StripeConnectionError":
      case "StripeAPIError":
        return { status: 503, error: message };
      default:
        return { status: 400, error: message };
    }
  }

  const message =
    err instanceof Error ? err.message : "Unexpected error creating checkout session";
  return { status: 500, error: message };
}

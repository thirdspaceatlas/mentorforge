import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripeCheckoutErrorResponse } from "@/lib/stripe";
import { calculateLevelPassAccessExpiresAt } from "@/lib/plan/exam-expiry";
import { getRequestOriginUrl } from "@/lib/site";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { checkoutBodySchema } from "@/lib/validation/checkout";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { supabase, applyCookiesToResponse } = createSupabaseRouteHandlerClient(req);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return applyCookiesToResponse(
      NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return applyCookiesToResponse(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    );
  }

  const parsed = checkoutBodySchema.safeParse(json);
  if (!parsed.success) {
    return applyCookiesToResponse(
      NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      )
    );
  }

  const body = parsed.data;
  const origin = getRequestOriginUrl(req);

  try {
    const stripe = getStripe();

    if (body.planKey === "level_pass") {
      const accessExpiresAt = calculateLevelPassAccessExpiresAt(body.examWindow, body.examYear);
      const metadata: Record<string, string> = {
        userId: user.id,
        planKey: "level_pass",
        examWindow: body.examWindow,
        examYear: String(body.examYear),
        levelUnlocked: body.levelUnlocked,
        accessExpiresAt: accessExpiresAt.toISOString()
      };

      console.log(
        "[checkout] Stripe Checkout session.metadata (full, level_pass):",
        JSON.stringify(metadata, null, 2)
      );

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: user.email ?? undefined,
        allow_promotion_codes: true,
        line_items: [{ price: body.priceId, quantity: 1 }],
        metadata,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`
      });

      return applyCookiesToResponse(
        NextResponse.json({ url: session.url, sessionId: session.id })
      );
    }

    const metadata: Record<string, string> = {
      userId: user.id,
      planKey: "all_access"
    };

    console.log(
      "[checkout] Stripe Checkout session.metadata (full, all_access):",
      JSON.stringify(metadata, null, 2)
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      allow_promotion_codes: true,
      line_items: [{ price: body.priceId, quantity: 1 }],
      metadata,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`
    });

    return applyCookiesToResponse(
      NextResponse.json({ url: session.url, sessionId: session.id })
    );
  } catch (err) {
    const { status, error } = stripeCheckoutErrorResponse(err);
    console.error("[checkout] Stripe error:", error, err);
    return applyCookiesToResponse(NextResponse.json({ error }, { status }));
  }
}
